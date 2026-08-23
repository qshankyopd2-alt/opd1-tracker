from __future__ import annotations

import importlib
import sys
from pathlib import Path

import pytest


BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


@pytest.fixture()
def encounters(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("OPD1_DATA_DIR", str(tmp_path))
    import runtime_paths
    import encounter_log

    importlib.reload(runtime_paths)
    return importlib.reload(encounter_log)


def board(owner: str = "owner", target: str = "target", match_id: str = "match-1") -> dict:
    return {
        "source": "local",
        "state": "INGAME",
        "selfPuuid": owner,
        "selfTeam": "Blue",
        "matchId": match_id,
        "map": "Ascent",
        "players": [
            {"puuid": owner, "name": "Me#ONE", "team": "Blue", "isSelf": True},
            {"puuid": target, "name": "Player#TAG", "team": "Red", "isSelf": False,
             "agent": "Sova", "rank": "Gold 2"},
        ],
    }


def test_save_note_persists_and_keeps_encounter_history(encounters):
    encounters.record_board(board())
    result = encounters.update_saved("owner", "target", {
        "saved": True,
        "note": "Queues with Sage",
    })
    assert result["ok"] is True
    encounters.record_result(board(), won=True)

    reloaded = importlib.reload(encounters)
    saved = reloaded.get_saved("owner")
    assert saved[0]["note"] == "Queues with Sage"
    assert saved[0]["againstCount"] == 1
    assert saved[0]["winsAgainst"] == 1
    assert saved[0]["timeline"][0]["matchId"] == "match-1"
    assert saved[0]["timeline"][0]["map"] == "Ascent"
    assert saved[0]["timeline"][0]["result"] == "win"


def test_remove_bookmark_does_not_remove_encounter(encounters):
    encounters.record_board(board())
    assert encounters.update_saved("owner", "target", {"saved": True, "note": "Watch"})["ok"]
    assert encounters.update_saved("owner", "target", {"saved": False, "note": ""})["ok"]
    assert encounters.get_saved("owner") == []
    assert encounters.get_one("owner", "target")["againstCount"] == 1


def test_notes_are_scoped_to_the_active_account(encounters):
    encounters.record_board(board(owner="one"))
    encounters.update_saved("one", "target", {"saved": True, "note": "First note"})
    encounters.record_board(board(owner="two", match_id="match-2"))
    encounters.update_saved("two", "target", {"saved": True, "note": "Second note"})
    assert encounters.get_saved("one")[0]["note"] == "First note"
    assert encounters.get_saved("two")[0]["note"] == "Second note"
    assert encounters.last_owner() == "two"


def test_unknown_player_and_oversized_note_are_rejected(encounters):
    encounters.record_board(board())
    unknown = encounters.update_saved("owner", "unknown", {"saved": True, "note": ""})
    oversized = encounters.update_saved("owner", "target", {"saved": True, "note": "x" * 501})
    assert unknown["code"] == "unknown_player"
    assert oversized["code"] == "invalid_note"


def test_saved_routes_do_not_request_riot_data(encounters, monkeypatch: pytest.MonkeyPatch):
    encounters.record_board(board())
    import app as app_module

    monkeypatch.setattr(app_module, "_current_puuid",
                        lambda: (_ for _ in ()).throw(AssertionError("Riot lookup called")))
    monkeypatch.setattr(app_module, "_refresh_encounter_history",
                        lambda _owner: (_ for _ in ()).throw(AssertionError("Riot backfill called")))
    monkeypatch.setenv("OPD1_API_TOKEN", "test-token")
    client = app_module.app.test_client()

    assert client.get("/api/saved-players").status_code == 401
    headers = {"X-OPD1-Token": "test-token"}
    assert client.get("/api/saved-players", headers=headers).status_code == 200
    response = client.put("/api/saved-players/target", headers=headers, json={
        "accountPuuid": "owner", "saved": True, "note": "Known player",
    })
    assert response.status_code == 200
    assert response.get_json()["player"]["note"] == "Known player"


def test_lobby_is_not_counted_as_an_encounter(encounters):
    lobby = board(match_id="lobby")
    lobby["state"] = "MENUS"
    encounters.record_board(lobby)
    assert encounters.get_all("owner") == []
    assert encounters.last_owner() == "owner"


def test_malformed_store_is_backed_up_before_new_data(encounters):
    path = Path(encounters._PATH)
    path.write_text("not-json", encoding="utf-8")
    reloaded = importlib.reload(encounters)
    reloaded.record_board(board())
    assert reloaded.get_one("owner", "target") is not None
    assert list(path.parent.glob("encounters.json.backup-*"))
