from __future__ import annotations


import json
import os
import copy
import tempfile
import threading
import time

from runtime_paths import data_dir

_DATA_DIR = str(data_dir())
_PATH = os.path.join(_DATA_DIR, "encounters.json")
_LOCK = threading.RLock()
_MAX_TIMELINE = 40
_BACKUP_REQUIRED = False
_MIGRATION_REQUIRED = False
_BACKOFF_SECONDS = (60, 300, 900, 3600, 21600)


def _empty_store() -> dict:
    return {"version": 3, "accounts": {}, "lastOwner": None,
            "discardedLegacyPlayers": 0}


def _load() -> dict:
    global _BACKUP_REQUIRED, _MIGRATION_REQUIRED
    try:
        with open(_PATH, encoding="utf-8") as fh:
            raw = json.load(fh)
        if isinstance(raw, dict) and raw.get("version") in (2, 3) and isinstance(raw.get("accounts"), dict):
            migrating = raw.get("version") == 2
            raw["version"] = 3
            raw.setdefault("lastOwner", None)
            for account in raw["accounts"].values():
                if isinstance(account, dict):
                    pending = account.setdefault("pendingMatches", {})
                    if migrating:
                        for puuid, entry in (account.get("players") or {}).items():
                            if not isinstance(entry, dict):
                                continue
                            entry.setdefault("drawsWith", 0)
                            entry.setdefault("drawsAgainst", 0)
                            match_ids = set(entry.get("matchIds") or [])
                            if entry.get("lastMatchId"):
                                match_ids.add(entry["lastMatchId"])
                            result_ids = set(entry.get("resultMatchIds") or [])
                            if entry.get("lastResultMatchId"):
                                result_ids.add(entry["lastResultMatchId"])
                            timeline = entry.get("timeline") or []
                            for match_id in match_ids - result_ids:
                                item = next((row for row in timeline
                                             if row.get("matchId") == match_id), {})
                                work = pending.setdefault(str(match_id), {
                                    "matchId": str(match_id),
                                    "firstSeenAt": int(item.get("at") or 0),
                                    "map": item.get("map"),
                                    "participants": {},
                                    "attempts": 0,
                                    "lastAttemptAt": 0,
                                    "nextAttemptAt": 0,
                                    "lastStatus": "migrated",
                                })
                                work.setdefault("participants", {})[str(puuid)] = {
                                    "side": item.get("side") if item.get("side") in ("with", "against") else None,
                                    "agent": item.get("agent"),
                                }
            _MIGRATION_REQUIRED = migrating
            return raw
        out = _empty_store()
        if isinstance(raw, dict):
            out["discardedLegacyPlayers"] = sum(isinstance(v, dict) for v in raw.values())
        _BACKUP_REQUIRED = True
        return out
    except FileNotFoundError:
        return _empty_store()
    except Exception:
        _BACKUP_REQUIRED = True
        return _empty_store()


