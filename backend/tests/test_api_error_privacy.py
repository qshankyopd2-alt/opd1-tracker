from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import Mock

BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


def test_api_failures_hide_internal_details(monkeypatch, tmp_path):
    import app as api
    import live_match

    secret = "private-path-and-token-sentinel"
    failure = Mock(side_effect=RuntimeError(secret))
    monkeypatch.delenv("OPD1_API_TOKEN", raising=False)
    monkeypatch.setattr(api, "_SETTINGS_PATH", str(tmp_path / "settings.json"))
    monkeypatch.setattr(api, "_save_settings", failure)
    monkeypatch.setattr(api, "_live_enabled", lambda: True)
    monkeypatch.setattr(api, "LocalAuth", Mock())
    monkeypatch.setattr(api, "_LAST_GOOD", {"board": None, "at": 0, "notReady": False})
    monkeypatch.setattr(api, "_CACHE", {})
    monkeypatch.setattr(api, "build_player_payload", failure)
    monkeypatch.setattr(api.client, "party_state", lambda: {"available": False, "message": secret})
    monkeypatch.setattr(live_match, "LiveMatch", failure)
    client = api.app.test_client()

    responses = [
        (client.post("/api/settings", json={"autoRefresh": True}), 200, "message"),
        (client.get("/api/live"), 200, "error"),
        (client.get("/api/state"), 200, "error"),
        (client.get("/api/debug/reveal"), 500, "error"),
        (client.get("/api/player/test-player"), 500, "error"),
        (client.get("/api/queue"), 200, "message"),
    ]
    for response, status, key in responses:
        assert response.status_code == status
        assert response.get_json()[key]
        assert secret not in response.get_data(as_text=True)
    assert responses[0][0].get_json()["ok"] is False
    for response, _, _ in responses[1:3]:
        assert response.get_json()["state"] == "OFFLINE"
        assert response.get_json()["source"] == "local"

    snapshot = {"available": True, "queueId": "competitive", "members": []}
    monkeypatch.setattr(api.client, "party_state", lambda: snapshot)
    assert client.get("/api/queue").get_json() == snapshot


def test_reveal_diagnostic_hides_nested_failure(monkeypatch):
    import live_match

    secret = "private-history-exception-sentinel"
    match = object.__new__(live_match.LiveMatch)
    match.self_puuid = "self"
    match.auth = Mock()
    match.auth.pd_get.side_effect = RuntimeError(secret)
    monkeypatch.setattr(match, "_presences", lambda: [])
    monkeypatch.setattr(match, "game_state", lambda _: "INGAME")
    monkeypatch.setattr(match, "_current_players", lambda _: (
        [{"Subject": "other", "PlayerIdentity": {"Incognito": True}}], None, None, None))
    monkeypatch.setattr(match, "reveal_names", lambda _: {})
    result = match.diagnose_reveal()
    assert result["report"][0]["error"] == "Failed to read match history details."
    assert secret not in str(result)
    assert match.auth.pd_get.call_count == 1
