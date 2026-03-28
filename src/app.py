import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query, Request
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.api import get_ended_football_events, get_live_football_events, get_upcoming_football_events
from src.engine import (
    build_analysis_snapshot,
    find_brasileirao_teams_in_message,
    find_matchup_event_context,
    find_team_event_context,
    find_brasileirao_team_in_message,
    format_matchup_event_context,
    format_team_event_context,
    format_whatsapp_reply,
    resolve_live_event_id_by_team,
    resolve_current_game,
    run_opportunity_board,
    train_prediction_model,
)
from src.team_resolver import (
    BRASILEIRAO_TEAM_ALIASES,
    get_team_display_name,
    resolve_brasileirao_team_key_from_name,
    text_contains_team_alias,
)
from src.whatsapp_client import is_whatsapp_send_enabled, send_whatsapp_buttons, send_whatsapp_text
from src.openai_client import generate_brasileirao_chat_reply
from src.model import MARKET_TARGETS
from src.env_loader import load_local_env

load_local_env()

app = FastAPI(title="NEURO-BIT API", version="0.1.0")

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        (
            "http://localhost:8080,"
            "http://127.0.0.1:8080,"
            "http://localhost:5173,"
            "http://127.0.0.1:5173,"
            "https://clever-game-coach.lovable.app"
        ),
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent / "static"
BRASILEIRAO_TABLE_FILE = Path("data") / "brasileirao_table.json"
BRASILEIRAO_OVERVIEW_FILE = Path("data") / "brasileirao_overview_2026.json"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

MODEL, DATA_SOURCE = train_prediction_model()

BLOCKED_LANGUAGE_TERMS = [
    "puta",
    "puta que pariu",
    "caralho",
    "cacete",
    "porra",
    "merda",
    "foda",
    "fdp",
    "filho da puta",
    "vai se fuder",
    "buceta",
    "pau no cu",
    "cu",
]

BRASILEIRAO_SCOPE_TERMS = [
    "brasileirao",
    "brasileirão",
    "serie a",
    "série a",
    "time",
    "times",
    "clube",
    "clubes",
    "jogador",
    "jogadores",
    "tecnico",
    "técnico",
    "treinador",
    "placar",
    "gol",
    "gols",
    "partida",
    "jogo",
    "jogos",
    "rodada",
    "classificacao",
    "classificação",
    "tabela",
    "posicao",
    "posição",
    "elenco",
    "escalacao",
    "escalação",
    "ultimos jogos",
    "últimos jogos",
    "oportunidade",
    "oportunidades",
    "historico",
    "histórico",
    "curiosidade",
    "curiosidades",
    "torcida",
    "estadio",
    "estádio",
    "confronto",
    "rival",
    "rivalidade",
    "campeonato",
]

OFF_TOPIC_TERMS = [
    "politica",
    "política",
    "economia",
    "receita",
    "culinaria",
    "culinária",
    "filme",
    "filmes",
    "serie",
    "série",
    "novela",
    "tecnologia",
    "programacao",
    "programação",
    "religiao",
    "religião",
    "viagem",
    "investimento",
    "criptomoeda",
]


class ChatRequest(BaseModel):
    message: str
    event_id: Optional[str] = None
    user_profile: Optional[str] = None


class AnalysisRequest(BaseModel):
    event_id: Optional[str] = None


class WhatsAppSendRequest(BaseModel):
    to: str
    message: str
    actions: Optional[list[str]] = None


class WhatsAppWebhookTestRequest(BaseModel):
    message: str
    from_number: Optional[str] = None
    event_id: Optional[str] = None
    user_profile: Optional[str] = None


def _format_suggested_actions(actions):
    if not actions:
        return ""
    return "Posso seguir por um destes caminhos: " + " | ".join(actions)


def _dedupe_actions(actions):
    unique_actions = []
    for action in actions or []:
        if action and action not in unique_actions:
            unique_actions.append(action)
    return unique_actions


def _detect_user_intent(message: str):
    normalized_message = (message or "").lower()

    if any(term in normalized_message for term in ["risco", "arriscado", "seguro", "seguranca", "cautela"]):
        return "risk"

    if any(term in normalized_message for term in ["apost", "entrada", "odd", "valor", "mercado"]):
        return "betting"

    if any(term in normalized_message for term in ["acompanhar", "monitor", "ao vivo", "placar", "minuto"]):
        return "tracking"

    return "general"


def _detect_user_profile(message: str):
    normalized_message = (message or "").lower()

    if any(term in normalized_message for term in ["iniciante", "comecando", "comecando", "sou novo", "aprendendo"]):
        return "iniciante"

    if any(term in normalized_message for term in ["conservador", "seguro", "cautela", "baixo risco"]):
        return "conservador"

    if any(term in normalized_message for term in ["agressivo", "ousado", "alto risco", "mais arriscado"]):
        return "agressivo"

    return "iniciante"


def _intent_suggested_actions(intent, team_name=None):
    display_name = team_name.title() if team_name else "o jogo"

    if intent == "risk":
        return [
            "explicar o risco dessa leitura",
            "ver mercados mais conservadores",
        ]

    if intent == "betting":
        return [
            "mostrar mercado com maior edge",
            f"analisar {display_name} com foco em aposta",
        ]

    if intent == "tracking":
        return [
            "resumir o momento do jogo",
            "monitorar esse jogo ao vivo",
        ]

    return _default_suggested_actions()


