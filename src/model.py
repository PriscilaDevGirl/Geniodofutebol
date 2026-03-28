import pandas as pd
from sklearn.ensemble import RandomForestClassifier


TRAINING_FEATURES = [
    "goal_diff",
    "total_goals",
    "goal_diff_abs",
    "is_draw",
    "home_goals",
    "away_goals",
    "home_clean_sheet",
    "away_clean_sheet",
    "home_scored",
    "away_scored",
    "league_goal_rate",
    "league_draw_rate",
    "home_team_goal_rate",
    "away_team_goal_rate",
    "home_team_concede_rate",
    "away_team_concede_rate",
    "home_team_home_win_rate",
    "away_team_away_win_rate",
    "home_team_recent_goal_rate",
    "away_team_recent_goal_rate",
    "home_team_recent_points",
    "away_team_recent_points",
]

MARKET_TARGETS = {
    "home_win": lambda df: (df["home_goals"] > df["away_goals"]).astype(int),
    "draw": lambda df: (df["home_goals"] == df["away_goals"]).astype(int),
    "away_win": lambda df: (df["home_goals"] < df["away_goals"]).astype(int),
    "over_2_5": lambda df: (df["total_goals"] > 2.5).astype(int),
    "under_2_5": lambda df: (df["total_goals"] < 2.5).astype(int),
    "both_teams_score": lambda df: (
        (df["home_goals"] > 0) & (df["away_goals"] > 0)
    ).astype(int),
}


def _safe_rate(series, default):
    if series is None or len(series) == 0:
        return default
    return float(series.mean())


