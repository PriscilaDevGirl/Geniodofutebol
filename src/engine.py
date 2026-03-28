import json
import os
from datetime import datetime, timezone
from pathlib import Path

from src.api import get_football_lineup, get_football_match_details, get_football_odds, get_live_football_events
from src.assistant import build_match_insights
from src.features import create_features, load_data
from src.model import train_model
from src.openai_client import generate_chatgpt_analysis
from src.predictor import predict_market_probabilities
from src.schedule_provider import (
    find_matchup_event_context,
    find_team_event_context,
    resolve_live_event_id_by_team,
)
from src.team_resolver import find_brasileirao_team_in_message, find_brasileirao_teams_in_message


def _safe_int(value, default=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))


def _coerce_stat_value(value, default=0):
    if isinstance(value, str) and "," in value:
        parts = [part.strip() for part in value.split(",") if part.strip()]
        if parts:
            return _safe_int(parts[0], default=default)
    return _safe_int(value, default=default)


def _coerce_stat_pair(values):
    if not isinstance(values, list):
        return [0, 0]

    pair = values[:2]
    while len(pair) < 2:
        pair.append(0)

    return [_coerce_stat_value(pair[0]), _coerce_stat_value(pair[1])]


def pick_first_event_id():
    live_events = get_live_football_events()
    if isinstance(live_events, list) and live_events:
        event = live_events[0]
        return event.get("id") or event.get("event_id")
    return None


def format_team_event_context(team_name, team_context):
    if not team_context:
        return (
            f"Encontrei o time {team_name}, mas nao localizei jogo ao vivo, proximo ou recente agora."
        )

    event = team_context["event"]
    home_name = event.get("home", {}).get("name", "Mandante")
    away_name = event.get("away", {}).get("name", "Visitante")
    score = event.get("ss", "sem placar")

    if team_context["status"] == "known_team":
        return (
            f"Reconheci o clube {home_name}, mas a fonte principal nao trouxe agenda ou resultado agora. "
            "Mesmo assim, eu consigo explicar como o time esta, comentar o momento recente e preparar a leitura do confronto se voce me passar o adversario."
        )

    if team_context["status"] == "live":
        minute = event.get("timer", {}).get("tm") if isinstance(event.get("timer"), dict) else None
        minute_label = f"{minute}'" if minute is not None else "ao vivo"
        return (
            f"Boa, achei o {team_name} ao vivo agora: {home_name} x {away_name} | "
            f"placar {score} | minuto {minute_label}. "
            "Se quiser, eu posso explicar como o time esta no jogo e o que esse momento sugere para os mercados."
        )

    if team_context["status"] == "upcoming":
        return (
            f"O proximo jogo que encontrei do {team_name} e {home_name} x {away_name}. "
            "Se quiser, eu posso te explicar como o time chega para esse confronto."
        )

    return (
        f"O jogo mais recente que encontrei do {team_name} foi {home_name} x {away_name} | placar {score}. "
        "Se quiser, eu posso comentar o que esse resultado indica sobre o momento do time."
    )


def format_matchup_event_context(team_a, team_b, matchup_context):
    if not matchup_context:
        return f"Reconheci o confronto {team_a} x {team_b}, mas nao localizei esse jogo agora."

    event = matchup_context["event"]
    home_name = event.get("home", {}).get("name", team_a)
    away_name = event.get("away", {}).get("name", team_b)
    score = event.get("ss", "sem placar")

    if matchup_context["status"] == "known_matchup":
        return (
            f"Reconheci o confronto {home_name} x {away_name}, mas a fonte principal ainda nao trouxe esse jogo. "
            "Se ele aparecer no feed mais tarde, eu consigo analisar o duelo com o mesmo fluxo."
        )

    if matchup_context["status"] == "upcoming":
        return f"O proximo confronto que encontrei e {home_name} x {away_name}."

    if matchup_context["status"] == "ended":
        return f"O confronto mais recente que encontrei foi {home_name} x {away_name} | placar {score}."

    minute = event.get("timer", {}).get("tm") if isinstance(event.get("timer"), dict) else None
    minute_label = f"{minute}'" if minute is not None else "ao vivo"
    return (
        f"Boa, esse confronto esta ao vivo agora: {home_name} x {away_name} | "
        f"placar {score} | minuto {minute_label}."
    )


def _extract_score(match_details):
    ss = match_details.get("ss")
    if isinstance(ss, str) and "-" in ss:
        home_score, away_score = ss.split("-", 1)
        return _safe_int(home_score), _safe_int(away_score)

    scores = match_details.get("scores", {})
    if isinstance(scores, dict):
        home = None
        away = None

        for candidate in scores.values():
            if isinstance(candidate, dict) and "home" in candidate and "away" in candidate:
                home = candidate.get("home")
                away = candidate.get("away")

        if home is None:
            home = scores.get("home") or scores.get("home_score") or scores.get("score_home")
        if away is None:
            away = scores.get("away") or scores.get("away_score") or scores.get("score_away")

        return _safe_int(home), _safe_int(away)

    return 0, 0


