import re
import unicodedata


BRASILEIRAO_TEAM_ALIASES = {
    "athletico paranaense": [
        "athletico paranaense",
        "athletico",
        "athletico-pr",
        "athletico pr",
        "cap",
        "furacao",
    ],
    "atletico mineiro": ["atletico mineiro", "atletico-mg", "atletico mg", "galo"],
    "bahia": ["bahia", "esquadrao", "esquadrao de aco"],
    "botafogo": ["botafogo", "fogao"],
    "bragantino": ["bragantino", "rb bragantino", "red bull bragantino", "massa bruta"],
    "chapecoense": ["chapecoense", "chape", "chapecoense-sc"],
    "corinthians": ["corinthians", "timao", "coringao"],
    "coritiba": ["coritiba", "coritiba saf", "cox", "coxa", "coxa branca"],
    "cruzeiro": ["cruzeiro", "raposa"],
    "flamengo": ["flamengo", "mengao"],
    "fluminense": ["fluminense", "tricolor das laranjeiras"],
    "gremio": ["gremio", "imortal"],
    "internacional": ["internacional", "inter", "colorado"],
    "mirassol": ["mirassol"],
    "palmeiras": ["palmeiras", "verdao", "porco"],
    "remo": ["remo", "leao azul"],
    "santos": ["santos", "santos fc", "peixe"],
    "sao paulo": ["sao paulo", "tricolor paulista"],
    "vasco": ["vasco", "vasco da gama", "vasco da gama saf", "gigante da colina"],
    "vitoria": ["vitoria", "leao da barra"],
}


TEAM_DISPLAY_NAMES = {
    "athletico paranaense": "Athletico Paranaense",
    "atletico mineiro": "Atletico Mineiro",
    "bahia": "Bahia",
    "botafogo": "Botafogo",
    "bragantino": "Bragantino",
    "chapecoense": "Chapecoense",
    "corinthians": "Corinthians",
    "coritiba": "Coritiba",
    "cruzeiro": "Cruzeiro",
    "flamengo": "Flamengo",
    "fluminense": "Fluminense",
    "gremio": "Gremio",
    "internacional": "Internacional",
    "mirassol": "Mirassol",
    "palmeiras": "Palmeiras",
    "remo": "Remo",
    "santos": "Santos",
    "sao paulo": "Sao Paulo",
    "vasco": "Vasco",
    "vitoria": "Vitoria",
}


def _normalize_lookup_text(value):
    normalized = unicodedata.normalize("NFKD", (value or "").lower())
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def text_contains_team_alias(text, alias):
    normalized_text = f" {_normalize_lookup_text(text)} "
    normalized_alias = _normalize_lookup_text(alias)
    if not normalized_alias:
        return False
    return f" {normalized_alias} " in normalized_text


def find_brasileirao_team_in_message(message):
    normalized_message = message or ""
    for canonical_name, aliases in BRASILEIRAO_TEAM_ALIASES.items():
        for alias in aliases:
            if text_contains_team_alias(normalized_message, alias):
                return canonical_name
    return None


def find_brasileirao_teams_in_message(message):
    normalized_message = message or ""
    matches = []

    for canonical_name, aliases in BRASILEIRAO_TEAM_ALIASES.items():
        for alias in aliases:
            if text_contains_team_alias(normalized_message, alias):
                matches.append(canonical_name)
                break

    unique_matches = []
    for team_name in matches:
        if team_name not in unique_matches:
            unique_matches.append(team_name)

    return unique_matches


def get_team_aliases(team_name):
    return BRASILEIRAO_TEAM_ALIASES.get(team_name, [team_name])


def get_team_display_name(team_name):
    return TEAM_DISPLAY_NAMES.get(team_name, team_name.title())


def resolve_brasileirao_team_key_from_name(team_name):
    raw_name = team_name or ""
    for canonical_name, aliases in BRASILEIRAO_TEAM_ALIASES.items():
        for alias in aliases:
            if text_contains_team_alias(raw_name, alias):
                return canonical_name
    return None
