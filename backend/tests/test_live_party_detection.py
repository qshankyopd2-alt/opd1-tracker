from __future__ import annotations

import base64
import json
import sys
from pathlib import Path


BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

import live_match


class FakeAuth:
    puuid = "a"
    req_count = 0

    def headers(self):
        return {}


def encoded(payload: dict) -> str:
    return base64.b64encode(json.dumps(payload).encode()).decode().rstrip("=")


def player(puuid: str, team: str) -> dict:
    return {"Subject": puuid, "TeamID": team}


def presence(puuid: str, private, product: str = "valorant") -> dict:
    return {"puuid": puuid, "product": product, "private": private}


def test_party_map_deduplicates_and_uses_flat_fallback():
    match = live_match.LiveMatch(FakeAuth())
    players = [
        player("a", "Blue"), player("b", "Blue"), player("c", "Blue"),
        player("d", "Red"), player("e", "Red"),
    ]
    blue = {"isValid": True, "partyPresenceData": {"partyId": "BLUE", "partySize": 3}}
    blue_flat = {
        "isValid": True,
        "partyId": "BLUE",
        "partySize": "3",
        "partyPresenceData": None,
    }
    red = {"isValid": True, "partyPresenceData": {"partyId": "BLUE", "partySize": 2}}
    solo = {"isValid": True, "partyPresenceData": {"partyId": "solo", "partySize": 1}}
    presences = [
        presence("a", encoded(blue)),
        presence("A", blue),
        presence("b", json.dumps(blue_flat)),
        presence("c", encoded(solo)),
        presence("d", encoded(red)),
        presence("e", encoded(red)),
        presence("a", encoded(blue), product="league_of_legends"),
    ]

    parties = match.party_map(players, presences)

    assert set(parties) == {"Blue:blue", "Red:blue"}
    assert parties["Blue:blue"]["members"] == ["a", "b"]
    assert parties["Blue:blue"]["declaredSize"] == 3
    assert parties["Red:blue"]["members"] == ["d", "e"]
    assert match._party_detection["status"] == "complete"
    assert match._party_detection["decodedPlayers"] == 5
    assert match._party_detection["partyDataPlayers"] == 5


def test_party_map_reports_incomplete_coverage_without_inventing_group():
    match = live_match.LiveMatch(FakeAuth())
    players = [player("a", "Blue"), player("b", "Blue")]
    partial = {"isValid": True, "partyPresenceData": {"partyId": "duo", "partySize": 2}}

    parties = match.party_map(players, [presence("a", encoded(partial))])

    assert parties == {}
    assert match._party_detection["status"] == "partial"
    assert match._party_detection["teams"]["Blue"] == {
        "status": "partial",
        "expectedPlayers": 2,
        "presencePlayers": 1,
        "decodedPlayers": 1,
        "partyDataPlayers": 1,
    }


def test_conflicting_duplicate_presence_is_not_trusted():
    match = live_match.LiveMatch(FakeAuth())
    players = [player("a", "Blue"), player("b", "Blue")]
    first = {"isValid": True, "partyPresenceData": {"partyId": "one", "partySize": 2}}
    stale = {"isValid": True, "partyPresenceData": {"partyId": "two", "partySize": 2}}

    parties = match.party_map(players, [
        presence("a", encoded(first)),
        presence("a", encoded(stale)),
        presence("b", encoded(first)),
    ])

    assert parties == {}


def test_decoded_presence_without_party_fields_is_not_marked_complete():
    match = live_match.LiveMatch(FakeAuth())
    players = [player("a", "Blue"), player("b", "Blue")]
    private = {"isValid": True, "matchPresenceData": {"sessionLoopState": "INGAME"}}

    parties = match.party_map(players, [
        presence("a", encoded(private)),
        presence("b", encoded(private)),
    ])

    assert parties == {}
    assert match._party_detection["decodedPlayers"] == 2
    assert match._party_detection["partyDataPlayers"] == 0
    assert match._party_detection["status"] == "unavailable"