def _save() -> bool:
    global _BACKUP_REQUIRED
    try:
        os.makedirs(_DATA_DIR, exist_ok=True)
        if _BACKUP_REQUIRED and os.path.exists(_PATH):
            backup = f"{_PATH}.backup-{time.time_ns()}"
            os.replace(_PATH, backup)
            _BACKUP_REQUIRED = False
        fd, tmp = tempfile.mkstemp(dir=_DATA_DIR, prefix=".encounters-", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(_STORE, fh, ensure_ascii=False, separators=(",", ":"))
            os.replace(tmp, _PATH)
        finally:
            if os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except OSError:
                    pass
        return True
    except Exception:
        return False


_STORE = _load()
if _MIGRATION_REQUIRED:
    _save()


def _pending_counts(account: dict, puuid: str) -> tuple[int, int]:
    with_count = 0
    against_count = 0
    for pending in (account.get("pendingMatches") or {}).values():
        participant = (pending.get("participants") or {}).get(puuid)
        if not isinstance(participant, dict):
            continue
        if participant.get("side") == "with":
            with_count += 1
        elif participant.get("side") == "against":
            against_count += 1
    return with_count, against_count


def _public_entry(source: dict, pending_with: int = 0,
                  pending_against: int = 0) -> dict:
    row = dict(source)
    row["drawsWith"] = int(source.get("drawsWith") or 0)
    row["drawsAgainst"] = int(source.get("drawsAgainst") or 0)
    row["pendingWith"] = pending_with
    row["pendingAgainst"] = pending_against
    stats = source.get("withStats") or {}
    games = int(stats.get("games") or 0)
    deaths = int(stats.get("deaths") or 0)
    hits = int(stats.get("shotsHit") or 0)
    if games:
        row["withKd"] = round(int(stats.get("kills") or 0) / deaths, 2) if deaths else float(int(stats.get("kills") or 0))
        row["withAcs"] = round(float(stats.get("acsTotal") or 0) / games)
        row["withHsPct"] = round(100 * int(stats.get("headshots") or 0) / hits) if hits else None
        row["withStatGames"] = games
    agent_counts = source.get("agentCounts") or {}
    if agent_counts:
        top_agent = max(agent_counts, key=lambda name: (int(agent_counts.get(name) or 0), name))
        row["topAgent"] = top_agent
        row["topAgentGames"] = int(agent_counts.get(top_agent) or 0)
        row["topAgentPortrait"] = (source.get("agentPortraits") or {}).get(top_agent)
        row["topAgentColor"] = (source.get("agentColors") or {}).get(top_agent)
    return row


def _account(owner: str) -> dict:
    account = _STORE.setdefault("accounts", {}).setdefault(
        str(owner), {"players": {}, "savedPlayers": {}, "pendingMatches": {}})
    account.setdefault("players", {})
    account.setdefault("savedPlayers", {})
    account.setdefault("pendingMatches", {})
    return account


def _players(owner: str) -> dict:
    account = _account(owner)
    return account.setdefault("players", {})


def record_board(board: dict | None) -> None:
    if not isinstance(board, dict) or board.get("source") != "local":
        return
    owner = board.get("selfPuuid")
    if not owner:
        return
    owner = str(owner)
    if board.get("state") != "INGAME":
        with _LOCK:
            if _STORE.get("lastOwner") != owner:
                _STORE["lastOwner"] = owner
                _save()
        return
    match_id = board.get("matchId")
    if not match_id or not isinstance(board.get("players"), list):
        return
    self_team = board.get("selfTeam")
    now = int(time.time())
    changed = False
    with _LOCK:
        if _STORE.get("lastOwner") != owner:
            _STORE["lastOwner"] = owner
            changed = True
        store = _players(owner)
        pending = _account(owner).setdefault("pendingMatches", {}).setdefault(str(match_id), {
            "matchId": str(match_id),
            "firstSeenAt": now,
            "map": board.get("map"),
            "participants": {},
            "attempts": 0,
            "lastAttemptAt": 0,
            "nextAttemptAt": now + 60,
            "lastStatus": "pending",
        })
        participants = pending.setdefault("participants", {})
        for player in board["players"]:
            if not isinstance(player, dict) or player.get("isSelf") or not player.get("puuid"):
                continue
            puuid = player["puuid"]
            same_team = self_team is not None and player.get("team") == self_team
            participants[puuid] = {
                "side": "with" if same_team else "against",
                "agent": player.get("agent"),
            }
            entry = store.setdefault(puuid, {
                "puuid": puuid, "name": None, "withCount": 0, "againstCount": 0,
                "winsWith": 0, "lossesWith": 0, "winsAgainst": 0, "lossesAgainst": 0,
                "drawsWith": 0, "drawsAgainst": 0,
                "lastSeen": 0, "agents": [],
            })
            match_ids = entry.setdefault("matchIds", [])
            legacy_match_id = entry.get("lastMatchId")
            if legacy_match_id and legacy_match_id not in match_ids:
                match_ids.append(legacy_match_id)
            if match_id not in match_ids:
                key = "withCount" if same_team else "againstCount"
                entry[key] = int(entry.get(key) or 0) + 1
                match_ids.append(match_id)
                entry["matchIds"] = match_ids[-80:]
                entry["lastMatchId"] = match_id
                timeline = entry.setdefault("timeline", [])
                timeline.append({"matchId": match_id, "at": now,
                                 "side": "with" if same_team else "against",
                                 "result": None, "agent": player.get("agent"),
                                 "map": board.get("map")})
                entry["timeline"] = timeline[-_MAX_TIMELINE:]
            for key in ("name", "rank", "peakRank", "rankTier", "peakTier",
                        "rankIcon", "rankColor", "kd", "winRate", "level"):
                if player.get(key) is not None:
                    entry[key] = player.get(key)
            entry["lastSeen"] = now
            agent = player.get("agent")
            if agent and agent != "Unknown" and agent not in entry.setdefault("agents", []):
                entry["agents"].append(agent)
                entry["agents"] = entry["agents"][-8:]
            changed = True
        if changed:
            _save()


def _normalise_outcome(outcome: object) -> str | None:
    if outcome is True or outcome in ("win", "Victory"):
        return "win"
    if outcome is False or outcome in ("loss", "Defeat"):
        return "loss"
    if outcome in ("draw", "Draw"):
        return "draw"
    return None


def pending_due(owner: str | None, now: int | None = None, force: bool = False,
                limit: int = 2) -> list[dict]:
    if not owner:
        return []
    when = int(time.time()) if now is None else int(now)
    with _LOCK:
        pending = (_account(str(owner)).get("pendingMatches") or {}).values()
        rows = [copy.deepcopy(row) for row in pending
                if force or int(row.get("nextAttemptAt") or 0) <= when]
    rows.sort(key=lambda row: (int(row.get("nextAttemptAt") or 0),
                               int(row.get("firstSeenAt") or 0),
                               str(row.get("matchId") or "")))
    return rows[:max(0, int(limit))]


def has_pending() -> bool:
    with _LOCK:
        return any((account or {}).get("pendingMatches")
                   for account in (_STORE.get("accounts") or {}).values())


def mark_pending_attempt(owner: str | None, match_id: str | None, status: str,
                         now: int | None = None) -> bool:
    if not owner or not match_id:
        return False
    when = int(time.time()) if now is None else int(now)
    with _LOCK:
        work = _account(str(owner))["pendingMatches"].get(str(match_id))
        if not isinstance(work, dict):
            return False
        attempts = int(work.get("attempts") or 0) + 1
        delay = _BACKOFF_SECONDS[min(attempts - 1, len(_BACKOFF_SECONDS) - 1)]
        work.update({"attempts": attempts, "lastAttemptAt": when,
                     "nextAttemptAt": when + delay, "lastStatus": str(status)})
        return _save()


def resolve_pending(owner: str | None, match_id: str | None, outcome: object,
                    sides: dict[str, str | None] | None = None) -> bool:
    result = _normalise_outcome(outcome)
    if not owner or not match_id or result is None:
        return False
    owner, match_id = str(owner), str(match_id)
    changed = False
    with _LOCK:
        account = _account(owner)
        work = account["pendingMatches"].get(match_id)
        if not isinstance(work, dict):
            return False
        unresolved: dict[str, dict] = {}
        for puuid, participant in (work.get("participants") or {}).items():
            participant = participant if isinstance(participant, dict) else {}
            side = participant.get("side")
            if side not in ("with", "against") and sides:
                side = sides.get(puuid)
            if side not in ("with", "against"):
                unresolved[puuid] = participant
                continue
            entry = (account.get("players") or {}).get(puuid)
            if not isinstance(entry, dict):
                continue
            result_ids = entry.setdefault("resultMatchIds", [])
            legacy = entry.get("lastResultMatchId")
            if legacy and legacy not in result_ids:
                result_ids.append(legacy)
            if match_id in result_ids:
                continue
            suffix = "With" if side == "with" else "Against"
            key = ({"win": "wins", "loss": "losses", "draw": "draws"}[result]
                   + suffix)
            entry[key] = int(entry.get(key) or 0) + 1
            result_ids.append(match_id)
            entry["resultMatchIds"] = result_ids[-80:]
            entry["lastResultMatchId"] = match_id
            timeline = entry.setdefault("timeline", [])
            item = next((row for row in timeline
                         if row.get("matchId") == match_id), None)
            if item is None:
                item = {"matchId": match_id, "at": int(work.get("firstSeenAt") or time.time())}
                timeline.append(item)
            item.update({"side": side, "result": result,
                         "agent": participant.get("agent"), "map": work.get("map")})
            entry["timeline"] = timeline[-_MAX_TIMELINE:]
            changed = True
        if unresolved:
            work["participants"] = unresolved
            work["lastStatus"] = "partial"
        else:
            account["pendingMatches"].pop(match_id, None)
        if changed or not unresolved:
            _save()
    return changed


def record_result(board: dict | None, won: bool | str | None) -> None:
    if won is None or not isinstance(board, dict) or board.get("source") != "local":
        return
    owner = board.get("selfPuuid")
    match_id = board.get("matchId")
    if not owner or not match_id:
        return
    self_team = board.get("selfTeam")
    sides = {str(player["puuid"]): ("with" if self_team is not None and
             player.get("team") == self_team else "against")
             for player in board.get("players") or []
             if isinstance(player, dict) and not player.get("isSelf") and player.get("puuid")}
    resolve_pending(str(owner), str(match_id), won, sides)


def backfill_career(owner: str | None, matches: list[dict] | None) -> int:
    if not owner or not isinstance(matches, list):
        return 0
    changed = 0
    dirty = False
    terminal_results: list[tuple[str, str, dict[str, str]]] = []
    with _LOCK:
        owner = str(owner)
        if _STORE.get("lastOwner") != owner:
            _STORE["lastOwner"] = owner
            dirty = True
        store = _players(owner)
        for match in matches:
            if not isinstance(match, dict) or not match.get("matchId"):
                continue
            match_id = str(match["matchId"])
            result = match.get("result")
            seen_at = int((match.get("startMillis") or 0) / 1000) or int(time.time())
            terminal = result in ("Victory", "Defeat", "Draw")
            pending_matches = _account(owner)["pendingMatches"]
            was_pending = match_id in pending_matches
            pending_work = pending_matches.setdefault(match_id, {
                "matchId": match_id, "firstSeenAt": seen_at,
                "map": match.get("map"), "participants": {}, "attempts": 0,
                "lastAttemptAt": 0, "nextAttemptAt": seen_at + 60,
                "lastStatus": "career_pending",
            })
            if not was_pending:
                dirty = True
            career_sides: dict[str, str] = {}
            for teammate in match.get("teammates") or []:
                if not isinstance(teammate, dict) or not teammate.get("puuid"):
                    continue
                puuid = str(teammate["puuid"])
                pending_work.setdefault("participants", {})[puuid] = {
                    "side": "with", "agent": teammate.get("agent")}
                career_sides[puuid] = "with"
                entry = store.setdefault(puuid, {
                    "puuid": puuid, "name": None, "withCount": 0, "againstCount": 0,
                    "winsWith": 0, "lossesWith": 0, "winsAgainst": 0, "lossesAgainst": 0,
                    "drawsWith": 0, "drawsAgainst": 0,
                    "lastSeen": 0, "agents": [],
                })
                match_ids = entry.setdefault("matchIds", [])
                for legacy in (entry.get("lastMatchId"),):
                    if legacy and legacy not in match_ids:
                        match_ids.append(legacy)
                if match_id not in match_ids:
                    entry["withCount"] = int(entry.get("withCount") or 0) + 1
                    match_ids.append(match_id)
                    entry["matchIds"] = match_ids[-80:]
                    changed += 1
                    dirty = True

                if teammate.get("name"):
                    if entry.get("name") != teammate["name"]:
                        entry["name"] = teammate["name"]
                        dirty = True
                for key in ("rank", "peakRank", "kd", "winRate", "level"):
                    if teammate.get(key) is not None and entry.get(key) != teammate.get(key):
                        entry[key] = teammate.get(key)
                        dirty = True
                previous_seen = int(entry.get("lastSeen") or 0)
                entry["lastSeen"] = max(previous_seen, seen_at)
                dirty = dirty or entry["lastSeen"] != previous_seen
                entry["lastMatchId"] = match_id
                agent = teammate.get("agent")
                if agent and agent != "Unknown" and agent not in entry.setdefault("agents", []):
                    entry["agents"].append(agent)
                    entry["agents"] = entry["agents"][-8:]
                    dirty = True
                stat_match_ids = entry.setdefault("withStatMatchIds", [])
                if match_id not in stat_match_ids:
                    stats = entry.setdefault("withStats", {
                        "games": 0, "kills": 0, "deaths": 0, "assists": 0,
                        "acsTotal": 0, "shotsHit": 0, "headshots": 0,
                    })
                    stats["games"] = int(stats.get("games") or 0) + 1
                    for field in ("kills", "deaths", "assists", "shotsHit", "headshots"):
                        stats[field] = int(stats.get(field) or 0) + int(teammate.get(field) or 0)
                    stats["acsTotal"] = float(stats.get("acsTotal") or 0) + float(teammate.get("acs") or 0)
                    stat_match_ids.append(match_id)
                    entry["withStatMatchIds"] = stat_match_ids[-80:]
                    if agent and agent != "Unknown":
                        counts = entry.setdefault("agentCounts", {})
                        counts[agent] = int(counts.get(agent) or 0) + 1
                        if teammate.get("agentPortrait"):
                            entry.setdefault("agentPortraits", {})[agent] = teammate["agentPortrait"]
                        if teammate.get("agentColor"):
                            entry.setdefault("agentColors", {})[agent] = teammate["agentColor"]
                    dirty = True
                timeline = entry.setdefault("timeline", [])
                timeline_item = next((item for item in timeline
                                      if item.get("matchId") == match_id), None)
                if timeline_item is None:
                    timeline.append({"matchId": match_id, "at": seen_at, "side": "with",
                                     "result": None,
                                     "agent": agent, "map": match.get("map")})
                    dirty = True
                else:
                    updates = {"at": seen_at, "side": "with", "agent": agent,
                               "map": match.get("map")}
                    if any(timeline_item.get(key) != value for key, value in updates.items()
                           if value is not None):
                        timeline_item.update({key: value for key, value in updates.items()
                                              if value is not None})
                        dirty = True
                entry["timeline"] = sorted(
                    timeline, key=lambda item: item.get("at") or 0)[-_MAX_TIMELINE:]
            if terminal:
                terminal_results.append((match_id, str(result), career_sides))
        if dirty:
            _save()
    for match_id, result, sides in terminal_results:
        resolve_pending(str(owner), match_id, result, sides)
    return changed


def enrich_player(owner: str | None, puuid: str | None, fields: dict | None) -> None:
    if not owner or not puuid or not isinstance(fields, dict):
        return
    with _LOCK:
        entry = _players(owner).get(str(puuid))
        if not entry:
            return
        dirty = False
        for key in ("name", "rank", "peakRank", "rankTier", "peakTier",
                    "rankIcon", "rankColor", "kd", "winRate", "level"):
            if fields.get(key) is not None and entry.get(key) != fields.get(key):
                entry[key] = fields.get(key)
                dirty = True
        if dirty:
            _save()


def get_all(owner: str | None, limit: int = 200) -> list[dict]:
    if not owner:
        return []
    with _LOCK:
        account = _account(str(owner))
        entries = []
        for puuid, entry in account["players"].items():
            pending_with, pending_against = _pending_counts(account, puuid)
            entries.append(_public_entry(entry, pending_with, pending_against))
    entries.sort(key=lambda entry: (int(entry.get("withCount") or 0) + int(entry.get("againstCount") or 0)), reverse=True)
    return entries[:limit] if limit is not None and limit >= 0 else entries


def account_count() -> int:
    with _LOCK:
        return sum(1 for account in _STORE.get("accounts", {}).values()
                   if isinstance(account, dict) and account.get("players"))


def get_all_accounts(current_owner: str | None = None, limit: int = 200) -> list[dict]:
    merged: dict[str, dict] = {}
    counter_keys = ("withCount", "againstCount", "winsWith", "lossesWith",
                    "drawsWith", "winsAgainst", "lossesAgainst", "drawsAgainst")
    with _LOCK:
        accounts = list((_STORE.get("accounts") or {}).items())
        for owner, account in accounts:
            for puuid, source in ((account or {}).get("players") or {}).items():
                row = merged.setdefault(puuid, {"puuid": puuid, "accountsSeen": []})
                if owner not in row["accountsSeen"]:
                    row["accountsSeen"].append(owner)
                for key in counter_keys:
                    row[key] = int(row.get(key) or 0) + int(source.get(key) or 0)
                pending_with, pending_against = _pending_counts(account or {}, puuid)
                row["pendingWith"] = int(row.get("pendingWith") or 0) + pending_with
                row["pendingAgainst"] = int(row.get("pendingAgainst") or 0) + pending_against
                if int(source.get("lastSeen") or 0) >= int(row.get("lastSeen") or 0):
                    for key in ("name", "rank", "peakRank", "rankTier", "peakTier",
                                "rankIcon", "rankColor", "kd", "winRate", "level",
                                "lastSeen", "lastMatchId"):
                        if source.get(key) is not None:
                            row[key] = source.get(key)
                row["agents"] = list(dict.fromkeys((row.get("agents") or []) +
                                                    (source.get("agents") or [])))[-8:]
                row["timeline"] = sorted((row.get("timeline") or []) +
                                         (source.get("timeline") or []),
                                         key=lambda item: item.get("at") or 0)[-40:]
                source_stats = source.get("withStats") or {}
                stats = row.setdefault("withStats", {})
                for key in ("games", "kills", "deaths", "assists", "acsTotal", "shotsHit", "headshots"):
                    stats[key] = float(stats.get(key) or 0) + float(source_stats.get(key) or 0)
                counts = row.setdefault("agentCounts", {})
                for agent, count in (source.get("agentCounts") or {}).items():
                    counts[agent] = int(counts.get(agent) or 0) + int(count or 0)
                row["agentPortraits"] = {**(row.get("agentPortraits") or {}),
                                         **(source.get("agentPortraits") or {})}
                row["agentColors"] = {**(row.get("agentColors") or {}),
                                      **(source.get("agentColors") or {})}
    entries = [_public_entry(entry, int(entry.get("pendingWith") or 0),
                             int(entry.get("pendingAgainst") or 0))
               for entry in merged.values()]
    entries.sort(key=lambda entry: (int(entry.get("withCount") or 0) +
                                    int(entry.get("againstCount") or 0)), reverse=True)
    return entries[:limit] if limit is not None and limit >= 0 else entries


def get_one(owner: str | None, puuid: str) -> dict | None:
    if not owner or not puuid:
        return None
    with _LOCK:
        entry = _players(owner).get(puuid)
        return dict(entry) if entry else None


def encounter_for(owner: str | None, puuid: str) -> dict | None:
    entry = get_one(owner, puuid)
    if not entry:
        return None
    with _LOCK:
        pending_with, pending_against = _pending_counts(_account(str(owner)), puuid)
    return {
        "withCount": int(entry.get("withCount") or 0),
        "againstCount": int(entry.get("againstCount") or 0),
        "winsWith": int(entry.get("winsWith") or 0),
        "lossesWith": int(entry.get("lossesWith") or 0),
        "drawsWith": int(entry.get("drawsWith") or 0),
        "winsAgainst": int(entry.get("winsAgainst") or 0),
        "lossesAgainst": int(entry.get("lossesAgainst") or 0),
        "drawsAgainst": int(entry.get("drawsAgainst") or 0),
        "pendingWith": pending_with,
        "pendingAgainst": pending_against,
    }


def last_owner() -> str | None:
    with _LOCK:
        owner = _STORE.get("lastOwner")
        return str(owner) if owner else None


def saved_for(owner: str | None, puuid: str | None) -> dict | None:
    if not owner or not puuid:
        return None
    with _LOCK:
        saved = _account(str(owner))["savedPlayers"].get(str(puuid))
        return dict(saved) if isinstance(saved, dict) else None


def get_saved(owner: str | None, limit: int = 200) -> list[dict]:
    if not owner:
        return []
    with _LOCK:
        account = _account(str(owner))
        rows = []
        for puuid, saved in account["savedPlayers"].items():
            source = account["players"].get(puuid)
            if not isinstance(saved, dict) or not isinstance(source, dict):
                continue
            pending_with, pending_against = _pending_counts(account, puuid)
            row = _public_entry(source, pending_with, pending_against)
            row.update({
                "saved": True,
                "note": str(saved.get("note") or ""),
                "savedAt": int(saved.get("savedAt") or 0),
                "updatedAt": int(saved.get("updatedAt") or 0),
            })
            rows.append(row)
    rows.sort(key=lambda row: (int(row.get("updatedAt") or 0),
                               int(row.get("lastSeen") or 0)), reverse=True)
    return rows[:limit] if limit is not None and limit >= 0 else rows


def update_saved(owner: str | None, puuid: str | None, payload: object) -> dict:
    if not owner or not puuid:
        return {"ok": False, "code": "missing_account",
                "message": "An active account and player are required."}
    owner, puuid = str(owner), str(puuid)
    if owner == puuid:
        return {"ok": False, "code": "self",
                "message": "You cannot save your own account."}
    if not isinstance(payload, dict):
        return {"ok": False, "code": "invalid", "message": "Invalid request."}
    raw_note = payload.get("note", "")
    if not isinstance(raw_note, str) or len(raw_note) > 500:
        return {"ok": False, "code": "invalid_note",
                "message": "Notes must be 500 characters or fewer."}
    note = raw_note.strip()
    keep = bool(payload.get("saved", True))

    with _LOCK:
        account = _account(owner)
        if puuid not in account["players"]:
            return {"ok": False, "code": "unknown_player",
                    "message": "This player has not appeared in your matches yet."}
        saved_players = account["savedPlayers"]
        previous = dict(saved_players[puuid]) if puuid in saved_players else None
        if not keep:
            saved_players.pop(puuid, None)
        else:
            now = int(time.time())
            saved_players[puuid] = {
                "note": note,
                "savedAt": int((previous or {}).get("savedAt") or now),
                "updatedAt": now,
            }
        if not _save():
            if previous is None:
                saved_players.pop(puuid, None)
            else:
                saved_players[puuid] = previous
            return {"ok": False, "code": "save_failed",
                    "message": "The saved-player file could not be written."}

    return {"ok": True, "saved": keep, "puuid": puuid,
            "player": next((row for row in get_saved(owner) if row["puuid"] == puuid), None)}