def _extract_minute(match_details):
    timer = match_details.get("timer")
    if isinstance(timer, dict):
        return _safe_int(timer.get("tm") or timer.get("minute"))
    raw_time = _safe_int(match_details.get("time"))
    if 0 <= raw_time <= 130:
        return raw_time
    return 0


def _extract_cards(match_details):
    stats = match_details.get("stats") or {}
    if not isinstance(stats, dict):
        return 0

    yellow = stats.get("yellowcards") or stats.get("yellow_cards") or [0, 0]
    red = stats.get("redcards") or stats.get("red_cards") or [0, 0]

    if isinstance(yellow, list):
        yellow_total = sum(_coerce_stat_value(value) for value in yellow[:2])
    else:
        yellow_total = _coerce_stat_value(yellow)

    if isinstance(red, list):
        red_total = sum(_coerce_stat_value(value) for value in red[:2])
    else:
        red_total = _coerce_stat_value(red)

    return yellow_total + (red_total * 2)


def _extract_attacks(match_details):
    stats = match_details.get("stats") or {}
    if not isinstance(stats, dict):
        return [0, 0], [0, 0]

    attacks = stats.get("attacks") or [0, 0]
    dangerous = stats.get("dangerous_attacks") or stats.get("dangerousattacks") or [0, 0]

    return _coerce_stat_pair(attacks), _coerce_stat_pair(dangerous)


def _extract_market_odds(odds_payload):
    market_odds = {}

    if not isinstance(odds_payload, dict):
        return market_odds

    odds = odds_payload.get("odds", {})
    if not isinstance(odds, dict):
        return market_odds

    one_x_two = odds.get("1_1") or odds.get("1_8") or []
    if one_x_two:
        latest = one_x_two[0]
        home_odd = _safe_float(latest.get("home_od"))
        draw_odd = _safe_float(latest.get("draw_od"))
        away_odd = _safe_float(latest.get("away_od"))
        if home_odd > 1:
            market_odds["home_win"] = home_odd
        if draw_odd > 1:
            market_odds["draw"] = draw_odd
        if away_odd > 1:
            market_odds["away_win"] = away_odd

    for market_entries in odds.values():
        if not isinstance(market_entries, list):
            continue
        for entry in market_entries:
            handicap = str(entry.get("handicap"))
            over_odd = _safe_float(entry.get("over_od"))
            under_odd = _safe_float(entry.get("under_od"))
            if handicap == "2.5":
                if over_odd > 1:
                    market_odds["over_2_5"] = over_odd
                if under_odd > 1:
                    market_odds["under_2_5"] = under_odd
                break
        if "over_2_5" in market_odds or "under_2_5" in market_odds:
            break

    return market_odds


def _collect_lineup_names(node):
    names = []

    if isinstance(node, dict):
        direct_name = node.get("name") or node.get("player_name") or node.get("player")
        if isinstance(direct_name, str) and direct_name.strip():
            names.append(direct_name.strip())
        for value in node.values():
            names.extend(_collect_lineup_names(value))
    elif isinstance(node, list):
        for item in node:
            names.extend(_collect_lineup_names(item))

    unique_names = []
    for name in names:
        if name not in unique_names:
            unique_names.append(name)
    return unique_names


def _lineup_bucket(payload, side_keys):
    if not isinstance(payload, dict):
        return {}

    for side_key in side_keys:
        candidate = payload.get(side_key)
        if isinstance(candidate, dict):
            return candidate
    return {}


