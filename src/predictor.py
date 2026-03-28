import pandas as pd


def _prior_value(model_bundle, scope, key, feature_name):
    priors = model_bundle.get("priors", {})
    defaults = priors.get("defaults", {})
    if key is not None:
        scoped = priors.get(scope, {}).get(key, {})
        if feature_name in scoped:
            return scoped[feature_name]
    return defaults.get(feature_name, 0.0)


def _build_feature_frame(model_bundle, game_data):
    home_goals = game_data.get("home_goals", max(game_data["goal_diff"], 0))
    away_goals = game_data.get("away_goals", max(-game_data["goal_diff"], 0))
    league_name = game_data.get("league_name")
    home_team = game_data.get("home_team")
    away_team = game_data.get("away_team")
    features = pd.DataFrame(
        [
            {
                "goal_diff": game_data["goal_diff"],
                "total_goals": game_data["total_goals"],
                "goal_diff_abs": abs(game_data["goal_diff"]),
                "is_draw": int(game_data["goal_diff"] == 0),
                "home_goals": home_goals,
                "away_goals": away_goals,
                "home_clean_sheet": int(away_goals == 0),
                "away_clean_sheet": int(home_goals == 0),
                "home_scored": int(home_goals > 0),
                "away_scored": int(away_goals > 0),
                "league_goal_rate": _prior_value(model_bundle, "league", league_name, "league_goal_rate"),
                "league_draw_rate": _prior_value(model_bundle, "league", league_name, "league_draw_rate"),
                "home_team_goal_rate": _prior_value(model_bundle, "home_team", home_team, "home_team_goal_rate"),
                "away_team_goal_rate": _prior_value(model_bundle, "away_team", away_team, "away_team_goal_rate"),
                "home_team_concede_rate": _prior_value(
                    model_bundle, "home_team", home_team, "home_team_concede_rate"
                ),
                "away_team_concede_rate": _prior_value(
                    model_bundle, "away_team", away_team, "away_team_concede_rate"
                ),
                "home_team_home_win_rate": _prior_value(
                    model_bundle, "home_team", home_team, "home_team_home_win_rate"
                ),
                "away_team_away_win_rate": _prior_value(
                    model_bundle, "away_team", away_team, "away_team_away_win_rate"
                ),
                "home_team_recent_goal_rate": _prior_value(
                    model_bundle, "home_team", home_team, "home_team_recent_goal_rate"
                ),
                "away_team_recent_goal_rate": _prior_value(
                    model_bundle, "away_team", away_team, "away_team_recent_goal_rate"
                ),
                "home_team_recent_points": _prior_value(
                    model_bundle, "home_team", home_team, "home_team_recent_points"
                ),
                "away_team_recent_points": _prior_value(
                    model_bundle, "away_team", away_team, "away_team_recent_points"
                ),
            }
        ]
    )
    return features[model_bundle["feature_names"]]


def predict_market_probabilities(model_bundle, game_data):
    features = _build_feature_frame(model_bundle, game_data)
    probabilities = {}

    for market_name, estimator in model_bundle["markets"].items():
        probabilities[market_name] = float(round(estimator.predict_proba(features)[0][1], 3))

    return probabilities


def predict_game(model_bundle, game_data):
    return predict_market_probabilities(model_bundle, game_data)["home_win"]
