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


def test_scoreboard_cache_is_bounded(monkeypatch):
    live_match._CACHE.clear()
    live_match._MATCH_META.clear()

    match = live_match.LiveMatch(FakeAuth())

    match.rank_info = lambda puuid, season, prev_season: {
        "ok": True, "tier": 10, "rr": 50, "peak": 12, "wr": 55, "games": 20,
        "lb": 0, "peak_season": "season1", "prev": 0
    }
    match.resolve_identity = lambda puuid, names, ident: ("TestPlayer", 100, False)
    match.level_from_history = lambda puuid: 100
    match.act_episode = lambda season: "Episode 1 Act 1"

    raw_players = [
        {"Subject": f"puuid-{i}", "PlayerIdentity": {}}
        for i in range(live_match._CACHE_MAX + 1)
    ]

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

    monkeypatch.setattr(
        live_match,
        "finalize",
        lambda *args, **kwargs: {"state": "INGAME"},
    )

    try:
        match.build_scoreboard(include_stats=False)

        assert len(live_match._CACHE) == live_match._CACHE_MAX
        assert "fake_match_id:puuid-0" not in live_match._CACHE
        assert f"fake_match_id:puuid-{live_match._CACHE_MAX}" in live_match._CACHE
    finally:
        live_match._CACHE.clear()
        live_match._MATCH_META.clear()


def test_cache_put_lru_refresh():
    cache = {}
    cap = 3

    # Add three items (cache is now full: A, B, C)
    live_match._cache_put(cache, cap, "A", 1)
    live_match._cache_put(cache, cap, "B", 2)
    live_match._cache_put(cache, cap, "C", 3)

    assert list(cache.keys()) == ["A", "B", "C"]

    # Refresh "A" (should move to the end: B, C, A)
    live_match._cache_put(cache, cap, "A", 10)
    assert list(cache.keys()) == ["B", "C", "A"]

    # Add a new item "D". "B" is now the oldest and should be evicted.
    # Cache should be: C, A, D
    live_match._cache_put(cache, cap, "D", 4)
    assert list(cache.keys()) == ["C", "A", "D"]
