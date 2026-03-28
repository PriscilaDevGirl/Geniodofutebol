import os
import re
from pathlib import Path

import pandas as pd

KAGGLE_DATASET_HANDLE = "hubertsidorowicz/football-players-stats-2025-2026"
REQUIRED_MATCH_COLUMNS = {"home_goals", "away_goals"}
DEFAULT_LOCAL_DATASET = "data/matches.csv"
LOCAL_DATASET_GLOB = "data/datasets/*.csv"
HOME_GOALS_ALIASES = {
    "home_goals",
    "home goal",
    "home goals",
    "home_score",
    "score_home",
    "goals_home",
    "home_team_goals",
    "home_goals_ft",
    "ft_home",
    "full_time_home_goals",
    "team_a_goals",
    "team1_goals",
    "score1",
}
AWAY_GOALS_ALIASES = {
    "away_goals",
    "away goal",
    "away goals",
    "away_score",
    "score_away",
    "goals_away",
    "away_team_goals",
    "away_goals_ft",
    "ft_away",
    "full_time_away_goals",
    "team_b_goals",
    "team2_goals",
    "score2",
}
SCORE_TEXT_ALIASES = {
    "score",
    "ft_score",
    "final_score",
    "match_score",
    "full_time_score",
    "result",
    "resultado",
    "placar",
}
OPTIONAL_COLUMN_ALIASES = {
    "home_team": {
        "home_team",
        "home",
        "mandante",
        "team_home",
        "home_club",
        "team1",
        "team_a",
    },
    "away_team": {
        "away_team",
        "away",
        "visitante",
        "team_away",
        "away_club",
        "team2",
        "team_b",
    },
    "match_date": {
        "match_date",
        "date",
        "game_date",
        "fixture_date",
        "event_date",
        "data",
    },
    "league_name": {
        "league_name",
        "league",
        "competition",
        "tournament",
        "campeonato",
        "liga",
    },
}


def load_data(source=None, file_path=None):
    source = (source or os.getenv("DATA_SOURCE", "local")).lower()

    frames = []
    source_notes = []

    if source in {"local", "hybrid"}:
        local_frames, local_notes = load_local_datasets(file_path=file_path)
        frames.extend(local_frames)
        source_notes.extend(local_notes)

    if source in {"kaggle", "hybrid"}:
        kaggle_frames, kaggle_notes = load_kaggle_datasets(
            primary_file_path=file_path or os.getenv("KAGGLE_DATASET_FILE", "")
        )
        frames.extend(kaggle_frames)
        source_notes.extend(kaggle_notes)

    if not frames:
        raise ValueError(
            "Nenhum dataset compativel foi carregado. Revise DATA_SOURCE, arquivos locais e datasets Kaggle."
        )

    combined = pd.concat(frames, ignore_index=True).drop_duplicates().reset_index(drop=True)
    combined.attrs["source_notes"] = source_notes
    return combined


def load_local_datasets(file_path=None):
    dataset_paths = []
    explicit_path = file_path or os.getenv("LOCAL_TRAINING_FILE", DEFAULT_LOCAL_DATASET)
    if explicit_path:
        dataset_paths.append(Path(explicit_path))

    dataset_paths.extend(sorted(Path().glob(LOCAL_DATASET_GLOB)))

    extra_paths = [
        Path(path.strip())
        for path in os.getenv("EXTRA_TRAIN_FILES", "").split(";")
        if path.strip()
    ]
    dataset_paths.extend(extra_paths)

    unique_paths = []
    seen = set()
    for path in dataset_paths:
        normalized = str(path)
        if normalized not in seen and path.exists():
            seen.add(normalized)
            unique_paths.append(path)

    frames = []
    notes = []
    for path in unique_paths:
        df = pd.read_csv(path)
        normalized = normalize_match_dataframe(df)
        frames.append(create_features(normalized))
        notes.append(f"local:{path}")

    return frames, notes