def _build_lineup_summary(event_id):
    if not event_id:
        return {
            "available": False,
            "status": "indisponivel",
            "summary": "Sem event_id para consultar escalacoes.",
        }

    try:
        lineup_payload = get_football_lineup(event_id)
    except Exception:
        return {
            "available": False,
            "status": "indisponivel",
            "summary": "A fonte nao retornou escalacoes para este evento.",
        }

    if isinstance(lineup_payload, list) and lineup_payload:
        lineup_payload = lineup_payload[0]

    if not isinstance(lineup_payload, dict):
        return {
            "available": False,
            "status": "indisponivel",
            "summary": "Formato de escalacao nao reconhecido pela integracao atual.",
        }

    home_bucket = _lineup_bucket(lineup_payload, ["home", "home_team", "localteam"])
    away_bucket = _lineup_bucket(lineup_payload, ["away", "away_team", "visitorteam"])

    home_starting = _collect_lineup_names(
        home_bucket.get("starting_lineups")
        or home_bucket.get("starting")
        or home_bucket.get("lineup")
        or home_bucket.get("players")
    )
    away_starting = _collect_lineup_names(
        away_bucket.get("starting_lineups")
        or away_bucket.get("starting")
        or away_bucket.get("lineup")
        or away_bucket.get("players")
    )
    home_bench = _collect_lineup_names(home_bucket.get("substitutes") or home_bucket.get("bench"))
    away_bench = _collect_lineup_names(away_bucket.get("substitutes") or away_bucket.get("bench"))
    home_missing = _collect_lineup_names(
        home_bucket.get("missing_players") or home_bucket.get("absent") or home_bucket.get("injured")
    )
    away_missing = _collect_lineup_names(
        away_bucket.get("missing_players") or away_bucket.get("absent") or away_bucket.get("injured")
    )

    home_count = len(home_starting)
    away_count = len(away_starting)
    available = any([home_count, away_count, home_bench, away_bench, home_missing, away_missing])

    if not available:
        return {
            "available": False,
            "status": "indisponivel",
            "summary": "A API respondeu, mas nao trouxe nomes de escalacao utilizaveis.",
        }

    if home_count >= 11 and away_count >= 11:
        status = "confirmada"
    elif home_count or away_count:
        status = "parcial"
    else:
        status = "indisponivel"

    summary_parts = [
        f"Escalacao {status}: mandante {home_count} nomes | visitante {away_count} nomes."
    ]
    if home_missing or away_missing:
        summary_parts.append(
            f"Ausencias mapeadas: mandante {len(home_missing)} | visitante {len(away_missing)}."
        )

    return {
        "available": True,
        "status": status,
        "summary": " ".join(summary_parts),
        "home_starting_count": home_count,
        "away_starting_count": away_count,
        "home_starting_sample": home_starting[:5],
        "away_starting_sample": away_starting[:5],
        "home_bench_count": len(home_bench),
        "away_bench_count": len(away_bench),
        "home_missing_sample": home_missing[:5],
        "away_missing_sample": away_missing[:5],
    }


