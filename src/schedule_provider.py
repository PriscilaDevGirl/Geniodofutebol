from src.providers.betsapi_provider import BetsApiScheduleProvider
from src.providers.fallback_provider import FallbackBrasileiraoProvider
from src.team_resolver import get_team_aliases


SCHEDULE_PROVIDERS = [
    BetsApiScheduleProvider(),
    FallbackBrasileiraoProvider(),
]


def resolve_live_event_id_by_team(team_name):
    aliases = get_team_aliases(team_name)

    for provider in SCHEDULE_PROVIDERS:
        try:
            event_id = provider.find_live_event_id(aliases)
            if event_id:
                return event_id
        except Exception:
            continue

    return None


def find_team_event_context(team_name):
    aliases = get_team_aliases(team_name)

    for provider in SCHEDULE_PROVIDERS:
        try:
            context = provider.find_team_event_context(aliases)
            if context:
                return context
        except Exception:
            continue

    return None


def find_matchup_event_context(team_a, team_b):
    aliases_a = get_team_aliases(team_a)
    aliases_b = get_team_aliases(team_b)

    for provider in SCHEDULE_PROVIDERS:
        try:
            context = provider.find_matchup_event_context(aliases_a, aliases_b)
            if context:
                return context
        except Exception:
            continue

    return None