def load_kaggle_datasets(primary_file_path):
    dataset_specs = []

    if primary_file_path:
        dataset_specs.append((KAGGLE_DATASET_HANDLE, primary_file_path))

    raw_specs = os.getenv("KAGGLE_DATASET_SPECS", "")
    for raw_spec in raw_specs.split(";"):
        raw_spec = raw_spec.strip()
        if not raw_spec:
            continue
        if "|" not in raw_spec:
            raise ValueError(
                "Use KAGGLE_DATASET_SPECS no formato handle|arquivo.csv;handle2|arquivo2.csv"
            )
        handle, dataset_file = raw_spec.split("|", 1)
        dataset_specs.append((handle.strip(), dataset_file.strip()))

    frames = []
    notes = []
    for dataset_handle, dataset_file in dataset_specs:
        df = load_kaggle_data(file_path=dataset_file, dataset_handle=dataset_handle)
        normalized = normalize_match_dataframe(df)
        frames.append(create_features(normalized))
        notes.append(f"kaggle:{dataset_handle}:{dataset_file}")

    return frames, notes


def load_kaggle_data(file_path, dataset_handle=KAGGLE_DATASET_HANDLE):
    try:
        import kagglehub
        from kagglehub import KaggleDatasetAdapter
    except ImportError as exc:
        raise ImportError(
            "Instale a dependencia com: pip install kagglehub[pandas-datasets]"
        ) from exc

    kaggle_token = os.getenv("KAGGLE_API_TOKEN")
    if kaggle_token:
        os.environ["KAGGLE_API_TOKEN"] = kaggle_token

    loader = getattr(kagglehub, "load_dataset", None) or getattr(kagglehub, "dataset_load", None)
    if loader is None:
        raise AttributeError(
            "A versao instalada de kagglehub nao possui load_dataset nem dataset_load."
        )

    if not file_path:
        raise ValueError(
            "Defina KAGGLE_DATASET_FILE com o arquivo do dataset que sera usado no treino."
        )

    return loader(
        KaggleDatasetAdapter.PANDAS,
        dataset_handle,
        file_path,
    )


def normalize_match_dataframe(df):
    renamed = df.rename(columns={column: _normalize_column_name(column) for column in df.columns})
    renamed = _apply_optional_column_mapping(renamed)
    renamed = _apply_required_column_mapping(renamed)
    renamed = _extract_goals_from_score_columns(renamed)

    if REQUIRED_MATCH_COLUMNS.issubset(renamed.columns):
        return renamed

    available_columns = ", ".join(sorted(map(str, renamed.columns)))
    raise ValueError(
        "O dataset carregado nao possui as colunas obrigatorias para o modelo atual: "
        f"{sorted(REQUIRED_MATCH_COLUMNS)}. Colunas encontradas: {available_columns}"
    )


def create_features(df):
    df = df.copy()
    df["goal_diff"] = df["home_goals"] - df["away_goals"]
    df["total_goals"] = df["home_goals"] + df["away_goals"]
    df["goal_diff_abs"] = df["goal_diff"].abs()
    df["is_draw"] = (df["goal_diff"] == 0).astype(int)
    df["home_clean_sheet"] = (df["away_goals"] == 0).astype(int)
    df["away_clean_sheet"] = (df["home_goals"] == 0).astype(int)
    df["home_scored"] = (df["home_goals"] > 0).astype(int)
    df["away_scored"] = (df["away_goals"] > 0).astype(int)
    return df


def _normalize_column_name(column_name):
    normalized = str(column_name).strip().lower()
    normalized = (
        normalized.replace("-", "_")
        .replace(" ", "_")
        .replace("/", "_")
        .replace(".", "_")
        .replace("(", "")
        .replace(")", "")
    )
    normalized = "_".join(part for part in normalized.split("_") if part)

    if normalized in {_canonicalize_alias(alias) for alias in HOME_GOALS_ALIASES}:
        return "home_goals"
    if normalized in {_canonicalize_alias(alias) for alias in AWAY_GOALS_ALIASES}:
        return "away_goals"
    return normalized


