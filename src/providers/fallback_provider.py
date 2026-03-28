from src.team_resolver import get_team_display_name


class FallbackBrasileiraoProvider:
    name = "fallback_brasileirao"

    def find_live_event_id(self, aliases):
        return None

    def find_team_event_context(self, aliases):
        canonical_name = aliases[0] if aliases else "time"
        return {
            "status": "known_team",
            "event_id": None,
            "event": {
                "home": {"name": get_team_display_name(canonical_name)},
                "away": {"name": ""},
                "ss": None,
            },
            "provider": self.name,
        }

    def find_matchup_event_context(self, aliases_a, aliases_b):
        team_a = aliases_a[0] if aliases_a else "time A"
        team_b = aliases_b[0] if aliases_b else "time B"
        return {
            "status": "known_matchup",
            "event_id": None,
            "event": {
                "home": {"name": get_team_display_name(team_a)},
                "away": {"name": get_team_display_name(team_b)},
                "ss": None,
            },
            "provider": self.name,
        }