def build_game_from_api(event_id):
    match_details = get_football_match_details(event_id)
    if isinstance(match_details, list) and match_details:
        match_details = match_details[0]
    lineup_summary = _build_lineup_summary(event_id)

    home_goals, away_goals = _extract_score(match_details)
    minute = _extract_minute(match_details)
    attacks, dangerous_attacks = _extract_attacks(match_details)
    cards = _extract_cards(match_details)

    total_attacks = max(sum(_coerce_stat_value(value) for value in attacks), 1)
    total_dangerous = max(sum(_coerce_stat_value(value) for value in dangerous_attacks), 1)
    home_attack_share = _coerce_stat_value(attacks[0]) / total_attacks
    home_danger_share = _coerce_stat_value(dangerous_attacks[0]) / total_dangerous
    momentum_index = _clamp((home_attack_share * 0.4) + (home_danger_share * 0.6))

    frustration_index = _clamp(
        (1 - momentum_index) * 0.5
        + (cards / 8) * 0.3
        + (_clamp((away_goals - home_goals) / 3)) * 0.2
    )

    pressure_index = _clamp(
        momentum_index * 0.5
        + _clamp(minute / 90) * 0.2
        + _clamp(abs(home_goals - away_goals) / 4) * 0.1
        + _clamp(cards / 8) * 0.2
    )

    game = {
        "goal_diff": home_goals - away_goals,
        "total_goals": home_goals + away_goals,
        "home_goals": home_goals,
        "away_goals": away_goals,
        "minute": minute,
        "pressure_index": pressure_index,
        "recent_goals_conceded": 1 if home_goals < away_goals else 0,
        "cards": cards,
        "missed_chances": max(_coerce_stat_value(dangerous_attacks[0]) // 8, 0),
        "negative_streak": 1 if home_goals < away_goals else 0,
        "support_index": _clamp(0.55 + (0.25 if minute >= 60 else 0.1)),
        "chant_volume": _clamp(0.45 + momentum_index * 0.45),
        "crowd_frustration": frustration_index,
        "momentum_index": momentum_index,
        "home_team": match_details.get("home", {}).get("name") if isinstance(match_details.get("home"), dict) else match_details.get("home", "Mandante"),
        "away_team": match_details.get("away", {}).get("name") if isinstance(match_details.get("away"), dict) else match_details.get("away", "Visitante"),
        "league_name": (
            match_details.get("league", {}).get("name")
            if isinstance(match_details.get("league"), dict)
            else match_details.get("league_name", "Liga desconhecida")
        ),
        "lineup_summary": lineup_summary,
        "event_id": event_id,
        "score": f"{home_goals}-{away_goals}",
    }

    market_odds = {}
    try:
        market_odds = _extract_market_odds(get_football_odds(event_id, source="prematch"))
    except Exception:
        market_odds = {}

    return game, market_odds


def build_fallback_game():
    return {
        "goal_diff": 1,
        "total_goals": 3,
        "home_goals": 2,
        "away_goals": 1,
        "minute": 78,
        "pressure_index": 0.74,
        "recent_goals_conceded": 1,
        "cards": 2,
        "missed_chances": 3,
        "negative_streak": 2,
        "support_index": 0.88,
        "chant_volume": 0.81,
        "crowd_frustration": 0.25,
        "momentum_index": 0.69,
        "home_team": "Mandante",
        "away_team": "Visitante",
        "league_name": "Simulado",
        "lineup_summary": {
            "available": False,
            "status": "indisponivel",
            "summary": "Sem fonte de escalação no modo simulado.",
        },
        "event_id": None,
        "score": "2-1",
    }, {
        "home_win": 2.2,
        "draw": 3.2,
        "away_win": 3.4,
        "over_2_5": 1.85,
        "under_2_5": 1.95,
    }


def train_prediction_model():
    data_source = os.getenv("DATA_SOURCE", "local")
    dataset_file = os.getenv("KAGGLE_DATASET_FILE", "")

    df = load_data(source=data_source, file_path=dataset_file)
    source_notes = df.attrs.get("source_notes", [])
    model = train_model(df)
    if source_notes:
        data_source = f"{data_source} ({len(source_notes)} fonte(s))"
    return model, data_source


def _build_context_factors(model, game):
    priors = model.get("priors", {})
    defaults = priors.get("defaults", {})
    league_name = game.get("league_name")
    home_team = game.get("home_team")
    away_team = game.get("away_team")

    league_context = priors.get("league", {}).get(league_name, {})
    home_context = priors.get("home_team", {}).get(home_team, {})
    away_context = priors.get("away_team", {}).get(away_team, {})

    factors = []

    league_goal_rate = league_context.get("league_goal_rate", defaults.get("league_goal_rate", 2.5))
    if league_goal_rate >= 2.8:
        factors.append(
            f"A liga {league_name} costuma ter jogos mais abertos, com media de {round(league_goal_rate, 2)} gols."
        )
    else:
        factors.append(
            f"A liga {league_name} tende a jogos mais controlados, com media de {round(league_goal_rate, 2)} gols."
        )

    home_recent_points = home_context.get("home_team_recent_points", defaults.get("home_team_recent_points", 1.4))
    away_recent_points = away_context.get("away_team_recent_points", defaults.get("away_team_recent_points", 1.1))
    if home_recent_points > away_recent_points:
        factors.append(
            f"O mandante chega com forma recente melhor: {round(home_recent_points, 2)} pontos medios contra {round(away_recent_points, 2)} do visitante."
        )
    elif away_recent_points > home_recent_points:
        factors.append(
            f"O visitante chega em fase recente mais forte: {round(away_recent_points, 2)} pontos medios contra {round(home_recent_points, 2)} do mandante."
        )

    home_win_rate = home_context.get(
        "home_team_home_win_rate",
        defaults.get("home_team_home_win_rate", 0.45),
    )
    away_win_rate = away_context.get(
        "away_team_away_win_rate",
        defaults.get("away_team_away_win_rate", 0.27),
    )
    if home_win_rate >= away_win_rate:
        factors.append(
            f"O historico do mandante em casa ajuda a leitura, com taxa de vitoria perto de {round(home_win_rate * 100, 1)}%."
        )
    else:
        factors.append(
            f"O visitante tem comportamento competitivo fora de casa, com taxa de vitoria perto de {round(away_win_rate * 100, 1)}%."
        )

    return factors[:3]


def _derive_event_probabilities(game):
    minute = _safe_float(game.get("minute"), 0)
    pressure_index = _clamp(_safe_float(game.get("pressure_index"), 0.5))
    momentum_index = _clamp(_safe_float(game.get("momentum_index"), 0.5))
    crowd_frustration = _clamp(_safe_float(game.get("crowd_frustration"), 0.25))
    cards = _safe_float(game.get("cards"), 0)
    missed_chances = _safe_float(game.get("missed_chances"), 0)
    total_goals = _safe_float(game.get("total_goals"), 0)
    goal_diff = abs(_safe_float(game.get("goal_diff"), 0))

    late_game_factor = _clamp(minute / 90)
    opening_factor = _clamp((90 - minute) / 90)
    deadlock_factor = _clamp(1 - min(goal_diff / 3, 1))
    card_load = _clamp(cards / 7)
    chance_factor = _clamp(missed_chances / 5)
    score_activity = _clamp(total_goals / 4)

    goal_next_10m = _clamp(
        0.16
        + pressure_index * 0.24
        + momentum_index * 0.18
        + chance_factor * 0.18
        + late_game_factor * 0.12
        + deadlock_factor * 0.08
        + score_activity * 0.08
    )

    card_next_10m = _clamp(
        0.11
        + crowd_frustration * 0.28
        + pressure_index * 0.16
        + card_load * 0.22
        + late_game_factor * 0.11
        + deadlock_factor * 0.08
    )

    penalty_in_match = _clamp(
        0.05
        + pressure_index * 0.12
        + momentum_index * 0.08
        + chance_factor * 0.16
        + opening_factor * 0.05
        + late_game_factor * 0.07
        + card_load * 0.05
    )

    return {
        "goal_next_10m": round(goal_next_10m, 3),
        "card_next_10m": round(card_next_10m, 3),
        "penalty_in_match": round(penalty_in_match, 3),
    }


def build_analysis_snapshot(model, data_source, game, market_odds, api_status, user_profile="iniciante"):
    market_probabilities = predict_market_probabilities(model, game)
    market_probabilities.update(_derive_event_probabilities(game))
    prob = market_probabilities["home_win"]
    context_factors = _build_context_factors(model, game)
    insights = build_match_insights(
        prob,
        game,
        odd=None,
        is_home=True,
        market_probabilities=market_probabilities,
        market_odds=market_odds,
        context_factors=context_factors,
        user_profile=user_profile,
    )
    snapshot = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "data_source": data_source,
        "api_status": api_status,
        "game": game,
        "market_odds": market_odds,
        "probability": round(prob, 3),
        "market_probabilities": market_probabilities,
        "analysis": insights,
        "user_profile": user_profile,
        "priors": model.get("priors", {}),
    }
    insights["smart_score"] = _compute_smart_score(snapshot)
    insights["structured_report"] = _format_professional_report(snapshot)

    chatgpt_analysis = None
    if os.getenv("ENABLE_OPENAI_ANALYSIS", "0") == "1":
        try:
            chatgpt_analysis = generate_chatgpt_analysis(
                {
                    "game": game,
                    "market_odds": market_odds,
                    "probability": round(prob, 3),
                    "market_probabilities": market_probabilities,
                    "analysis": insights,
                    "api_status": api_status,
                }
            )
        except Exception as exc:
            chatgpt_analysis = f"Falha ao gerar analise com OpenAI: {exc}"

    snapshot["chatgpt_analysis"] = chatgpt_analysis
    return snapshot


