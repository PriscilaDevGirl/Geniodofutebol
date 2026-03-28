import os

import requests

from src.env_loader import load_local_env

load_local_env()

BASE_URL = "https://api.b365api.com/v3"
FOOTBALL_SPORT_ID = 1


def _get_api_token():
    token = os.getenv("BETSAPI_TOKEN") or os.getenv("API_TOKEN")
    if not token:
        raise ValueError(
            "Defina BETSAPI_TOKEN ou API_TOKEN no ambiente para usar a BetsAPI."
        )
    return token


def _request(endpoint, params=None):
    request_params = {"token": _get_api_token(), **(params or {})}
    response = requests.get(f"{BASE_URL}/{endpoint}", params=request_params, timeout=30)
    response.raise_for_status()
    payload = response.json()
    return payload.get("results", payload)


def get_live_football_events():
    return _request(
        "events/inplay",
        {
            "sport_id": FOOTBALL_SPORT_ID,
            "skip_esports": 1,
        },
    )


def get_upcoming_football_events(day="today"):
    return _request(
        "events/upcoming",
        {
            "sport_id": FOOTBALL_SPORT_ID,
            "day": day,
            "skip_esports": 1,
        },
    )


def get_ended_football_events(page=1, day=None):
    params = {
        "sport_id": FOOTBALL_SPORT_ID,
        "page": page,
        "skip_esports": 1,
    }
    if day is not None:
        params["day"] = day

    return _request(
        "events/ended",
        params,
    )


def get_football_match_details(event_id):
    return _request(
        "event/view",
        {
            "event_id": event_id,
        },
    )


def get_football_odds(event_id, source="betfair"):
    source = source.lower()
    if source not in {"betfair", "prematch"}:
        raise ValueError("Use source='betfair' ou source='prematch'.")

    if source == "betfair":
        return _request(
            "betfair/event",
            {
                "event_id": event_id,
            },
        )

    return _request(
        "event/odds",
        {
            "event_id": event_id,
        },
    )


def get_football_lineup(event_id):
    return _request(
        "event/lineup",
        {
            "event_id": event_id,
        },
    )
