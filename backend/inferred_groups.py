"""Bounded, account-scoped historical evidence. This module never fetches data."""
from collections import OrderedDict
from itertools import combinations
from threading import RLock

_lock = RLock()
_history = OrderedDict()
_context = (None, None)
_generation = 0
_labels = {}


def activate(account, match_id):
    global _context, _generation
    with _lock:
        if _context != (account, match_id):
            _context = (account, match_id)
            _generation += 1
            _labels.clear()


def ticket(account):
    with _lock:
        return (_generation, account)


def snapshot(mid, detail):
    if not isinstance(detail, dict) or not mid:
        return None
    info = detail.get("matchInfo") or {}
    if not isinstance(info, dict) or not isinstance(detail.get("players"), list):
        return None
    if info.get("matchId") and info["matchId"] != mid:
        return None
    roster = {}
    for player in detail.get("players") or []:
        if not isinstance(player, dict):
            continue
        puuid, team = player.get("subject"), player.get("teamId")
        if isinstance(puuid, str) and puuid and isinstance(team, str) and team:
            if puuid in roster:
                return None
            party = player.get("partyId")
            roster[puuid] = (team, party.strip() if isinstance(party, str) else "")
    if len(roster) < 2:
        return None
    timestamp = info.get("gameStartMillis")
    return {"matchId": mid, "startMillis": timestamp if isinstance(timestamp, (int, float)) and timestamp > 0 else 0,
            "roster": roster}


def remember(request_ticket, puuid, rows):
    with _lock:
        generation, account = request_ticket
        if not account or generation != _generation or account != _context[0]:
            return
        key = (account, puuid)
        merged = dict(_history.pop(key, {}))
        for row in rows:
            if row and puuid in row["roster"]:
                merged[row["matchId"]] = row
        _history[key] = dict(sorted(merged.items(), key=lambda item: item[1]["startMillis"], reverse=True)[:8])
        while len(_history) > 300:
            _history.popitem(last=False)


def for_board(board):
    account, mid = board.get("selfPuuid"), board.get("matchId")
    if board.get("source") != "local" or board.get("state") not in ("PREGAME", "INGAME") or not account or not mid:
        return []
    with _lock:
        if _context != (account, mid):
            return []
        players = board.get("players") or []
        evidence = {}
        for player in players:
            evidence.update(_history.get((account, player["puuid"]), {}))
        evidence.pop(mid, None)
        candidates = []
        for team in sorted({p["team"] for p in players}):
            members = sorted({p["puuid"] for p in players if p["team"] == team})
            # ponytail: at most five players per team; enumerate subsets, revisit for larger rosters.
            for size in range(2, min(len(members), 5) + 1):
                for group in combinations(members, size):
                    shared, parties, examined = set(), set(), set()
                    for match_id, row in evidence.items():
                        roster = row["roster"]
                        if any(p in roster for p in group):
                            examined.add(match_id)
                        if not all(p in roster for p in group):
                            continue
                        if len({roster[p][0] for p in group}) != 1:
                            continue
                        shared.add(match_id)
                        party_ids = {roster[p][1] for p in group}
                        if len(party_ids) == 1 and "" not in party_ids:
                            parties.add(match_id)
                    if shared:
                        candidates.append((team, group, shared, parties, examined))
        result = []
        for team, group, shared, parties, examined in candidates:
            if any(set(group) < set(other[1]) and shared == other[2] and parties == other[3]
                   for other in candidates if other[0] == team):
                continue
            identity = (team, group)
            number = _labels.setdefault(identity, len(_labels) + 1)
            result.append({"id": f"G{number}", "team": team, "members": list(group),
                           "sharedMatches": len(shared), "partyMatches": len(parties),
                           "examinedMatches": len(examined),
                           "latestMillis": max(evidence[m]["startMillis"] for m in shared) or None})
        return sorted(result, key=lambda g: (-g["partyMatches"], -g["sharedMatches"], -len(g["members"]), g["id"]))
