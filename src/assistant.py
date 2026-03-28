MARKET_LABELS = {
    "home_win": "Vitoria do mandante",
    "draw": "Empate",
    "away_win": "Vitoria do visitante",
    "over_2_5": "Over 2.5 gols",
    "under_2_5": "Under 2.5 gols",
    "both_teams_score": "Ambas marcam",
    "goal_next_10m": "Gol nos proximos 10 minutos",
    "card_next_10m": "Cartao nos proximos 10 minutos",
    "penalty_in_match": "Penalti ate o fim da partida",
}

BETTING_MARKETS = {
    "home_win",
    "draw",
    "away_win",
    "over_2_5",
    "under_2_5",
    "both_teams_score",
}


def _clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))


def _round(value, digits=3):
    try:
        return round(float(value), digits)
    except (TypeError, ValueError):
        return 0.0


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _tilt_from_game(game):
    cards = _safe_float(game.get("cards"), 0)
    frustration = _safe_float(game.get("crowd_frustration"), 0.25)
    negative_streak = _safe_float(game.get("negative_streak"), 0)
    score = _clamp(frustration * 0.5 + min(cards / 8, 1) * 0.3 + min(negative_streak / 3, 1) * 0.2)

    if score >= 0.7:
        level = "alto"
        summary = "Momento emocional tenso, com risco maior de leitura impulsiva."
    elif score >= 0.45:
        level = "medio"
        summary = "Existe alguma pressao emocional no jogo, mas ainda controlada."
    else:
        level = "baixo"
        summary = "Jogo relativamente sob controle do ponto de vista emocional."

    return {
        "score": _round(score, 3),
        "level": level,
        "summary": summary,
    }


def _crowd_sentiment_from_game(game):
    support = _safe_float(game.get("support_index"), 0.55)
    chant = _safe_float(game.get("chant_volume"), 0.5)
    frustration = _safe_float(game.get("crowd_frustration"), 0.25)
    score = _clamp(support * 0.45 + chant * 0.4 + (1 - frustration) * 0.15)

    if frustration >= 0.65:
        mood = "pressionada"
        summary = "A torcida parece mais tensa e exigente neste momento."
    elif score >= 0.68:
        mood = "confiante"
        summary = "A torcida sustenta um clima positivo e empurra o time."
    else:
        mood = "atenta"
        summary = "A torcida acompanha o jogo com cautela, sem euforia excessiva."

    return {
        "score": _round(score, 3),
        "mood": mood,
        "summary": summary,
    }


def _market_value(probability, odd):
    if not odd or odd <= 1:
        return {
            "odd": None,
            "implied_probability": None,
            "edge": 0.0,
            "value": False,
        }

    implied_probability = 1 / odd
    edge = probability - implied_probability
    return {
        "odd": _round(odd, 3),
        "implied_probability": _round(implied_probability, 3),
        "edge": _round(edge, 3),
        "value": edge > 0,
    }


def _zen_guard(primary_edge, primary_probability, tilt_score):
    if tilt_score >= 0.72:
        return {
            "status": "bloquear",
            "action": "evitar entrada agora",
            "reason": "O jogo esta emocionalmente instavel e aumenta o risco da leitura falhar.",
        }

    if primary_edge <= 0 or primary_probability < 0.52:
        return {
            "status": "alertar",
            "action": "reduzir exposicao",
            "reason": "A vantagem estatistica esta curta e pede mais cautela.",
        }

    return {
        "status": "liberar",
        "action": "seguir com disciplina",
        "reason": "Ha sinal de valor, mas a execucao ainda deve ser conservadora.",
    }


def _betting_guidance(primary_market, zen_guard, opportunities):
    best_bet = primary_market.get("label", "Sem mercado principal")
    if zen_guard["status"] == "bloquear":
        headline = "O modelo encontrou leitura, mas o risco atual nao favorece entrada."
        risk = "Momento de alta cautela. Melhor observar e esperar confirmacao."
    elif opportunities and opportunities[0].get("value"):
        headline = f"O melhor ponto de atencao agora e {best_bet}."
        risk = "Existe valor, mas a entrada ainda deve respeitar gestao de banca."
    else:
        headline = f"{best_bet} lidera a leitura, mas sem folga forte de valor."
        risk = "Leitura moderada. Evite aumentar risco sem confirmacao adicional."

    return {
        "best_bet": best_bet,
        "headline": headline,
        "risk": risk,
        "conservative_option": "Buscar mercado mais protegido ou esperar mais sinais.",
    }