def save_analysis_snapshot(snapshot):
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)

    latest_path = data_dir / "live_monitor_latest.json"
    history_path = data_dir / "live_monitor_logs.jsonl"

    latest_path.write_text(json.dumps(snapshot, ensure_ascii=True, indent=2), encoding="utf-8")
    with history_path.open("a", encoding="utf-8") as history_file:
        history_file.write(json.dumps(snapshot, ensure_ascii=True) + "\n")

    return latest_path, history_path


def save_opportunity_board(board_snapshot):
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)

    latest_path = data_dir / "opportunity_board_latest.json"
    latest_path.write_text(json.dumps(board_snapshot, ensure_ascii=True, indent=2), encoding="utf-8")
    return latest_path


def resolve_current_game(configured_event_id=None):
    api_status = "simulado"
    try:
        event_id = configured_event_id or pick_first_event_id()
        if event_id:
            game, market_odds = build_game_from_api(event_id)
            api_status = f"ao vivo (event_id={event_id})"
            return game, market_odds, api_status
    except Exception:
        pass

    game, market_odds = build_fallback_game()
    return game, market_odds, api_status


def analyze_event_snapshot(model, data_source, event_id):
    game, market_odds = build_game_from_api(event_id)
    return build_analysis_snapshot(
        model,
        data_source,
        game,
        market_odds,
        api_status=f"ao vivo (event_id={event_id})",
    )


def run_opportunity_board(model, data_source, max_games):
    live_events = get_live_football_events()
    top_rows = []

    for event in live_events[:max_games]:
        event_id = event.get("id") or event.get("event_id")
        if not event_id:
            continue

        try:
            snapshot = analyze_event_snapshot(model, data_source, event_id)
        except Exception:
            continue

        opportunities = snapshot["analysis"].get("opportunities", [])
        if not opportunities:
            continue

        best = opportunities[0]
        top_rows.append(
            {
                "event_id": event_id,
                "home_team": snapshot["game"]["home_team"],
                "away_team": snapshot["game"]["away_team"],
                "score": snapshot["game"]["score"],
                "minute": snapshot["game"]["minute"],
                "market": best["market"],
                "market_label": best["label"],
                "odd": best["odd"],
                "edge": best["edge"],
                "value": best["value"],
                "zen_guard": snapshot["analysis"]["zen_guard"]["status"],
                "api_status": snapshot["api_status"],
            }
        )

    top_rows.sort(key=lambda item: (item["value"], item["edge"]), reverse=True)

    board_snapshot = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "games_analyzed": len(top_rows),
        "top_opportunities": top_rows,
    }

    save_opportunity_board(board_snapshot)
    return board_snapshot


def _market_probability(analysis, market_name):
    probability = None
    markets = analysis.get("markets", {})
    if isinstance(markets, dict):
        probability = markets.get(market_name)
    elif isinstance(markets, list):
        for market in markets:
            if isinstance(market, dict) and market.get("market") == market_name:
                probability = market.get("probability")
                break
    if probability is None:
        probability = analysis.get("market_probabilities", {}).get(market_name)
    return probability