def _enrich_with_context_features(df):
    enriched = df.copy()

    global_goal_rate = float(enriched["total_goals"].mean()) if len(enriched) else 2.5
    global_draw_rate = float((enriched["home_goals"] == enriched["away_goals"]).mean()) if len(enriched) else 0.28
    global_home_goal_rate = float(enriched["home_goals"].mean()) if len(enriched) else 1.2
    global_away_goal_rate = float(enriched["away_goals"].mean()) if len(enriched) else 1.0
    global_home_win_rate = float((enriched["home_goals"] > enriched["away_goals"]).mean()) if len(enriched) else 0.45
    global_away_win_rate = float((enriched["home_goals"] < enriched["away_goals"]).mean()) if len(enriched) else 0.27
    global_home_points = float(
        ((enriched["home_goals"] > enriched["away_goals"]) * 3 + (enriched["home_goals"] == enriched["away_goals"]) * 1).mean()
    ) if len(enriched) else 1.4
    global_away_points = float(
        ((enriched["home_goals"] < enriched["away_goals"]) * 3 + (enriched["home_goals"] == enriched["away_goals"]) * 1).mean()
    ) if len(enriched) else 1.1

    priors = {
        "defaults": {
            "league_goal_rate": global_goal_rate,
            "league_draw_rate": global_draw_rate,
            "home_team_goal_rate": global_home_goal_rate,
            "away_team_goal_rate": global_away_goal_rate,
            "home_team_concede_rate": global_away_goal_rate,
            "away_team_concede_rate": global_home_goal_rate,
            "home_team_home_win_rate": global_home_win_rate,
            "away_team_away_win_rate": global_away_win_rate,
            "home_team_recent_goal_rate": global_home_goal_rate,
            "away_team_recent_goal_rate": global_away_goal_rate,
            "home_team_recent_points": global_home_points,
            "away_team_recent_points": global_away_points,
        },
        "league": {},
        "home_team": {},
        "away_team": {},
    }

    if "league_name" in enriched.columns:
        league_agg = (
            enriched.groupby("league_name")
            .agg(
                league_goal_rate=("total_goals", "mean"),
                league_draw_rate=("is_draw", "mean"),
            )
            .round(3)
        )
        priors["league"] = league_agg.to_dict(orient="index")
        enriched = enriched.merge(league_agg, on="league_name", how="left")
    else:
        enriched["league_goal_rate"] = global_goal_rate
        enriched["league_draw_rate"] = global_draw_rate

    if "home_team" in enriched.columns:
        home_team_agg = (
            enriched.groupby("home_team")
            .agg(
                home_team_goal_rate=("home_goals", "mean"),
                home_team_concede_rate=("away_goals", "mean"),
                home_team_home_win_rate=("goal_diff", lambda values: float((values > 0).mean())),
            )
            .round(3)
        )
        priors["home_team"] = home_team_agg.to_dict(orient="index")
        enriched = enriched.merge(home_team_agg, on="home_team", how="left")
    else:
        enriched["home_team_goal_rate"] = global_home_goal_rate
        enriched["home_team_concede_rate"] = global_away_goal_rate
        enriched["home_team_home_win_rate"] = global_home_win_rate

    if "away_team" in enriched.columns:
        away_team_agg = (
            enriched.groupby("away_team")
            .agg(
                away_team_goal_rate=("away_goals", "mean"),
                away_team_concede_rate=("home_goals", "mean"),
                away_team_away_win_rate=("goal_diff", lambda values: float((values < 0).mean())),
            )
            .round(3)
        )
        priors["away_team"] = away_team_agg.to_dict(orient="index")
        enriched = enriched.merge(away_team_agg, on="away_team", how="left")
    else:
        enriched["away_team_goal_rate"] = global_away_goal_rate
        enriched["away_team_concede_rate"] = global_home_goal_rate
        enriched["away_team_away_win_rate"] = global_away_win_rate

    if {"match_date", "home_team", "away_team"}.issubset(enriched.columns):
        enriched["match_date"] = pd.to_datetime(enriched["match_date"], errors="coerce")
        enriched = enriched.sort_values("match_date").reset_index(drop=True)

        home_points = (enriched["home_goals"] > enriched["away_goals"]).astype(int) * 3 + enriched["is_draw"]
        away_points = (enriched["home_goals"] < enriched["away_goals"]).astype(int) * 3 + enriched["is_draw"]

        enriched["home_team_recent_goal_rate"] = (
            enriched.groupby("home_team")["home_goals"]
            .transform(lambda values: values.shift(1).rolling(5, min_periods=1).mean())
        )
        enriched["away_team_recent_goal_rate"] = (
            enriched.groupby("away_team")["away_goals"]
            .transform(lambda values: values.shift(1).rolling(5, min_periods=1).mean())
        )
        enriched["home_team_recent_points"] = (
            home_points.groupby(enriched["home_team"])
            .transform(lambda values: values.shift(1).rolling(5, min_periods=1).mean())
        )
        enriched["away_team_recent_points"] = (
            away_points.groupby(enriched["away_team"])
            .transform(lambda values: values.shift(1).rolling(5, min_periods=1).mean())
        )

        latest_home_recent = (
            enriched.dropna(subset=["home_team"])
            .sort_values("match_date")
            .groupby("home_team")
            .tail(1)[["home_team", "home_team_recent_goal_rate", "home_team_recent_points"]]
        )
        latest_away_recent = (
            enriched.dropna(subset=["away_team"])
            .sort_values("match_date")
            .groupby("away_team")
            .tail(1)[["away_team", "away_team_recent_goal_rate", "away_team_recent_points"]]
        )

        for _, row in latest_home_recent.iterrows():
            priors["home_team"].setdefault(row["home_team"], {}).update(
                {
                    "home_team_recent_goal_rate": round(float(row["home_team_recent_goal_rate"]), 3)
                    if pd.notna(row["home_team_recent_goal_rate"])
                    else global_home_goal_rate,
                    "home_team_recent_points": round(float(row["home_team_recent_points"]), 3)
                    if pd.notna(row["home_team_recent_points"])
                    else global_home_points,
                }
            )

        for _, row in latest_away_recent.iterrows():
            priors["away_team"].setdefault(row["away_team"], {}).update(
                {
                    "away_team_recent_goal_rate": round(float(row["away_team_recent_goal_rate"]), 3)
                    if pd.notna(row["away_team_recent_goal_rate"])
                    else global_away_goal_rate,
                    "away_team_recent_points": round(float(row["away_team_recent_points"]), 3)
                    if pd.notna(row["away_team_recent_points"])
                    else global_away_points,
                }
            )
    else:
        enriched["home_team_recent_goal_rate"] = global_home_goal_rate
        enriched["away_team_recent_goal_rate"] = global_away_goal_rate
        enriched["home_team_recent_points"] = global_home_points
        enriched["away_team_recent_points"] = global_away_points

    for feature_name, default_value in priors["defaults"].items():
        enriched[feature_name] = enriched.get(feature_name, default_value)
        enriched[feature_name] = enriched[feature_name].fillna(default_value)

    return enriched, priors


def train_model(df):
    enriched_df, priors = _enrich_with_context_features(df)
    X = enriched_df[TRAINING_FEATURES]
    estimators = {}

    for market_name, target_builder in MARKET_TARGETS.items():
        y = target_builder(enriched_df)
        model = RandomForestClassifier(
            n_estimators=200,
            random_state=42,
        )
        model.fit(X, y)
        estimators[market_name] = model

    return {
        "feature_names": TRAINING_FEATURES,
        "markets": estimators,
        "priors": priors,
    }