def _intent_button_actions(intent):
    if intent == "risk":
        return ["Ver risco", "Mais seguro"]

    if intent == "betting":
        return ["Melhor mercado", "Ver edge"]

    if intent == "tracking":
        return ["Resumo ao vivo", "Monitorar jogo"]

    return ["Oportunidades", "Analisar jogo"]


def _intent_follow_up(intent, snapshot=None):
    if intent == "risk":
        if snapshot:
            zen_guard = snapshot["analysis"]["zen_guard"]
            return (
                f"Leitura de risco: Zen-Guard em {zen_guard['status']} e acao sugerida em "
                f"{zen_guard['action']}."
            )
        return "Se o foco for risco, eu priorizo cautela e explico onde a leitura pode falhar."

    if intent == "betting":
        if snapshot:
            best_market = snapshot["analysis"]["primary_market"]
            return (
                f"Leitura de aposta: eu priorizei o mercado {best_market['label']} "
                f"porque ele lidera a probabilidade atual do modelo."
            )
        return "Se o foco for aposta, eu posso destacar o mercado mais forte e onde existe valor."

    if intent == "tracking":
        if snapshot:
            game = snapshot["game"]
            return (
                f"Leitura de acompanhamento: o jogo esta em {game['score']} aos {game['minute']} minutos, "
                "entao o peso maior esta no contexto ao vivo."
            )
        return "Se o foco for acompanhamento, eu resumo o momento do jogo e o que mudou no ao vivo."

    return "Se quiser, eu posso aprofundar em aposta, risco ou acompanhamento ao vivo."


def _default_suggested_actions():
    return [
        "melhores oportunidades ao vivo",
        "analisar um jogo especifico por event_id",
    ]


def _default_button_actions():
    return ["Oportunidades", "Analisar jogo"]


def _openai_chat_enabled():
    return os.getenv("ENABLE_OPENAI_ANALYSIS", "0") == "1" and bool(os.getenv("OPENAI_API_KEY"))


def _contains_blocked_language(message: str):
    normalized_message = (message or "").lower()
    return any(term in normalized_message for term in BLOCKED_LANGUAGE_TERMS)


def _is_brasileirao_scope(message: str):
    normalized_message = (message or "").lower()
    team_name = find_brasileirao_team_in_message(normalized_message)
    has_football_term = any(term in normalized_message for term in BRASILEIRAO_SCOPE_TERMS)
    has_off_topic_term = any(term in normalized_message for term in OFF_TOPIC_TERMS)

    if has_off_topic_term and not has_football_term:
        return False

    if has_football_term:
        return True

    if team_name:
        compact_message = " ".join(normalized_message.split())
        if len(compact_message.split()) <= 4:
            return True
        if any(
            pattern in compact_message
            for pattern in [
                "me fala",
                "como esta",
                "como está",
                "quero saber",
                "ultimos jogos",
                "últimos jogos",
                "curiosidades",
                "analisa",
                "posicao",
                "posição",
                "tabela",
            ]
        ):
            return True

    return False


def _build_guardrail_response(kind: str):
    if kind == "language":
        return {
            "reply": (
                "Vamos manter a conversa limpa por aqui. Eu posso te ajudar com o Brasileirao, falando de times, "
                "placar, tabela, jogadores, ultimos jogos e curiosidades do campeonato."
            ),
            "suggested_actions": [
                "me fala do Flamengo",
                "como esta o Botafogo",
                "quem lidera o Brasileirao",
            ],
            "quick_actions": ["Flamengo", "Botafogo", "Tabela"],
            "intent": "general",
        }

    return {
        "reply": (
            "Eu fico focado no universo do Brasileirao. Posso responder sobre times, jogadores, placar, "
            "posicao na tabela, ultimos jogos, confrontos e curiosidades de futebol."
        ),
        "suggested_actions": [
            "me fala do Palmeiras",
            "ultimos jogos do Corinthians",
            "quem esta melhor no Brasileirao",
        ],
        "quick_actions": ["Palmeiras", "Corinthians", "Tabela"],
        "intent": "general",
    }


def _team_suggested_actions(team_name):
    display_name = team_name.title()
    return [
        f"melhores oportunidades ao vivo",
        f"analisar {display_name} x adversario",
    ]


def _matchup_suggested_actions(team_a, team_b):
    return [
        "melhores oportunidades ao vivo",
        f"monitorar {team_a.title()} x {team_b.title()} quando entrar ao vivo",
    ]


def _team_button_actions(team_name):
    return ["Ver time", "Outro confronto"]


def _matchup_button_actions(team_a, team_b):
    return ["Ver confronto", "Oportunidades"]


def _build_board_reply(intent, user_profile="iniciante"):
    board = run_opportunity_board(MODEL, DATA_SOURCE, max_games=5)
    lines = ["Mesa de oportunidades ao vivo:"]
    for row in board["top_opportunities"][:5]:
        lines.append(
            f"{row['home_team']} x {row['away_team']} | {row['market_label']} | odd={row['odd']} | edge={row['edge']}"
        )
    suggested_actions = _dedupe_actions([
        "analisar um jogo especifico",
        "monitorar um event_id ao vivo",
    ] + _intent_suggested_actions(intent))
    quick_actions = _dedupe_actions([
        "Analisar jogo",
        "Monitorar ao vivo",
    ] + _intent_button_actions(intent))[:3]
    lines.append(_intent_follow_up(intent))
    lines.append(_format_suggested_actions(suggested_actions))
    return {
        "reply": "\n".join(lines),
        "board": board,
        "suggested_actions": suggested_actions,
        "quick_actions": quick_actions,
        "intent": intent,
        "user_profile": user_profile,
    }