def _compute_smart_score(snapshot):
    analysis = snapshot["analysis"]
    game = snapshot["game"]
    priors = snapshot.get("priors", {})
    defaults = priors.get("defaults", {})
    home_team = game.get("home_team")
    away_team = game.get("away_team")

    home_context = priors.get("home_team", {}).get(home_team, {})
    away_context = priors.get("away_team", {}).get(away_team, {})

    home_recent_points = home_context.get(
        "home_team_recent_points",
        defaults.get("home_team_recent_points", 1.4),
    )
    away_recent_points = away_context.get(
        "away_team_recent_points",
        defaults.get("away_team_recent_points", 1.1),
    )
    home_home_win_rate = home_context.get(
        "home_team_home_win_rate",
        defaults.get("home_team_home_win_rate", 0.45),
    )
    away_away_win_rate = away_context.get(
        "away_team_away_win_rate",
        defaults.get("away_team_away_win_rate", 0.27),
    )

    tilt_score = analysis.get("tilt", {}).get("score", 0.5)
    crowd_score = analysis.get("crowd_sentiment", {}).get("score", 0.5)
    pressure_index = game.get("pressure_index", 0.5)
    momentum_index = game.get("momentum_index", 0.5)
    primary_market = analysis.get("primary_market", {})
    primary_market_value = (
        analysis.get("market_value", {}).get(primary_market.get("market"), {})
        or (analysis.get("opportunities") or [{}])[0]
    )
    primary_probability = primary_market.get("probability", 0.5)
    primary_edge = primary_market_value.get("edge", 0.0)

    form_recent = _clamp((home_recent_points + away_recent_points) / 6)
    statistical_strength = _clamp(
        primary_probability * 0.55
        + momentum_index * 0.2
        + _clamp(primary_edge + 0.5) * 0.25
    )
    emotional_factor = _clamp((1 - tilt_score) * 0.6 + crowd_score * 0.4)
    external_factor = _clamp(
        home_home_win_rate * 0.35
        + (1 - away_away_win_rate) * 0.25
        + pressure_index * 0.2
        + momentum_index * 0.2
    )

    value_index = round(
        _clamp(
            form_recent * 0.2
            + statistical_strength * 0.35
            + emotional_factor * 0.2
            + external_factor * 0.15
            + _clamp(primary_edge + 0.2) * 0.1
        ) * 100
    )

    zen_status = analysis.get("zen_guard", {}).get("status")
    if zen_status == "bloquear":
        risk_level = "alto"
    elif zen_status == "alertar" or primary_edge <= 0:
        risk_level = "medio"
    else:
        risk_level = "baixo"

    return {
        "form_recent": round(form_recent, 2),
        "statistical_strength": round(statistical_strength, 2),
        "emotional_factor": round(emotional_factor, 2),
        "external_factor": round(external_factor, 2),
        "value_index": value_index,
        "risk_level": risk_level,
    }


def _infer_match_importance(snapshot):
    api_status = (snapshot.get("api_status") or "").lower()
    game = snapshot["game"]
    pressure_index = game.get("pressure_index", 0.5)
    minute = game.get("minute", 0)

    if "ao vivo" in api_status and (minute >= 60 or pressure_index >= 0.65):
        return "alta"
    if pressure_index >= 0.45:
        return "media"
    return "baixa"


def _infer_probable_score(snapshot):
    game = snapshot["game"]
    analysis = snapshot["analysis"]
    home_goals = game.get("home_goals", 0)
    away_goals = game.get("away_goals", 0)
    minute = game.get("minute", 0)
    top_market = analysis.get("primary_market", {}).get("market")

    if minute >= 75:
        return f"{home_goals}-{away_goals}"

    if top_market == "draw":
        if home_goals == away_goals:
            return f"{home_goals}-{away_goals}"
        return "1-1"

    if top_market == "over_2_5":
        if home_goals + away_goals >= 3:
            return f"{home_goals}-{away_goals}"
        if home_goals >= away_goals:
            return f"{home_goals + 1}-{away_goals}"
        return f"{home_goals}-{away_goals + 1}"

    if top_market == "under_2_5":
        return f"{home_goals}-{away_goals}"

    if top_market == "home_win":
        return f"{max(home_goals, away_goals + 1)}-{away_goals}"

    if top_market == "away_win":
        return f"{home_goals}-{max(away_goals, home_goals + 1)}"

    return f"{home_goals}-{away_goals}"


def _stake_recommendation(smart_score):
    risk_level = smart_score["risk_level"]
    value_index = smart_score["value_index"]

    if risk_level == "baixo" and value_index >= 75:
        return "3% a 4%"
    if risk_level == "medio" and value_index >= 60:
        return "2% a 3%"
    if risk_level == "alto":
        return "1%"
    return "1% a 2%"


