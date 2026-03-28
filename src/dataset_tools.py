from pathlib import Path

import pandas as pd

from src.features import create_features, normalize_match_dataframe

STANDARD_EXPORT_ORDER = [
    "match_date",
    "league_name",
    "home_team",
    "away_team",
    "home_goals",
    "away_goals",
    "goal_diff",
    "total_goals",
    "goal_diff_abs",
    "is_draw",
    "home_clean_sheet",
    "away_clean_sheet",
    "home_scored",
    "away_scored",
]


def _ordered_columns(df):
    preferred = [column for column in STANDARD_EXPORT_ORDER if column in df.columns]
    remainder = [column for column in df.columns if column not in preferred]
    return preferred + remainder


def validate_training_csv(input_path):
    path = Path(input_path)
    df = pd.read_csv(path)
    original_columns = list(df.columns)
    normalized = normalize_match_dataframe(df)
    featured = create_features(normalized)
    return {
        "path": str(path),
        "rows": int(len(featured)),
        "original_columns": original_columns,
        "normalized_columns": list(normalized.columns),
        "columns": _ordered_columns(featured),
    }


def convert_training_csv(input_path, output_path):
    input_file = Path(input_path)
    output_file = Path(output_path)

    df = pd.read_csv(input_file)
    original_columns = list(df.columns)
    normalized = normalize_match_dataframe(df)
    featured = create_features(normalized)
    featured = featured[_ordered_columns(featured)]

    output_file.parent.mkdir(parents=True, exist_ok=True)
    featured.to_csv(output_file, index=False)

    return {
        "input": str(input_file),
        "output": str(output_file),
        "rows": int(len(featured)),
        "original_columns": original_columns,
        "normalized_columns": list(normalized.columns),
        "columns": list(featured.columns),
    }


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(
        description="Valida ou converte CSVs de treino para o formato compativel com o NEURO-BIT."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate", help="Valida um CSV de treino")
    validate_parser.add_argument("input_path", help="Caminho do CSV de entrada")

    convert_parser = subparsers.add_parser("convert", help="Normaliza e exporta um CSV de treino")
    convert_parser.add_argument("input_path", help="Caminho do CSV de entrada")
    convert_parser.add_argument("output_path", help="Caminho do CSV de saida")

    args = parser.parse_args()

    if args.command == "validate":
        result = validate_training_csv(args.input_path)
    else:
        result = convert_training_csv(args.input_path, args.output_path)

    print(json.dumps(result, ensure_ascii=True, indent=2))
