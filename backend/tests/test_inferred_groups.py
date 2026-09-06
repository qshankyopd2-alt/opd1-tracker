from concurrent.futures import ThreadPoolExecutor

import inferred_groups as groups
import live_match


def board(account="owner", mid="current"):
    return {"source": "local", "state": "INGAME", "selfPuuid": account, "matchId": mid,
            "players": [{"puuid": p, "team": "Blue" if p in "abc" else "Red"} for p in "abcxy"]}


def evidence(mid, members="ab", party="", timestamp=100):
    return groups.snapshot(mid, {"matchInfo": {"gameStartMillis": timestamp},
                               "players": [{"subject": p, "teamId": "Blue", "partyId": party} for p in members]})


def setup_function():
    groups._history.clear()
    groups.activate(None, None)
    groups.activate("owner", "current")


def test_deeper_profile_adds_sixth_seventh_eighth_without_losing_evidence():
    token = groups.ticket("owner")
    initial = [evidence(str(i), "az", timestamp=1000-i) for i in range(5)]
    groups.remember(token, "a", initial)
    assert groups.for_board(board()) == []
    for i in range(5, 8):
        groups.remember(token, "a", [evidence(str(i), timestamp=1000-i)])
        result = groups.for_board(board())[0]
        assert result["sharedMatches"] == i-4
        assert result["id"] == "G1"
    groups.remember(token, "a", initial)
    assert groups.for_board(board())[0]["sharedMatches"] == 3
    assert len(groups._history[("owner", "a")]) == 8


def test_second_profile_merges_concurrently_and_counts_each_match_once():
    token = groups.ticket("owner")
    shared = evidence("same", party="party")
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda p: groups.remember(token, p, [shared]), ["a", "b", "a", "b"]))
    groups.remember(token, "b", [evidence("extra")])
    result = groups.for_board(board())[0]
    assert (result["sharedMatches"], result["partyMatches"]) == (2, 1)


def test_triples_need_joint_evidence_and_keep_stronger_pairs():
    token = groups.ticket("owner")
    groups.remember(token, "a", [evidence("ab")])
    groups.remember(token, "b", [evidence("bc", "bc")])
    assert {tuple(g["members"]) for g in groups.for_board(board())} == {("a", "b"), ("b", "c")}
    groups.remember(token, "a", [evidence("abc", "abc")])
    result = groups.for_board(board())
    assert {tuple(g["members"]) for g in result} == {("a", "b"), ("b", "c"), ("a", "b", "c")}
    assert next(g for g in result if len(g["members"]) == 3)["sharedMatches"] == 1


def test_opponents_missing_data_current_match_and_party_ids():
    token = groups.ticket("owner")
    opposite = evidence("opposite")
    opposite["roster"]["b"] = ("Red", "")
    groups.remember(token, "a", [None, opposite, evidence("current"), evidence("cross", "ax")])
    assert groups.for_board(board()) == []
    groups.remember(token, "x", [evidence("enemy", "xy")])
    assert groups.for_board(board())[0]["members"] == ["x", "y"]
    assert groups.for_board(board())[0]["partyMatches"] == 0
    assert groups.snapshot("", {}) is None
    assert groups.snapshot("x", {"players": [None, {}, {"subject": "a"}]}) is None


def test_old_requests_cannot_modify_new_context_and_accounts_are_isolated():
    old = groups.ticket("owner")
    groups.activate("owner", "next")
    groups.remember(old, "a", [evidence("late")])
    assert groups.for_board(board(mid="next")) == []
    groups.remember(groups.ticket("owner"), "a", [evidence("valid")])
    assert groups.for_board(board(mid="next"))
    groups.activate("other", "next")
    assert groups.for_board(board("other", "next")) == []
    assert groups.for_board(board(mid="next")) == []


def test_history_bound_and_no_network_needed(monkeypatch):
    monkeypatch.setattr(live_match.requests, "get", lambda *a, **k: (_ for _ in ()).throw(AssertionError("network")))
    token = groups.ticket("owner")
    for i in range(305):
        groups.remember(token, str(i), [evidence(str(i), [str(i), "a"])])
    assert len(groups._history) == 300
    groups.for_board(board())


def test_kd_and_profile_ingest_existing_responses(monkeypatch):
    class Auth:
        puuid = "owner"
        def headers(self): return {}
        def pd_get(self, path, **kwargs):
            calls.append(path)
            if "match-history" in path: return {"History": [{"MatchID": "deep"}]}
            assert path == "/match-details/v1/matches/deep"
            return {"matchInfo": {"gameStartMillis": 100}, "players": [
                {"subject": "a", "teamId": "Blue", "stats": {"kills": 1, "deaths": 1}},
                {"subject": "b", "teamId": "Blue", "stats": {}}]}
    calls = []
    lm = live_match.LiveMatch(Auth())
    monkeypatch.setattr(lm, "_fresh_mids", lambda p: (["deep"], False, False))
    live_match._KD_CACHE.clear()
    live_match._MATCH_DETAIL_CACHE.clear()
    lm.kd_hs("a")
    assert calls == ["/match-details/v1/matches/deep"]
    assert groups.for_board(board())[0]["sharedMatches"] == 1
    calls.clear()
    monkeypatch.setattr(lm, "_career_match", lambda *a: None)
    lm.player_career("a")
    assert len(calls) == 2
    assert groups.for_board(board())[0]["sharedMatches"] == 1
