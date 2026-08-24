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

    def headers(self, refresh=False):
        return {}

def test_cache_is_bounded():
    live_match._CACHE.clear()

    match = live_match.LiveMatch(FakeAuth())

    # Mock rank_info properly to return the keys it expects
    match.rank_info = lambda puuid, season, prev_season: {
        "ok": True, "tier": 10, "rr": 50, "peak": 12, "wr": 55, "games": 20,
        "lb": 0, "peak_season": "season1", "prev": 0
    }
    match.resolve_identity = lambda puuid, names, ident: ("TestPlayer", 100, False)
    match.level_from_history = lambda puuid: 100
    match.act_episode = lambda season: "Episode 1 Act 1"

    raw_players = [{"Subject": f"puuid-{i}", "PlayerIdentity": {}} for i in range(500)]

    match.game_state = lambda presences: "INGAME"
    match._current_players = lambda state: (
        raw_players,
        "fake_match_id",
        "fake_map",
        "competitive"
    )
    match._presences = lambda: []
    match.reveal_names = lambda puuids: {}
    match.season_id = lambda: "season1"
    match.prev_season_id = lambda: "season0"
    match.kd_hs = lambda puuid, count=5: (1.5, 25, 10, "ok", {})
    match.party_map = lambda raw, pres: {}
    match.match_score = lambda pres: None
    match.loadouts = lambda state, match_id: {}

    original_finalize = live_match.finalize
    live_match.finalize = lambda *args, **kwargs: {"state": "INGAME"}

    try:
        match.build_scoreboard(include_stats=False)

        cache_size = len(live_match._CACHE)
        assert cache_size <= 300, f"_CACHE grew unbounded to {cache_size} items"
    finally:
        live_match.finalize = original_finalize