def _canonicalize_alias(value):
    text = str(value).strip().lower()
    text = (
        text.replace("-", "_")
        .replace(" ", "_")
        .replace("/", "_")
        .replace(".", "_")
        .replace("(", "")
        .replace(")", "")
    )
    return "_".join(part for part in text.split("_") if part)


def _looks_like_home_goals(column_name):
    canonical = _canonicalize_alias(column_name)
    if canonical in {_canonicalize_alias(alias) for alias in HOME_GOALS_ALIASES}:
        return True
    return ("home" in canonical or "team1" in canonical or "team_a" in canonical) and (
        "goal" in canonical or "score" in canonical
    )


def _looks_like_away_goals(column_name):
    canonical = _canonicalize_alias(column_name)
    if canonical in {_canonicalize_alias(alias) for alias in AWAY_GOALS_ALIASES}:
        return True
    return ("away" in canonical or "team2" in canonical or "team_b" in canonical) and (
        "goal" in canonical or "score" in canonical
    )


def _apply_required_column_mapping(df):
    mapped = df.copy()

    if "home_goals" not in mapped.columns:
        home_candidate = next((column for column in mapped.columns if _looks_like_home_goals(column)), None)
        if home_candidate:
            mapped = mapped.rename(columns={home_candidate: "home_goals"})

    if "away_goals" not in mapped.columns:
        away_candidate = next((column for column in mapped.columns if _looks_like_away_goals(column)), None)
        if away_candidate:
            mapped = mapped.rename(columns={away_candidate: "away_goals"})

    return mapped


def _apply_optional_column_mapping(df):
    mapped = df.copy()
    for target_column, aliases in OPTIONAL_COLUMN_ALIASES.items():
        if target_column in mapped.columns:
            continue
        candidate = next(
            (
                column
                for column in mapped.columns
                if _canonicalize_alias(column) in {_canonicalize_alias(alias) for alias in aliases}
            ),
            None,
        )
        if candidate:
            mapped = mapped.rename(columns={candidate: target_column})
    return mapped


def _looks_like_score_text(column_name):
    canonical = _canonicalize_alias(column_name)
    if canonical in {_canonicalize_alias(alias) for alias in SCORE_TEXT_ALIASES}:
        return True
    return "score" in canonical or "result" in canonical or "placar" in canonical


def _parse_score_text(value):
    if value is None:
        return None
    text = str(value).strip().lower()
    if not text:
        return None

    match = re.search(r"(\d+)\s*[-:x]\s*(\d+)", text)
    if not match:
        return None

    return int(match.group(1)), int(match.group(2))


def _extract_goals_from_score_columns(df):
    mapped = df.copy()
    if REQUIRED_MATCH_COLUMNS.issubset(mapped.columns):
        return mapped

    score_candidate = next((column for column in mapped.columns if _looks_like_score_text(column)), None)
    if not score_candidate:
        return mapped

    parsed_scores = mapped[score_candidate].apply(_parse_score_text)
    valid_scores = parsed_scores.dropna()
    if valid_scores.empty:
        return mapped

    if "home_goals" not in mapped.columns:
        mapped["home_goals"] = parsed_scores.apply(lambda item: item[0] if item else None)

    if "away_goals" not in mapped.columns:
        mapped["away_goals"] = parsed_scores.apply(lambda item: item[1] if item else None)

    if "home_goals" in mapped.columns and "away_goals" in mapped.columns:
        mapped = mapped.dropna(subset=["home_goals", "away_goals"])
        mapped["home_goals"] = mapped["home_goals"].astype(int)
        mapped["away_goals"] = mapped["away_goals"].astype(int)

    return mapped