def _build_current_game_reply(intent, event_id=None, intro=None, user_profile="iniciante"):
    game, market_odds, api_status = resolve_current_game(event_id)
    snapshot = build_analysis_snapshot(
        MODEL,
        DATA_SOURCE,
        game,
        market_odds,
        api_status,
        user_profile=user_profile,
    )
    suggested_actions = _dedupe_actions([
        "ver melhores oportunidades ao vivo",
        "analisar outro time do Brasileirao",
    ] + _intent_suggested_actions(intent))
    quick_actions = _dedupe_actions([
        "Oportunidades",
        "Outro time",
    ] + _intent_button_actions(intent))[:3]
    reply = format_whatsapp_reply(snapshot)
    if intro:
        reply = f"{intro}\n{reply}"
    reply = f"{reply}\n{_intent_follow_up(intent, snapshot)}"
    return {
        "reply": reply,
        "snapshot": snapshot,
        "suggested_actions": suggested_actions,
        "quick_actions": quick_actions,
        "intent": intent,
        "user_profile": user_profile,
    }


def _handle_quick_action(message: str, event_id: Optional[str] = None, user_profile="iniciante"):
    normalized_message = (message or "").strip().lower()

    if normalized_message in {"oportunidades", "ver edge"}:
        return _build_board_reply("betting", user_profile=user_profile)

    if normalized_message == "mais seguro":
        return _build_current_game_reply(
            "risk",
            event_id=event_id,
            intro="Segui pelo caminho mais conservador e puxei a leitura de risco do jogo mais acessivel agora.",
            user_profile="conservador",
        )

    if normalized_message == "ver risco":
        return _build_current_game_reply(
            "risk",
            event_id=event_id,
            intro="Aqui vai a leitura de risco do jogo mais acessivel agora.",
            user_profile=user_profile,
        )

    if normalized_message == "resumo ao vivo":
        return _build_current_game_reply(
            "tracking",
            event_id=event_id,
            intro="Resumo rapido do ao vivo:",
            user_profile=user_profile,
        )

    if normalized_message == "melhor mercado":
        return _build_current_game_reply(
            "betting",
            event_id=event_id,
            intro="Foquei no mercado mais forte do modelo neste momento.",
            user_profile=user_profile,
        )

    if normalized_message == "monitorar jogo":
        suggested_actions = [
            "monitorar um event_id ao vivo",
            "resumir o momento do jogo",
        ]
        return {
            "reply": (
                "Eu consigo monitorar um jogo em loop quando voce me passar o event_id ou quando o confronto entrar no feed ao vivo.\n"
                f"{_format_suggested_actions(suggested_actions)}"
            ),
            "suggested_actions": suggested_actions,
            "quick_actions": ["Resumo ao vivo", "Oportunidades"],
            "intent": "tracking",
        }

    if normalized_message in {"analisar jogo", "ver confronto", "ver time"}:
        return {
            "reply": (
                "Me manda o time ou confronto que eu puxo a leitura certa. Exemplos: Vasco, Flamengo x Palmeiras ou um event_id especifico."
            ),
            "suggested_actions": [
                "analisar Vasco x adversario",
                "analisar um jogo especifico por event_id",
            ],
            "quick_actions": ["Oportunidades", "Melhor mercado"],
            "intent": "general",
        }

    if normalized_message == "outro time":
        return {
            "reply": "Perfeito. Me diz o time do Brasileirao que voce quer analisar e eu procuro ao vivo, proximo jogo ou jogo recente.",
            "suggested_actions": [
                "analisar Flamengo x adversario",
                "analisar Corinthians x adversario",
            ],
            "quick_actions": ["Ver time", "Oportunidades"],
            "intent": "general",
        }

    if normalized_message == "outro confronto":
        return {
            "reply": "Me passa dois times, por exemplo Vasco x Flamengo, que eu tento localizar o confronto e montar a leitura.",
            "suggested_actions": [
                "analisar Vasco x Flamengo",
                "analisar Corinthians x Palmeiras",
            ],
            "quick_actions": ["Ver confronto", "Oportunidades"],
            "intent": "general",
        }

    if normalized_message == "monitorar ao vivo":
        return {
            "reply": (
                "Se voce tiver o event_id, eu consigo entrar no modo monitor ao vivo. Sem ele, eu sigo com leitura pontual do jogo mais acessivel agora."
            ),
            "suggested_actions": [
                "monitorar um event_id ao vivo",
                "resumir o momento do jogo",
            ],
            "quick_actions": ["Resumo ao vivo", "Oportunidades"],
            "intent": "tracking",
        }

    return None


