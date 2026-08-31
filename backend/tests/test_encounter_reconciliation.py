from __future__ import annotations

import importlib
import json
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


def live_board(match_id: str = "match-pending") -> dict:
    return {
        "source": "local",
        "state": "INGAME",
        "selfPuuid": "owner",
        "selfTeam": "Blue",
        "matchId": match_id,
        "map": "Ascent",
        "players": [
            {"puuid": "owner", "name": "Me#ONE", "team": "Blue", "isSelf": True},
            {"puuid": "ally", "name": "Ally#ONE", "team": "Blue", "isSelf": False, "agent": "Sage"},
            {"puuid": "enemy", "name": "Enemy#ONE", "team": "Red", "isSelf": False, "agent": "Sova"},
        ],
    }


def test_record_board_persists_one_pending_match_with_all_participants(encounters):
    # Defect caught: a restart currently loses the only in-memory retry path because
    # encounters.json stores null timeline rows but no durable match-level work item.
    encounters.record_board(live_board())
    encounters.record_board(live_board())

    stored = json.loads(Path(encounters._PATH).read_text(encoding="utf-8"))
    assert stored["version"] == 3
    pending = stored["accounts"]["owner"]["pendingMatches"]
    assert list(pending) == ["match-pending"]
    assert pending["match-pending"]["map"] == "Ascent"
    assert pending["match-pending"]["participants"] == {
        "ally": {"side": "with", "agent": "Sage"},
        "enemy": {"side": "against", "agent": "Sova"},
    }
    assert encounters.get_one("owner", "ally")["withCount"] == 1
    assert encounters.get_one("owner", "enemy")["againstCount"] == 1


def test_resolving_pending_result_updates_each_side_once(encounters):
    # Defect caught: retrying a finished match could double-increment W/L unless
    # the persisted match ID and every participant share one idempotent resolver.
    encounters.record_board(live_board())

    resolve_pending = getattr(encounters, "resolve_pending", None)
    assert callable(resolve_pending), "pending outcome resolver is missing"
    assert resolve_pending("owner", "match-pending", "win") is True
    assert resolve_pending("owner", "match-pending", "win") is False

    ally = encounters.get_one("owner", "ally")
    enemy = encounters.get_one("owner", "enemy")
    assert (ally["winsWith"], ally["lossesWith"], ally["drawsWith"]) == (1, 0, 0)
    assert (enemy["winsAgainst"], enemy["lossesAgainst"], enemy["drawsAgainst"]) == (1, 0, 0)
    assert ally["timeline"][0]["result"] == "win"
    assert enemy["timeline"][0]["result"] == "win"
    assert encounters.pending_due("owner", now=10_000, force=True) == []


def test_draw_is_terminal_and_not_reported_as_unavailable(encounters):
    # Defect caught: a final Draw previously stayed indistinguishable from a
    # missing result and would be retried forever.
    encounters.record_board(live_board())

    resolve_pending = getattr(encounters, "resolve_pending", None)
    assert callable(resolve_pending), "draw-aware pending resolver is missing"
    assert resolve_pending("owner", "match-pending", "draw") is True

    ally = encounters.encounter_for("owner", "ally")
    enemy = encounters.encounter_for("owner", "enemy")
    assert ally == {
        "withCount": 1,
        "againstCount": 0,
        "winsWith": 0,
        "lossesWith": 0,
        "drawsWith": 1,
        "winsAgainst": 0,
        "lossesAgainst": 0,
        "drawsAgainst": 0,
        "pendingWith": 0,
        "pendingAgainst": 0,
    }
    assert enemy["drawsAgainst"] == 1
    assert enemy["pendingAgainst"] == 0
    assert encounters.get_one("owner", "ally")["timeline"][0]["result"] == "draw"


def test_failed_attempt_uses_persistent_backoff(encounters):
    # Defect caught: an unavailable Match Details response could be retried on
    # every polling tick instead of respecting the requested progressive delay.
    encounters.record_board(live_board())
    pending_due = getattr(encounters, "pending_due", None)
    mark_attempt = getattr(encounters, "mark_pending_attempt", None)
    assert callable(pending_due), "durable pending queue reader is missing"
    assert callable(mark_attempt), "durable retry scheduler is missing"
    first = pending_due("owner", now=100, force=True)[0]
    assert first["matchId"] == "match-pending"

    expected_delays = [60, 300, 900, 3600, 21600, 21600]
    now = 1_000
    for attempt, delay in enumerate(expected_delays, start=1):
        mark_attempt("owner", "match-pending", "not_ready", now=now)
        stored = pending_due("owner", now=now, force=True)[0]
        assert stored["attempts"] == attempt
        assert stored["nextAttemptAt"] == now + delay
        assert pending_due("owner", now=now + delay - 1) == []
        assert pending_due("owner", now=now + delay)[0]["matchId"] == "match-pending"
        now += delay


