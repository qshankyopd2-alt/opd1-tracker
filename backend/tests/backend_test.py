"""Read-only regression tests for a locally running OPD1 backend.

Set OPD1_TEST_BASE_URL to override the default http://127.0.0.1:5000.
These tests never change settings, queue state, sessions, or instalock state.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest
import requests


BASE_URL = os.environ.get("OPD1_TEST_BASE_URL", "http://127.0.0.1:5000").rstrip("/")
API_TOKEN = os.environ.get("OPD1_TEST_API_TOKEN", "")
API = f"{BASE_URL}/api"
ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    if API_TOKEN:
        session.headers.update({"X-OPD1-Token": API_TOKEN})
    return session


def get_json(client: requests.Session, path: str, timeout: int = 30) -> dict:
    response = client.get(f"{API}{path}", timeout=timeout)
    assert response.status_code == 200, response.text[:500]
    data = response.json()
    assert isinstance(data, dict)
    return data


@pytest.fixture(scope="session")
def health(client: requests.Session) -> dict:
    return get_json(client, "/health")


@pytest.fixture(scope="session")
def performance(client: requests.Session) -> dict:
    return get_json(client, "/performance", timeout=60)


class TestHealthAndState:
    def test_health_contract(self, health: dict) -> None:
        assert health.get("ok") is True
        assert health.get("clientStatus") in {"ok", "not_running", "error"}
        assert isinstance(health.get("appVersion"), str) and health["appVersion"]

    def test_state_contract(self, client: requests.Session) -> None:
        state = get_json(client, "/state")
        assert state.get("state") in {"MENUS", "PREGAME", "INGAME", "UNKNOWN"}


class TestLiveData:
    def test_live_board_contract(self, client: requests.Session, health: dict) -> None:
        board = get_json(client, "/live", timeout=60)
        assert board.get("state") in {"MENUS", "PREGAME", "INGAME", "UNKNOWN"}
        assert isinstance(board.get("players", []), list)
        if health.get("clientStatus") == "ok" and health.get("dataSourcePreference") != "demo":
            assert board.get("source") == "local"
        if board.get("state") == "INGAME":
            assert len(board.get("players", [])) == 10
        if board.get("state") == "PREGAME":
            assert 1 <= len(board.get("players", [])) <= 5

        for player in board.get("players", []):
            assert player.get("puuid")
            assert isinstance(player.get("games"), int)
            assert player.get("games") >= 0
            assert isinstance(player.get("weapons", []), list)
            assert "rankTier" in player


class TestHistoryAndProfiles:
    def test_performance_contract(self, performance: dict) -> None:
        assert isinstance(performance.get("points"), list)
        assert isinstance(performance.get("summary"), dict)
        assert isinstance(performance.get("splits"), dict)
        assert isinstance(performance.get("enrichment"), dict)

    def test_profile_is_limited_to_eight_matches(
        self, client: requests.Session, performance: dict, health: dict
    ) -> None:
        puuid = (performance.get("account") or {}).get("puuid")
        if (not puuid or health.get("clientStatus") != "ok"
                or health.get("dataSourcePreference") == "demo"):
            pytest.skip("No live account is available")
        profile = get_json(client, f"/profile/{puuid}", timeout=90)
        assert profile.get("source") == "local"
        matches = profile.get("matches") or []
        assert 0 < len(matches) <= 8
        assert profile.get("averages", {}).get("games") == len(matches)
        for match in matches:
            assert match.get("matchId")
            assert match.get("result") in {"Victory", "Defeat", "Draw"}
            assert isinstance(match.get("kills"), int)
            assert isinstance(match.get("deaths"), int)
            assert isinstance(match.get("assists"), int)

    def test_latest_match_detail_matches_history(
        self, client: requests.Session, performance: dict, health: dict
    ) -> None:
        puuid = (performance.get("account") or {}).get("puuid")
        points = sorted(performance.get("points") or [], key=lambda point: point.get("ts") or 0, reverse=True)
        rich = next((point for point in points if point.get("kills") is not None), None)
        if (not puuid or not rich or health.get("clientStatus") != "ok"
                or health.get("dataSourcePreference") == "demo"):
            pytest.skip("No enriched live match is available")

        detail = get_json(client, f"/match/{rich['matchId']}?subject={puuid}", timeout=90)
        subject = next((player for player in detail.get("players", []) if player.get("isSubject")), None)
        assert subject is not None
        assert detail.get("matchId") == rich["matchId"]
        assert detail.get("map") == rich.get("map")
        for key in ("kills", "deaths", "assists", "acs", "hsPct"):
            assert subject.get(key) == rich.get(key), f"{key} differs between history and match detail"


class TestReadOnlyEndpoints:
    def test_encounters_contract(self, client: requests.Session) -> None:
        payload = get_json(client, "/encounters?scope=current", timeout=60)
        players = payload.get("players") or []
        assert len({player.get("puuid") for player in players}) == len(players)
        for player in players:
            total = int(player.get("withCount") or 0) + int(player.get("againstCount") or 0)
            completed = sum(int(player.get(key) or 0) for key in (
                "winsWith", "lossesWith", "winsAgainst", "lossesAgainst"
            ))
            assert total >= 0
            assert completed <= total

    def test_settings_and_region_are_readable(self, client: requests.Session) -> None:
        settings = get_json(client, "/settings")
        region = get_json(client, "/region")
        assert isinstance(settings, dict)
        assert isinstance(region.get("regions"), list)
        assert "detected" in region

    def test_agents_contract(self, client: requests.Session) -> None:
        payload = get_json(client, "/agents")
        agents = payload.get("agents")
        assert isinstance(agents, list) and len(agents) >= 20
        assert all(agent.get("name") and agent.get("uuid") for agent in agents)

    def test_inventory_contract(self, client: requests.Session) -> None:
        inventory = get_json(client, "/inventory", timeout=60)
        assert isinstance(inventory.get("available"), bool)


def test_tauri_uses_local_npm_window() -> None:
    config_path = ROOT / "frontend" / "src-tauri" / "tauri.conf.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    build = config["build"]
    windows = config["app"]["windows"]
    assert build["beforeDevCommand"] == "npm run dev"
    assert build["beforeBuildCommand"] == "npm run build"
    assert build["devUrl"] == "http://127.0.0.1:3000"
    assert len(windows) == 1
    assert windows[0]["title"] == "OPD1 Tracker"
