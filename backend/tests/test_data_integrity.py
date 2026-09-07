import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import live_match
import match_meta
import valapi


def test_outcomes_require_complete_team_results():
    for blue, red, expected in [(True, False, "Victory"), (False, True, "Defeat"),
                                (False, False, "Draw"), (None, False, None)]:
        assert live_match.match_result({"Blue": {"won": blue}, "Red": {"won": red}}, "Blue") == expected
    assert live_match.match_result({"Blue": {"won": False}}, "Blue") is None
    assert live_match.form_streak(["D", "W", "W"]) is None


def test_failed_note_write_preserves_previous_value(monkeypatch):
    original = {"note": "Keep me", "tags": [], "bookmarked": True}
    monkeypatch.setattr(match_meta, "_STORE", {"accounts": {"owner": {"match": original}}})
    monkeypatch.setattr(match_meta, "_save", lambda: False)
    assert not match_meta.update("owner", "match", {"note": "Replacement"})["ok"]
    assert match_meta.get_one("owner", "match") == original
    assert not match_meta.update("other", "match", {"note": "New"})["ok"]
    assert match_meta.get_all("other") == {}


def test_unknown_skin_is_not_standard(monkeypatch):
    monkeypatch.setattr(valapi, "weapon_name", lambda _: "Vandal")
    assert valapi.loadout_weapons({"weapon": {}}) == [{"weapon": "Vandal", "skin": None}]


def test_malformed_metadata_is_rejected():
    for body in [[], {"tags": 4}, {"tags": [None]}, {"note": {}}, {"bookmarked": "false"}]:
        assert match_meta.update("owner", "match", body)["ok"] is False


def test_inferred_rr_outcomes_are_not_exposed_or_counted(monkeypatch):
    import history
    point = {"matchId": "pending", "ts": 1, "delta": 20, "tier": 10,
             "rr": 40, "result": "Victory", "resultExact": False}
    monkeypatch.setattr(history, "_STORE", {"accounts": {"owner": {"points": [point]}}})
    monkeypatch.setattr(history, "_save", lambda: None)
    result = history.payload("owner", "UTC")
    assert result["points"][0]["result"] is None
    assert result["summary"]["wins"] == 0
    assert point["result"] == "Victory"