def _build_chat_response(message: str, event_id: Optional[str] = None, user_profile: Optional[str] = None):
    normalized_message = message.lower().strip()
    if _contains_blocked_language(normalized_message):
        return _build_guardrail_response("language")

    if not _is_brasileirao_scope(normalized_message):
        return _build_guardrail_response("scope")

    user_profile = user_profile or _detect_user_profile(normalized_message)
    quick_action_response = _handle_quick_action(normalized_message, event_id, user_profile=user_profile)
    if quick_action_response:
        return quick_action_response

    intent = _detect_user_intent(normalized_message)
    teams = find_brasileirao_teams_in_message(normalized_message)
    team_name = find_brasileirao_team_in_message(normalized_message)

    if "oportunidade" not in normalized_message and "melhores jogos" not in normalized_message:
        openai_reply = _try_openai_chat_reply(normalized_message, event_id, user_profile, intent)
        if openai_reply:
            return openai_reply

    if not event_id and len(teams) >= 2:
        team_a, team_b = teams[0], teams[1]
        try:
            matchup_context = find_matchup_event_context(team_a, team_b)
            if matchup_context and matchup_context["status"] == "live":
                event_id = matchup_context["event_id"]
            else:
                suggested_actions = _dedupe_actions(
                    _matchup_suggested_actions(team_a, team_b) + _intent_suggested_actions(intent)
                )
                quick_actions = _dedupe_actions(
                    _matchup_button_actions(team_a, team_b) + _intent_button_actions(intent)
                )[:3]
                return {
                    "reply": (
                        f"{format_matchup_event_context(team_a, team_b, matchup_context)}\n"
                        f"{_intent_follow_up(intent)}\n"
                        f"{_format_suggested_actions(suggested_actions)}"
                    ),
                    "suggested_actions": suggested_actions,
                    "quick_actions": quick_actions,
                    "intent": intent,
                }
        except Exception as exc:
            return {
                "reply": (
                    f"Tentei localizar o confronto {team_a} x {team_b}, mas nao consegui consultar a base agora.\n"
                    f"{_intent_follow_up(intent)}\n"
                    f"{_format_suggested_actions(_default_suggested_actions())}"
                ),
                "error": str(exc),
                "suggested_actions": _default_suggested_actions(),
                "quick_actions": _default_button_actions(),
                "intent": intent,
            }

    if not event_id and team_name:
        try:
            team_context = find_team_event_context(team_name)
            if not team_context:
                suggested_actions = _dedupe_actions(
                    _team_suggested_actions(team_name) + _intent_suggested_actions(intent, team_name)
                )
                quick_actions = _dedupe_actions(
                    _team_button_actions(team_name) + _intent_button_actions(intent)
                )[:3]
                return {
                    "reply": (
                        f"{_team_chat_summary(team_name, None)}\n"
                        f"{_intent_follow_up(intent)}\n"
                        f"{_format_suggested_actions(suggested_actions)}"
                    ),
                    "suggested_actions": suggested_actions,
                    "quick_actions": quick_actions,
                    "intent": intent,
                }
            if team_context["status"] != "live":
                suggested_actions = _dedupe_actions(
                    _team_suggested_actions(team_name) + _intent_suggested_actions(intent, team_name)
                )
                quick_actions = _dedupe_actions(
                    _team_button_actions(team_name) + _intent_button_actions(intent)
                )[:3]
                return {
                    "reply": (
                        f"{_team_chat_summary(team_name, team_context)}\n"
                        f"{_intent_follow_up(intent)}\n"
                        f"{_format_suggested_actions(suggested_actions)}"
                    ),
                    "suggested_actions": suggested_actions,
                    "quick_actions": quick_actions,
                    "intent": intent,
                }
            event_id = team_context["event_id"]
        except Exception as exc:
            return {
                "reply": (
                    f"Tentei localizar o jogo do {team_name}, mas nao consegui consultar a base ao vivo agora.\n"
                    f"{_intent_follow_up(intent)}\n"
                    f"{_format_suggested_actions(_default_suggested_actions())}"
                ),
                "error": str(exc),
                "suggested_actions": _default_suggested_actions(),
                "quick_actions": _default_button_actions(),
                "intent": intent,
            }

    if "oportunidade" in normalized_message or "melhores jogos" in normalized_message:
        try:
            return _build_board_reply(intent, user_profile=user_profile)
        except Exception as exc:
            return {
                "reply": (
                    "Nao consegui consultar as oportunidades ao vivo agora. "
                    "Defina BETSAPI_TOKEN no ambiente e tente novamente.\n"
                    f"{_intent_follow_up(intent)}\n"
                    f"{_format_suggested_actions(_default_suggested_actions())}"
                ),
                "error": str(exc),
                "suggested_actions": _default_suggested_actions(),
                "quick_actions": _default_button_actions(),
                "intent": intent,
            }

    return _build_current_game_reply(intent, event_id=event_id, user_profile=user_profile)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "neuro-bit-api",
        "openai_enabled": _openai_chat_enabled(),
        "openai_model": os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini"),
        "has_openai_api_key": bool(os.getenv("OPENAI_API_KEY")),
        "data_source": DATA_SOURCE,
    }


@app.post("/analyze")
def analyze_game(request: AnalysisRequest):
    game, market_odds, api_status = resolve_current_game(request.event_id)
    snapshot = build_analysis_snapshot(MODEL, DATA_SOURCE, game, market_odds, api_status)
    return snapshot


@app.get("/opportunities")
def get_opportunity_board(max_games: int = 5):
    try:
        return run_opportunity_board(MODEL, DATA_SOURCE, max_games=max(max_games, 1))
    except Exception as exc:
        return {
            "error": str(exc),
            "hint": "Defina BETSAPI_TOKEN para consultar a mesa de oportunidades ao vivo.",
        }