def _format_professional_report(snapshot):
    analysis = snapshot["analysis"]
    game = snapshot["game"]
    lineup_summary = game.get("lineup_summary", {})
    priors = snapshot.get("priors", {})
    defaults = priors.get("defaults", {})
    home_team = game.get("home_team", "Mandante")
    away_team = game.get("away_team", "Visitante")
    league_name = game.get("league_name", "Competicao nao informada")
    timestamp = snapshot.get("timestamp_utc", "")
    data_source = snapshot.get("data_source", "local")
    api_status = snapshot.get("api_status", "indisponivel")
    importance = _infer_match_importance(snapshot)
    smart_score = analysis.get("smart_score") or _compute_smart_score(snapshot)

    home_context = priors.get("home_team", {}).get(home_team, {})
    away_context = priors.get("away_team", {}).get(away_team, {})
    league_context = priors.get("league", {}).get(league_name, {})

    home_recent_points = home_context.get(
        "home_team_recent_points",
        defaults.get("home_team_recent_points", 1.4),
    )
    away_recent_points = away_context.get(
        "away_team_recent_points",
        defaults.get("away_team_recent_points", 1.1),
    )
    home_recent_goal_rate = home_context.get(
        "home_team_recent_goal_rate",
        defaults.get("home_team_recent_goal_rate", 1.2),
    )
    away_recent_goal_rate = away_context.get(
        "away_team_recent_goal_rate",
        defaults.get("away_team_recent_goal_rate", 1.0),
    )
    home_home_win_rate = home_context.get(
        "home_team_home_win_rate",
        defaults.get("home_team_home_win_rate", 0.45),
    )
    away_away_win_rate = away_context.get(
        "away_team_away_win_rate",
        defaults.get("away_team_away_win_rate", 0.27),
    )
    league_goal_rate = league_context.get(
        "league_goal_rate",
        defaults.get("league_goal_rate", 2.5),
    )
    league_draw_rate = league_context.get(
        "league_draw_rate",
        defaults.get("league_draw_rate", 0.28),
    )

    primary_market = analysis.get("primary_market", {})
    top_opportunity = (
        analysis.get("market_value", {}).get(primary_market.get("market"), {})
        or (analysis.get("opportunities") or [{}])[0]
    )
    top_alternative = (analysis.get("opportunities") or [{}, {}])[1] if len(analysis.get("opportunities", [])) > 1 else {}
    primary_odd = top_opportunity.get("odd") or analysis.get("primary_odd")
    implied_probability = top_opportunity.get("implied_probability")
    if implied_probability is None and primary_odd:
        implied_probability = round(1 / primary_odd, 3)
    primary_edge = top_opportunity.get("edge")

    home_win = _market_probability(analysis, "home_win")
    draw = _market_probability(analysis, "draw")
    away_win = _market_probability(analysis, "away_win")
    over_25 = _market_probability(analysis, "over_2_5")
    under_25 = _market_probability(analysis, "under_2_5")
    btts = _market_probability(analysis, "both_teams_score")

    lines = [
        "1. CONTEXTO DA PARTIDA",
        f"- Competicao, data e horario: {league_name} | snapshot {timestamp} UTC.",
        f"- Local do jogo: {home_team} (mandante) x {away_team} (visitante).",
        "- Situacao na tabela: nao disponivel na base atual.",
        "- Objetivo do jogo: nao disponivel na base atual.",
        f"- Importancia da partida: {importance}.",
        "",
        "2. ANALISE ESTATISTICA",
        f"- Forma recente estimada pelo treino: {home_team} {home_recent_points:.2f} pts/jogo em casa vs {away_team} {away_recent_points:.2f} pts/jogo fora.",
        f"- Media de gols recente estimada: {home_team} {home_recent_goal_rate:.2f} marcados | {away_team} {away_recent_goal_rate:.2f} marcados.",
        "- Expected Goals (xG): nao disponivel na base atual.",
        "- Confrontos diretos (H2H): nao disponivel na base atual.",
        f"- Desempenho casa x fora: mandante vence em casa ~{home_home_win_rate * 100:.1f}% | visitante vence fora ~{away_away_win_rate * 100:.1f}%.",
        f"- Padroes calculados agora: over 2.5 {over_25 if over_25 is not None else '-'} | under 2.5 {under_25 if under_25 is not None else '-'} | ambas marcam {btts if btts is not None else '-'}.",
        f"- Contexto de liga do treino: media de {league_goal_rate:.2f} gols e taxa de empate de {league_draw_rate * 100:.1f}%.",
        "",
        "3. ANALISE TATICA",
        f"- Leitura de estilo atual: {analysis.get('analysis', 'Sem leitura tatico-estatistica.')}",
        f"- Pontos fortes e fracos: momentum {game.get('momentum_index', 0):.2f} | pressao {game.get('pressure_index', 0):.2f} | placar atual {game.get('score', '-')}.",
        f"- Matchup: {analysis.get('context_factors', ['Nao ha matchup detalhado disponivel.'])[0]}",
        "- Possiveis ajustes taticos: inferencia limitada ao estado ao vivo e aos priors do modelo.",
        "",
        "4. CONDICAO DO ELENCO",
        "- Lesoes e suspensoes: nao disponivel na base atual.",
        "- Retornos importantes: nao disponivel na base atual.",
        "- Fadiga e rotacao: nao disponivel na base atual.",
        f"- Escalacoes: {lineup_summary.get('summary', 'Indisponivel')}",
        f"- Amostra de provaveis titulares do mandante: {', '.join(lineup_summary.get('home_starting_sample', [])) if lineup_summary.get('home_starting_sample') else 'nao disponivel na base atual.'}",
        f"- Amostra de provaveis titulares do visitante: {', '.join(lineup_summary.get('away_starting_sample', [])) if lineup_summary.get('away_starting_sample') else 'nao disponivel na base atual.'}",
        "",
        "5. FATORES EXTERNOS",
        "- Clima: nao disponivel na base atual.",
        "- Condicao do gramado: nao disponivel na base atual.",
        "- Viagens e desgaste fisico: nao disponivel na base atual.",
        "- Arbitragem: nao disponivel na base atual.",
        f"- Contexto operacional: {api_status} | fonte de treino {data_source}.",
        "",
        "6. FATORES PSICOLOGICOS E EMOCIONAIS",
        f"- Pressao da torcida: {analysis.get('crowd_sentiment', {}).get('summary', 'Indisponivel')}",
        f"- Momento emocional: {analysis.get('tilt', {}).get('summary', 'Indisponivel')}",
        "- Repercussao recente nas redes sociais: nao disponivel na base atual.",
        "- Conflitos internos: nao disponivel na base atual.",
        "- Classico/rivalidade: nao disponivel na base atual.",
        f"- Necessidade de resposta: {analysis.get('narrative', 'Narrativa indisponivel.')}",
        "",
        "7. FATORES SOCIAIS E MIDIATICOS",
        "- Clima nas redes sociais: nao disponivel na base atual.",
        "- Apoio ou cobranca da torcida: inferido parcialmente pelo crowd sentiment, sem coleta externa dedicada.",
        "- Noticias recentes: nao disponivel na base atual.",
        "- Narrativa da midia: nao disponivel na base atual.",
        "",
        "8. ANALISE DE ODDS E VALOR",
        f"- Odds atuais: {primary_market.get('label', 'Mercado principal')} @ {primary_odd if primary_odd is not None else 'indisponivel'}.",
        f"- Probabilidade implicita: {implied_probability if implied_probability is not None else 'indisponivel'}.",
        f"- Probabilidade real estimada: {primary_market.get('probability', 'indisponivel')}.",
        f"- Identificacao de value bet: edge {primary_edge if primary_edge is not None else 'indisponivel'} | value {top_opportunity.get('value', 'indisponivel')}.",
        "",
        "9. SCORE INTELIGENTE",
        f"- Forma recente (0 a 1): {smart_score['form_recent']}",
        f"- Forca estatistica (0 a 1): {smart_score['statistical_strength']}",
        f"- Fator emocional (0 a 1): {smart_score['emotional_factor']}",
        f"- Fator externo (0 a 1): {smart_score['external_factor']}",
        f"- Indice de Valor (0 a 100): {smart_score['value_index']}",
        f"- Risco: {smart_score['risk_level']}",
        "",
        "10. PREVISAO FINAL",
        f"- Probabilidade de vitoria: {home_team} {home_win if home_win is not None else '-'} | empate {draw if draw is not None else '-'} | {away_team} {away_win if away_win is not None else '-'}",
        f"- Placar provavel (inferencia do modelo): {_infer_probable_score(snapshot)}",
        f"- Grau de confianca (0 a 1): {primary_market.get('probability', 0)}",
        "",
        "11. SUGESTOES DE APOSTA",
        f"- Aposta principal: {primary_market.get('label', 'Sem mercado principal')} {'@ ' + str(primary_odd) if primary_odd is not None else ''}".strip(),
        f"- Aposta alternativa: {top_alternative.get('label', 'Sem alternativa robusta no momento')} {'@ ' + str(top_alternative.get('odd')) if top_alternative.get('odd') is not None else ''}".strip(),
        f"- Justificativa: {analysis.get('betting_guidance', {}).get('headline', analysis.get('analysis', 'Sem justificativa.'))} {analysis.get('betting_guidance', {}).get('risk', '')}".strip(),
        "",
        "12. GESTAO DE BANCA",
        f"- Nivel de risco: {smart_score['risk_level']}",
        f"- Stake recomendada: {_stake_recommendation(smart_score)}",
        "",
        "Observacao metodologica",
        "- Esta versao usa apenas dados realmente disponiveis no projeto atual. Onde a base nao cobre o item, o campo foi marcado como nao disponivel para evitar invencao.",
    ]

    return "\n".join(lines)


def format_whatsapp_reply(snapshot):
    analysis = snapshot["analysis"]
    analysis["smart_score"] = _compute_smart_score(snapshot)
    return _format_professional_report(snapshot)
