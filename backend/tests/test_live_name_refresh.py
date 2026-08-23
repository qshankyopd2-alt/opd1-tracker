from __future__ import annotations

import sys
from pathlib import Path


BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

import live_match


class FakeAuth:
    puuid = "self-puuid"
    req_count = 0

    def headers(self):
        return {}


class NameRefreshMatch(live_match.LiveMatch):
    def __init__(self):
        super().__init__(FakeAuth())
        self.name_calls = 0

    def _presences(self):
        return []

    def game_state(self, _presences):
        return "INGAME"

    def _current_players(self, _state):
        identity = {"Incognito": False, "AccountLevel": 100}
        return ([
            {"Subject": self.self_puuid, "TeamID": "Blue", "CharacterID": "", "PlayerIdentity": identity},
            {"Subject": "enemy-puuid", "TeamID": "Red", "CharacterID": "", "PlayerIdentity": identity},
        ], "name-refresh-match", "", "competitive")

    def reveal_names(self, _puuids):
        self.name_calls += 1
        return {} if self.name_calls == 1 else {"enemy-puuid": "VisibleEnemy#TAG"}

    def loadouts(self, _state, _match_id):
        return {}

    def party_map(self, _puuids, _presences):
        return {}

    def season_id(self):
        return None

    def prev_season_id(self):
        return None

    def rank_info(self, _puuid, season, _prev_season=None):
        return {
            "tier": 0, "rr": 0, "lb": 0, "peak": 0, "wr": 0,
            "games": 0, "prev": 0, "peak_season": season, "ok": True,
        }

    def level_from_history(self, _puuid):
        return 0

    def match_score(self, _presences):
        return None


def test_visible_name_replaces_fallback_after_name_service_recovers():
    live_match._MATCH_META.clear()
    match = NameRefreshMatch()

    first = match.build_scoreboard(include_stats=False)
    second = match.build_scoreboard(include_stats=False)

    first_enemy = next(player for player in first["players"] if player["puuid"] == "enemy-puuid")
    second_enemy = next(player for player in second["players"] if player["puuid"] == "enemy-puuid")
    assert first_enemy["name"].startswith("Player ")
    assert second_enemy["name"] == "VisibleEnemy#TAG"
    assert match.name_calls == 2