@app.post("/chat")
def chat(request: ChatRequest):
    return _build_chat_response(request.message, request.event_id, request.user_profile)


@app.post("/whatsapp/send-test")
def whatsapp_send_test(request: WhatsAppSendRequest):
    try:
        if request.actions:
            result = send_whatsapp_buttons(request.to, request.message, request.actions)
        else:
            result = send_whatsapp_text(request.to, request.message)
        return {
            "sent": True,
            "result": result,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Falha ao enviar mensagem WhatsApp: {exc}",
        ) from exc


@app.post("/webhook/whatsapp/test")
def whatsapp_webhook_test(request: WhatsAppWebhookTestRequest):
    response = _build_chat_response(
        request.message,
        event_id=request.event_id,
        user_profile=request.user_profile,
    )

    delivery = {
        "enabled": is_whatsapp_send_enabled() and bool(request.from_number),
        "sent": False,
    }

    if delivery["enabled"]:
        try:
            quick_actions = response.get("quick_actions") or response.get("suggested_actions") or []
            if quick_actions:
                provider_response = send_whatsapp_buttons(
                    request.from_number,
                    response["reply"],
                    quick_actions,
                )
            else:
                provider_response = send_whatsapp_text(request.from_number, response["reply"])
            delivery["sent"] = True
            delivery["interactive"] = bool(quick_actions)
            delivery["provider_response"] = provider_response
        except Exception as exc:
            delivery["error"] = str(exc)

    return {
        "mode": "whatsapp_webhook_simulation",
        "input": {
            "message": request.message,
            "from_number": request.from_number,
            "event_id": request.event_id,
            "user_profile": request.user_profile,
        },
        "reply": response.get("reply"),
        "quick_actions": response.get("quick_actions"),
        "suggested_actions": response.get("suggested_actions"),
        "intent": response.get("intent"),
        "source": response.get("source", "app"),
        "snapshot": response.get("snapshot"),
        "delivery": delivery,
    }


@app.get("/webhook/whatsapp")
def verify_whatsapp_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    expected_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "neurobit-verify-token")
    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        return PlainTextResponse(hub_challenge)
    return PlainTextResponse("verification failed", status_code=403)


@app.post("/webhook/whatsapp")
async def receive_whatsapp_webhook(request: Request):
    payload = await request.json()
    replies = []

    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                text_body = (
                    message.get("text", {}).get("body")
                    or message.get("button", {}).get("text")
                    or message.get("interactive", {}).get("button_reply", {}).get("title")
                    or ""
                )
                from_number = message.get("from")
                response = _build_chat_response(text_body, event_id=None)
                delivery = {
                    "enabled": is_whatsapp_send_enabled(),
                    "sent": False,
                }

                if delivery["enabled"] and from_number and response.get("reply"):
                    try:
                        quick_actions = response.get("quick_actions") or response.get("suggested_actions") or []
                        if quick_actions:
                            send_result = send_whatsapp_buttons(
                                from_number,
                                response["reply"],
                                quick_actions,
                            )
                        else:
                            send_result = send_whatsapp_text(from_number, response["reply"])
                        delivery["sent"] = True
                        delivery["interactive"] = bool(quick_actions)
                        delivery["provider_response"] = send_result
                    except Exception as exc:
                        delivery["error"] = str(exc)

                replies.append(
                    {
                        "to": from_number,
                        "message_id": message.get("id"),
                        "reply": response["reply"],
                        "delivery": delivery,
                    }
                )

    return {
        "received": True,
        "replies": replies,
    }


@app.get("/")
def root():
    return {
        "name": "NEURO-BIT API",
        "routes": [
            "/health",
            "/dashboard",
            "/dashboard/brasileirao",
            "/analyze",
            "/opportunities",
            "/brasileirao/teams",
            "/chat",
            "/whatsapp/send-test",
            "/webhook/whatsapp/test",
            "/webhook/whatsapp",
        ],
        "openai_enabled": os.getenv("ENABLE_OPENAI_ANALYSIS", "0") == "1",
    }


@app.get("/dashboard")
def dashboard():
    return FileResponse(STATIC_DIR / "dashboard.html")


def _safe_event_minute(event):
    timer = event.get("timer")
    if isinstance(timer, dict):
        minute = timer.get("tm") or timer.get("minute")
        if minute is not None:
            return str(minute)
    time_value = event.get("time")
    if time_value not in (None, ""):
        return str(time_value)
    return None


def _safe_event_day_label(event):
    raw_time = event.get("time")
    if raw_time in (None, "", 0, "0"):
        return None

    try:
        timestamp = int(raw_time)
        if timestamp > 10_000_000:
            dt = datetime.fromtimestamp(timestamp)
            return dt.strftime("%d/%m %H:%M")
    except (TypeError, ValueError, OSError):
        return None

    return None


def _team_matches_event(aliases, event):
    home_name = str(event.get("home", {}).get("name", "")).lower()
    away_name = str(event.get("away", {}).get("name", "")).lower()
    return any(
        text_contains_team_alias(home_name, alias) or text_contains_team_alias(away_name, alias)
        for alias in aliases
    )


