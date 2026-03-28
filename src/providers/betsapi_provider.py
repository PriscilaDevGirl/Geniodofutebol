from src.api import (
    get_ended_football_events,
    get_live_football_events,
    get_upcoming_football_events,
)
from src.team_resolver import text_contains_team_alias


class BetsApiScheduleProvider:
    name = "betsapi"

    def _match_event_to_team(self, event, aliases):
        home_name = str(event.get("home", {}).get("name", "")).lower()
        away_name = str(event.get("away", {}).get("name", "")).lower()

        for alias in aliases:
            if text_contains_team_alias(home_name, alias) or text_contains_team_alias(away_name, alias):
                return True
        return False

    def find_live_event_id(self, aliases):
        live_events = get_live_football_events()
        for event in live_events:
            if self._match_event_to_team(event, aliases):
                return event.get("id") or event.get("event_id")
        return None

    def find_matchup_event_context(self, aliases_a, aliases_b):
        live_events = get_live_football_events()

        for event in live_events:
            if self._match_event_to_team(event, aliases_a) and self._match_event_to_team(event, aliases_b):
                return {
                    "status": "live",
                    "event_id": event.get("id") or event.get("event_id"),
                    "event": event,
                    "provider": self.name,
                }

        upcoming_events = get_upcoming_football_events(day="today")
        for event in upcoming_events:
            if self._match_event_to_team(event, aliases_a) and self._match_event_to_team(event, aliases_b):
                return {
                    "status": "upcoming",
                    "event_id": event.get("id") or event.get("event_id"),
                    "event": event,
                    "provider": self.name,
                }

        ended_events = get_ended_football_events(page=1)
        for event in ended_events:
            if self._match_event_to_team(event, aliases_a) and self._match_event_to_team(event, aliases_b):
                return {
                    "status": "ended",
                    "event_id": event.get("id") or event.get("event_id"),
                    "event": event,
                    "provider": self.name,
                }

        return None

    def find_team_event_context(self, aliases):
        live_events = get_live_football_events()
        for event in live_events:
            if self._match_event_to_team(event, aliases):
                return {
                    "status": "live",
                    "event_id": event.get("id") or event.get("event_id"),
                    "event": event,
                    "provider": self.name,
                }

        upcoming_events = get_upcoming_football_events(day="today")
        for event in upcoming_events:
            if self._match_event_to_team(event, aliases):
                return {
                    "status": "upcoming",
                    "event_id": event.get("id") or event.get("event_id"),
                    "event": event,
                    "provider": self.name,
                }

        ended_events = get_ended_football_events(page=1)
        for event in ended_events:
            if self._match_event_to_team(event, aliases):
                return {
                    "status": "ended",
                    "event_id": event.get("id") or event.get("event_id"),
                    "event": event,
                    "provider": self.name,
                }

        return None