def test_v2_store_migrates_null_results_into_pending_matches(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    # Defect caught: unresolved v2 timeline rows would never enter the new retry
    # queue after an upgrade, so restart reconciliation would miss existing data.
    monkeypatch.setenv("OPD1_DATA_DIR", str(tmp_path))
    raw = {
        "version": 2,
        "accounts": {
            "owner": {
                "savedPlayers": {"ally": {"note": "keep me"}},
                "players": {
                    "ally": {
                        "puuid": "ally",
                        "withCount": 1,
                        "againstCount": 0,
                        "winsWith": 0,
                        "lossesWith": 0,
                        "winsAgainst": 0,
                        "lossesAgainst": 0,
                        "matchIds": ["legacy-pending"],
                        "resultMatchIds": [],
                        "timeline": [{"matchId": "legacy-pending", "at": 123, "side": "with", "result": None, "agent": "Sage", "map": "Bind"}],
                    }
                },
            }
        },
        "lastOwner": "owner",
        "discardedLegacyPlayers": 0,
    }
    path = tmp_path / "encounters.json"
    path.write_text(json.dumps(raw), encoding="utf-8")

    import runtime_paths
    import encounter_log

    importlib.reload(runtime_paths)
    migrated = importlib.reload(encounter_log)

    pending_due = getattr(migrated, "pending_due", None)
    assert callable(pending_due), "v2 pending migration reader is missing"
    pending = pending_due("owner", now=1_000, force=True)
    assert pending[0]["matchId"] == "legacy-pending"
    assert pending[0]["participants"] == {"ally": {"side": "with", "agent": "Sage"}}
    persisted = json.loads(path.read_text(encoding="utf-8"))
    assert persisted["version"] == 3
    assert persisted["accounts"]["owner"]["savedPlayers"]["ally"]["note"] == "keep me"


class FakeAuth:
    puuid = "owner"

    def __init__(self, payload: dict):
        self.payload = payload
        self.calls: list[tuple[str, int]] = []

    def headers(self):
        return {}

    def pd_get(self, endpoint: str, retries: int = 0):
        self.calls.append((endpoint, retries))
        return self.payload


@pytest.mark.parametrize(("won_blue", "won_red", "expected"), [
    (True, False, "win"),
    (False, True, "loss"),
    (False, False, "draw"),
])
def test_match_outcome_uses_one_details_request_only(won_blue, won_red, expected):
    from live_match import LiveMatch

    auth = FakeAuth({
        "players": [
            {"subject": "owner", "teamId": "Blue"},
            {"subject": "ally", "teamId": "Blue"},
            {"subject": "enemy", "teamId": "Red"},
        ],
        "teams": [
            {"teamId": "Blue", "won": won_blue},
            {"teamId": "Red", "won": won_red},
        ],
    })
    result = LiveMatch(auth).pending_match_outcome("match-one")

    assert result == {"outcome": expected, "sides": {"ally": "with", "enemy": "against"}, "status": "resolved"}
    assert auth.calls == [("/match-details/v1/matches/match-one", 0)]


def test_reconciler_is_current_account_only_and_caps_each_sweep_at_two(encounters, monkeypatch):
    for match_id in ("one", "two", "three"):
        encounters.record_board(live_board(match_id))
    other = live_board("other")
    other["selfPuuid"] = "another-owner"
    encounters.record_board(other)

    import encounter_reconciler
    reconciler = importlib.reload(encounter_reconciler)
    monkeypatch.setattr(reconciler, "encounter_log", encounters)
    calls: list[str] = []

    class CurrentMatch:
        self_puuid = "owner"

        def __init__(self, _auth):
            pass

        def pending_match_outcome(self, match_id):
            calls.append(match_id)
            return None

    assert reconciler.reconcile_once(now=10_000, auth_factory=lambda: object(), match_factory=CurrentMatch) == 2
    assert len(calls) == 2
    assert "other" not in calls
    assert len(encounters.pending_due("another-owner", now=10_000, force=True)) == 1


def test_offline_launch_does_not_charge_pending_attempt(encounters, monkeypatch):
    encounters.record_board(live_board())
    import encounter_reconciler
    reconciler = importlib.reload(encounter_reconciler)
    monkeypatch.setattr(reconciler, "encounter_log", encounters)

    def offline():
        raise RuntimeError("Riot offline")

    assert reconciler.reconcile_once(now=5_000, auth_factory=offline) == 0
    assert encounters.pending_due("owner", now=5_000, force=True)[0]["attempts"] == 0


def test_career_backfill_queues_unresolved_match_and_terminal_backfill_is_idempotent(encounters):
    pending = {
        "matchId": "career-one", "result": None, "startMillis": 1_000_000,
        "map": "Lotus", "teammates": [{"puuid": "ally", "agent": "Sage"}],
    }
    encounters.backfill_career("owner", [pending])
    assert encounters.pending_due("owner", now=2_000, force=True)[0]["participants"] == {
        "ally": {"side": "with", "agent": "Sage"}}

    final = {**pending, "result": "Draw"}
    encounters.backfill_career("owner", [final])
    encounters.backfill_career("owner", [final])
    assert encounters.encounter_for("owner", "ally")["drawsWith"] == 1
    assert encounters.pending_due("owner", now=2_000, force=True) == []


@pytest.mark.parametrize(("payload", "expected"), [
    ({"status": 404, "errorCode": "MATCH_NOT_FOUND"}, "not_found"),
    ({"status": 429, "errorCode": "RATE_LIMITED"}, "rate_limited"),
])
def test_unavailable_match_status_is_persisted_for_backoff(encounters, monkeypatch, payload, expected):
    encounters.record_board(live_board())
    import encounter_reconciler
    from live_match import LiveMatch

    reconciler = importlib.reload(encounter_reconciler)
    monkeypatch.setattr(reconciler, "encounter_log", encounters)
    auth = FakeAuth(payload)

    assert reconciler.reconcile_once(now=5_000, auth_factory=lambda: auth,
                                     match_factory=LiveMatch) == 1
    pending = encounters.pending_due("owner", now=5_000, force=True)[0]
    assert pending["lastStatus"] == expected
    assert pending["attempts"] == 1
    assert auth.calls == [("/match-details/v1/matches/match-pending", 0)]


def test_first_launch_sweep_overrides_schedule_once(encounters, monkeypatch):
    encounters.record_board(live_board())
    import encounter_reconciler
    reconciler = importlib.reload(encounter_reconciler)
    monkeypatch.setattr(reconciler, "encounter_log", encounters)

    class PendingMatch:
        self_puuid = "owner"

        def __init__(self, _auth):
            pass

        def pending_match_outcome(self, _match_id):
            return {"outcome": None, "sides": {}, "status": "not_ready"}

    assert reconciler.reconcile_once(now=1, auth_factory=lambda: object(),
                                     match_factory=PendingMatch) == 1
    assert reconciler.reconcile_once(now=1, auth_factory=lambda: object(),
                                     match_factory=PendingMatch) == 0


def test_worker_start_and_flask_reloader_guard_are_idempotent(monkeypatch):
    import encounter_reconciler
    reconciler = importlib.reload(encounter_reconciler)
    threads = []

    class FakeThread:
        def __init__(self, **kwargs):
            threads.append(kwargs)

        def start(self):
            return None

    monkeypatch.setattr(reconciler.threading, "Thread", FakeThread)
    assert reconciler.start() is True
    assert reconciler.start() is False
    assert len(threads) == 1
    assert threads[0]["name"] == "EncounterReconciler"
    assert threads[0]["daemon"] is True
    assert reconciler.should_start_flask_worker(False, {}) is True
    assert reconciler.should_start_flask_worker(True, {}) is False
    assert reconciler.should_start_flask_worker(True, {"WERKZEUG_RUN_MAIN": "true"}) is True


def test_restart_reloads_pending_work_and_resolves_it(encounters, monkeypatch):
    encounters.record_board(live_board())
    restarted = importlib.reload(encounters)
    import encounter_reconciler
    reconciler = importlib.reload(encounter_reconciler)
    monkeypatch.setattr(reconciler, "encounter_log", restarted)

    class FinishedMatch:
        self_puuid = "owner"

        def __init__(self, _auth):
            pass

        def pending_match_outcome(self, _match_id):
            return {
                "outcome": "win",
                "sides": {"ally": "with", "enemy": "against"},
                "status": "resolved",
            }

    assert reconciler.reconcile_once(now=1, auth_factory=lambda: object(),
                                     match_factory=FinishedMatch) == 1
    assert restarted.encounter_for("owner", "ally")["winsWith"] == 1
    assert restarted.pending_due("owner", now=1, force=True) == []


def test_recap_then_career_backfill_does_not_duplicate_result(encounters):
    encounters.record_board(live_board("shared-result"))
    encounters.record_result(live_board("shared-result"), "Victory")
    encounters.backfill_career("owner", [{
        "matchId": "shared-result", "result": "Victory", "map": "Ascent",
        "teammates": [{"puuid": "ally", "agent": "Sage"}],
    }])

    ally = encounters.encounter_for("owner", "ally")
    assert ally["winsWith"] == 1
    assert ally["pendingWith"] == 0