def _serialize_team_context(team_name, context):
    if not context:
        return {
            "team_key": team_name,
            "team_name": get_team_display_name(team_name),
            "status": "sem_dados",
            "event_id": None,
            "match_label": "Sem jogo encontrado",
            "score": "-",
            "minute": "-",
            "provider": None,
        }

    event = context.get("event", {})
    home_name = event.get("home", {}).get("name", "Mandante")
    away_name = event.get("away", {}).get("name", "Visitante")
    raw_status = context.get("status", "sem_dados")
    status = "sem_dados" if raw_status == "known_team" else raw_status
    match_label = (
        f"{home_name} x {away_name}"
        if away_name and away_name != "A definir"
        else f"{home_name} | acompanhamento local"
    )
    return {
        "team_key": team_name,
        "team_name": get_team_display_name(team_name),
        "status": status,
        "event_id": context.get("event_id"),
        "match_label": match_label,
        "score": event.get("ss") or "-",
        "minute": _safe_event_minute(event) or "-",
        "event_day_label": _safe_event_day_label(event),
        "provider": context.get("provider"),
    }


def _current_brasileirao_team_keys():
    table_map = _load_brasileirao_table()
    current_keys = [
        team_key
        for team_key, row in table_map.items()
        if row.get("points") is not None or row.get("games_played") is not None
    ]
    return set(current_keys or table_map.keys())


def _event_is_current_brasileirao_context(event, allowed_team_keys):
    if not isinstance(event, dict):
        return False

    home_name = event.get("home", {}).get("name", "") if isinstance(event.get("home"), dict) else event.get("home", "")
    away_name = event.get("away", {}).get("name", "") if isinstance(event.get("away"), dict) else event.get("away", "")
    home_key = resolve_brasileirao_team_key_from_name(str(home_name))
    away_key = resolve_brasileirao_team_key_from_name(str(away_name))

    if home_key and away_key and home_key in allowed_team_keys and away_key in allowed_team_keys:
        return True

    league_name = ""
    league = event.get("league")
    if isinstance(league, dict):
        league_name = str(league.get("name", ""))
    else:
        league_name = str(event.get("league_name", "") or event.get("league", ""))

    normalized_league = league_name.lower()
    return "brasileir" in normalized_league and "serie a" in normalized_league


def _load_brasileirao_table():
    if not BRASILEIRAO_TABLE_FILE.exists():
        return {}

    try:
        import json

        payload = json.loads(BRASILEIRAO_TABLE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}

    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict):
        rows = payload.get("teams", [])
    else:
        rows = []

    table_map = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        team_key = row.get("team_key")
        if not team_key:
            continue
        table_map[team_key] = {
            "position": row.get("position"),
            "points": row.get("points"),
            "games_played": row.get("games_played"),
            "form": row.get("form"),
        }

    return table_map