def _narrative(game, primary_market, zen_guard):
    home_team = game.get("home_team", "Mandante")
    away_team = game.get("away_team", "Visitante")
    minute = game.get("minute", 0)
    score = game.get("score", "-")
    label = primary_market.get("label", "mercado principal")

    if zen_guard["status"] == "bloquear":
        return (
            f"{home_team} x {away_team} esta em {score} aos {minute} minutos. "
            f"O mercado {label} aparece no radar, mas o contexto emocional do jogo recomenda cautela."
        )

    return (
        f"{home_team} x {away_team} esta em {score} aos {minute} minutos. "
        f"No momento, o mercado mais forte do modelo e {label}, com leitura guiada pelo contexto da partida."
    )


def _analysis_text(game, primary_market, context_factors):
    base = (
        f"O modelo destaca {primary_market.get('label', 'o mercado principal')} "
        f"como leitura mais forte agora."
    )
    if context_factors:
        return f"{base} Principal fator: {context_factors[0]}"
    return base


def build_match_insights(
    probability,
    game,
    odd=None,
    is_home=True,
    market_probabilities=None,
    market_odds=None,
    context_factors=None,
    user_profile="iniciante",
):
    market_probabilities = market_probabilities or {}
    market_odds = market_odds or {}
    context_factors = context_factors or []

    markets = []
    market_value = {}
    opportunities = []

    for market_name, market_probability in market_probabilities.items():
        value_data = _market_value(market_probability, market_odds.get(market_name))
        label = MARKET_LABELS.get(market_name, market_name)
        market_value[market_name] = {
            "market": market_name,
            "label": label,
            **value_data,
        }
        markets.append(
            {
                "market": market_name,
                "label": label,
                "probability": _round(market_probability, 3),
            }
        )
        opportunities.append(
            {
                "market": market_name,
                "label": label,
                **value_data,
            }
        )

    markets.sort(key=lambda item: item["probability"], reverse=True)
    opportunities.sort(key=lambda item: (item["value"], item["edge"], item["probability"] if "probability" in item else 0), reverse=True)

    betting_markets = [market for market in markets if market.get("market") in BETTING_MARKETS]
    primary_market = betting_markets[0] if betting_markets else (
        markets[0] if markets else {"market": "home_win", "label": "Vitoria do mandante", "probability": _round(probability, 3)}
    )
    tilt = _tilt_from_game(game)
    crowd_sentiment = _crowd_sentiment_from_game(game)
    primary_edge = market_value.get(primary_market["market"], {}).get("edge", 0.0)
    zen_guard = _zen_guard(primary_edge, primary_market["probability"], tilt["score"])
    betting_guidance = _betting_guidance(primary_market, zen_guard, opportunities)
    narrative = _narrative(game, primary_market, zen_guard)
    analysis = _analysis_text(game, primary_market, context_factors)

    xai_insights = list(context_factors[:3])
    if primary_edge > 0:
        xai_insights.append(
            f"O mercado principal tem edge positivo de {primary_edge:.3f} contra a odd disponivel."
        )
    if tilt["level"] != "baixo":
        xai_insights.append("O componente emocional do jogo pede atencao extra na tomada de decisao.")

    main_value = market_value.get(primary_market["market"], {})
    bet_text = (
        f"{primary_market['label']} @ {main_value['odd']}"
        if main_value.get("odd") is not None
        else f"{primary_market['label']} sem odd confirmada no momento"
    )

    return {
        "analysis": analysis,
        "bet": bet_text,
        "betting_guidance": betting_guidance,
        "context_factors": context_factors,
        "crowd_sentiment": crowd_sentiment,
        "market_odds": market_odds,
        "market_probabilities": market_probabilities,
        "market_value": market_value,
        "markets": markets,
        "narrative": narrative,
        "opportunities": opportunities,
        "primary_market": primary_market,
        "primary_odd": main_value.get("odd"),
        "tilt": tilt,
        "user_profile": user_profile,
        "xai_insights": xai_insights,
        "zen_guard": zen_guard,
    }