def _load_brasileirao_overview():
    if not BRASILEIRAO_OVERVIEW_FILE.exists():
        return {
            "season": 2026,
            "updated_at": None,
            "sources": [],
            "summary": {},
            "standings": [],
            "recent_matches": [],
            "top_scorers": [],
            "insights": [],
        }

    try:
        import json

        payload = json.loads(BRASILEIRAO_OVERVIEW_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {
            "season": 2026,
            "updated_at": None,
            "sources": [],
            "summary": {},
            "standings": [],
            "recent_matches": [],
            "top_scorers": [],
            "insights": [],
        }

    return payload if isinstance(payload, dict) else {
        "season": 2026,
        "updated_at": None,
        "sources": [],
        "summary": {},
        "standings": [],
        "recent_matches": [],
        "top_scorers": [],
        "insights": [],
    }


def _build_local_brasileirao_team_rows():
    table_map = _load_brasileirao_table()
    overview = _load_brasileirao_overview()
    next_matches = overview.get("next_matches", []) if isinstance(overview, dict) else []

    next_match_map = {}
    for match in next_matches:
        if not isinstance(match, dict):
            continue
        home_team = resolve_brasileirao_team_key_from_name(match.get("home_team"))
        away_team = resolve_brasileirao_team_key_from_name(match.get("away_team"))
        date_label = match.get("date")
        match_label = f"{match.get('home_team', 'Mandante')} x {match.get('away_team', 'Visitante')}"
        if home_team:
            next_match_map[home_team] = f"{match_label} • {date_label}" if date_label else match_label
        if away_team:
            next_match_map[away_team] = f"{match_label} • {date_label}" if date_label else match_label

    rows = []
    for team_key, info in table_map.items():
        rows.append(
            {
                "team_key": team_key,
                "team_name": get_team_display_name(team_key),
                "status": "sem_dados",
                "event_id": None,
                "match_label": "Sem jogo da Serie A hoje",
                "score": "-",
                "minute": "-",
                "event_day_label": None,
                "provider": "fallback_local",
                "position": info.get("position"),
                "points": info.get("points"),
                "games_played": info.get("games_played"),
                "form": info.get("form"),
                "next_match_label": next_match_map.get(team_key, "Aguardando detalhamento da rodada 9"),
            }
        )

    rows.sort(key=lambda item: ((item.get("position") or 999), item["team_name"]))
    return rows


def _ordinal_pt_br(value):
    if value is None:
        return None
    try:
        value = int(value)
    except (TypeError, ValueError):
        return None
    return f"{value}o"


def _describe_form(form):
    raw_form = (form or "").strip().upper()
    if not raw_form:
        return "Sem sequencia recente carregada agora."

    wins = raw_form.count("W")
    draws = raw_form.count("D")
    losses = raw_form.count("L")

    if wins >= 3 and losses == 0:
        phase = "vive uma fase muito forte"
    elif wins > losses:
        phase = "vive um momento positivo"
    elif losses > wins:
        phase = "atravessa um momento instavel"
    else:
        phase = "vem em um momento equilibrado"

    translated = (
        raw_form.replace("W", "V")
        .replace("D", "E")
        .replace("L", "D")
    )
    return f"{phase}. Sequencia recente: {translated}."


def _describe_table_position(display_name, position, points, games_played):
    ordinal = _ordinal_pt_br(position)
    if ordinal is None or points is None:
        return f"Eu reconheci o {display_name}, mas a tabela completa dele nao esta carregada agora."

    games_text = f" em {games_played} jogos" if games_played is not None else ""

    try:
        numeric_position = int(position)
    except (TypeError, ValueError):
        numeric_position = None

    if numeric_position is not None and numeric_position <= 4:
        bracket = "na parte de cima da tabela"
    elif numeric_position is not None and numeric_position <= 10:
        bracket = "no bloco intermediario da tabela"
    else:
        bracket = "na parte de baixo da tabela"

    return (
        f"O {display_name} esta em {ordinal} lugar, com {points} pontos{games_text}, "
        f"e aparece {bracket}."
    )


def _resolve_opponent_name(display_name, home_name, away_name):
    display_lower = display_name.lower()
    if display_lower in (home_name or "").lower():
        return away_name
    if display_lower in (away_name or "").lower():
        return home_name
    return away_name if away_name and away_name != "Visitante" else home_name


def _team_chat_summary(team_name, team_context=None):
    display_name = get_team_display_name(team_name)
    table_info = _load_brasileirao_table().get(team_name, {})
    position = table_info.get("position")
    points = table_info.get("points")
    games_played = table_info.get("games_played")
    form = table_info.get("form")

    table_line = _describe_table_position(display_name, position, points, games_played)
    form_line = _describe_form(form)

    if not team_context:
        return (
            f"{table_line} {form_line} "
            f"No momento eu nao achei agenda ou resultado recente do {display_name}. "
            "Se quiser, eu posso olhar o proximo confronto, comentar o momento do time ou comparar com um adversario especifico."
        )

    event = team_context.get("event", {})
    home_name = event.get("home", {}).get("name", "Mandante")
    away_name = event.get("away", {}).get("name", "Visitante")
    score = event.get("ss", "sem placar")
    opponent = _resolve_opponent_name(display_name, home_name, away_name)

    if team_context["status"] == "known_team":
        return (
            f"{table_line} {form_line} "
            f"No momento a fonte principal nao trouxe agenda ou resultado recente do {display_name}. "
            "Mesmo assim, eu consigo explicar como o time chega, o que esse momento sugere e preparar a leitura do confronto se voce me disser o adversario."
        )

    if team_context["status"] == "upcoming":
        return (
            f"{table_line} {form_line} "
            f"O proximo jogo que encontrei do {display_name} e contra {opponent}. "
            "Se quiser, eu te explico como o time chega para esse duelo e onde pode estar a vantagem."
        )

    if team_context["status"] == "ended":
        return (
            f"{table_line} {form_line} "
            f"O jogo mais recente que encontrei do {display_name} foi {home_name} x {away_name}, placar {score}. "
            "Se quiser, eu te explico o que esse resultado diz sobre o momento do time e como isso pesa para a proxima partida."
        )

    return format_team_event_context(team_name, team_context)


def _build_chat_context_payload(message: str, event_id: Optional[str], user_profile: str, intent: str):
    teams = find_brasileirao_teams_in_message(message)
    team_name = find_brasileirao_team_in_message(message)
    overview = _load_brasileirao_overview()
    payload = {
        "message": message,
        "intent": intent,
        "user_profile": user_profile,
        "team_detected": team_name,
        "teams_detected": teams,
        "table_context": _load_brasileirao_table(),
        "overview": overview,
        "training_summary": {
            "data_source": DATA_SOURCE,
            "markets_available": list(MARKET_TARGETS.keys()) + ["goal_next_10m", "card_next_10m", "penalty_in_match"],
            "markets_count": len(MARKET_TARGETS) + 3,
            "model_family": "RandomForestClassifier por mercado",
            "guidance": "Use os mercados apenas como apoio de leitura. Nao invente metricas ou validacoes que nao estejam no contexto.",
        },
    }

    if team_name:
        try:
            team_context = find_team_event_context(team_name)
            payload["team_context"] = team_context
            payload["team_summary"] = _team_chat_summary(team_name, team_context)
            if team_context and team_context.get("status") == "live" and team_context.get("event_id"):
                live_game, live_odds, live_status = resolve_current_game(team_context["event_id"])
                payload["live_snapshot"] = build_analysis_snapshot(
                    MODEL,
                    DATA_SOURCE,
                    live_game,
                    live_odds,
                    live_status,
                    user_profile=user_profile,
                )
        except Exception as exc:
            payload["team_context_error"] = str(exc)

    if len(teams) >= 2:
        team_a, team_b = teams[0], teams[1]
        try:
            matchup_context = find_matchup_event_context(team_a, team_b)
            payload["matchup_context"] = matchup_context
            payload["matchup_summary"] = format_matchup_event_context(team_a, team_b, matchup_context)
            if matchup_context and matchup_context.get("status") == "live" and matchup_context.get("event_id"):
                live_game, live_odds, live_status = resolve_current_game(matchup_context["event_id"])
                payload["live_snapshot"] = build_analysis_snapshot(
                    MODEL,
                    DATA_SOURCE,
                    live_game,
                    live_odds,
                    live_status,
                    user_profile=user_profile,
                )
        except Exception as exc:
            payload["matchup_context_error"] = str(exc)

    if event_id and "live_snapshot" not in payload:
        try:
            current_game, market_odds, api_status = resolve_current_game(event_id)
            payload["live_snapshot"] = build_analysis_snapshot(
                MODEL,
                DATA_SOURCE,
                current_game,
                market_odds,
                api_status,
                user_profile=user_profile,
            )
        except Exception as exc:
            payload["event_context_error"] = str(exc)

    return payload


def _try_openai_chat_reply(message: str, event_id: Optional[str], user_profile: str, intent: str):
    if not _openai_chat_enabled():
        return None

    try:
        context_payload = _build_chat_context_payload(message, event_id, user_profile, intent)
        reply = generate_brasileirao_chat_reply(message, context_payload)
    except Exception:
        return None
    suggested_actions = [
        "ultimos jogos",
        "tabela do Brasileirao",
        "comparar dois times",
    ]
    if context_payload.get("team_detected"):
        display_name = get_team_display_name(context_payload["team_detected"])
        suggested_actions = [
            f"ultimos jogos do {display_name}",
            f"posicao do {display_name}",
            f"curiosidades do {display_name}",
        ]

    return {
        "reply": reply,
        "suggested_actions": suggested_actions,
        "quick_actions": ["Ultimos jogos", "Tabela", "Curiosidades"],
        "intent": intent,
        "source": "openai",
    }


def _build_brasileirao_team_board():
    season_team_keys = _current_brasileirao_team_keys()
    team_keys = [team_key for team_key in BRASILEIRAO_TEAM_ALIASES.keys() if team_key in season_team_keys]
    table_map = _load_brasileirao_table()
    overview = _load_brasileirao_overview()

    if overview.get("summary", {}).get("mens_games_today") is False:
        return {
            "api_status": "dataset_local_cbf_2026",
            "teams": _build_local_brasileirao_team_rows(),
        }

    try:
        live_events = get_live_football_events()
        upcoming_events = get_upcoming_football_events(day="today")
        ended_events = get_ended_football_events(page=1)
        api_status = "online"
    except Exception as exc:
        return {
            "api_status": f"indisponivel: {exc}",
            "teams": [
                {
                    **_serialize_team_context(
                        team_key,
                        {
                            "status": "known_team",
                            "event_id": None,
                            "event": {
                                "home": {"name": get_team_display_name(team_key)},
                                "away": {"name": "A definir"},
                                "ss": None,
                            },
                            "provider": "fallback_local",
                        },
                    ),
                    **table_map.get(team_key, {}),
                    "next_match_label": "Aguardando feed de proximos jogos",
                }
                for team_key in team_keys
            ],
        }

    team_rows = []
    for team_key in team_keys:
        aliases = BRASILEIRAO_TEAM_ALIASES[team_key]
        context = None

        for event in live_events:
            if _event_is_current_brasileirao_context(event, season_team_keys) and _team_matches_event(aliases, event):
                context = {
                    "status": "live",
                    "event_id": event.get("id") or event.get("event_id"),
                    "event": event,
                    "provider": "betsapi",
                }
                break

        if context is None:
            for event in upcoming_events:
                if _event_is_current_brasileirao_context(event, season_team_keys) and _team_matches_event(aliases, event):
                    context = {
                        "status": "upcoming",
                        "event_id": event.get("id") or event.get("event_id"),
                        "event": event,
                        "provider": "betsapi",
                    }
                    break

        if context is None:
            for event in ended_events:
                if _event_is_current_brasileirao_context(event, season_team_keys) and _team_matches_event(aliases, event):
                    context = {
                        "status": "ended",
                        "event_id": event.get("id") or event.get("event_id"),
                        "event": event,
                        "provider": "betsapi",
                    }
                    break

        row = _serialize_team_context(team_key, context)
        row.update(table_map.get(team_key, {}))
        row["next_match_label"] = row["match_label"] if row["status"] in {"live", "upcoming"} else "Sem proximo jogo confirmado"
        if row.get("event_day_label") and row["status"] in {"live", "upcoming"}:
            row["next_match_label"] = f"{row['next_match_label']} • {row['event_day_label']}"
        team_rows.append(row)

    status_order = {"live": 0, "upcoming": 1, "ended": 2, "sem_dados": 3}
    team_rows.sort(key=lambda item: (status_order.get(item["status"], 9), item["team_name"]))

    return {
        "api_status": api_status,
        "teams": team_rows,
    }


@app.get("/brasileirao/teams")
def brasileirao_teams():
    return _build_brasileirao_team_board()


@app.get("/brasileirao/overview")
def brasileirao_overview():
    return _load_brasileirao_overview()


@app.get("/dashboard/brasileirao")
def brasileirao_dashboard():
    return FileResponse(STATIC_DIR / "brasileirao_dashboard.html")
