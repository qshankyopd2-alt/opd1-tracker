from __future__ import annotations

import os
import threading
import time

import encounter_log
from live_match import LiveMatch
from riot_client import LocalAuth

_START_LOCK = threading.Lock()
_STARTED = False
_LAUNCH_CHECKED: set[str] = set()


def should_start_flask_worker(debug: bool, environ: dict[str, str] | None = None) -> bool:
    env = os.environ if environ is None else environ
    return not debug or env.get("WERKZEUG_RUN_MAIN") == "true"


def reconcile_once(now: int | None = None, auth_factory=LocalAuth,
                   match_factory=LiveMatch) -> int:
    """Resolve at most two pending matches for the currently authenticated account."""
    if not encounter_log.has_pending():
        return 0
    try:
        auth = auth_factory()
        live = match_factory(auth)
    except Exception:
        # Offline/not authenticated: no PD request and no attempt is charged.
        return 0
    owner = str(live.self_puuid)
    force = owner not in _LAUNCH_CHECKED
    _LAUNCH_CHECKED.add(owner)
    work = encounter_log.pending_due(owner, now=now, force=force, limit=2)
    processed = 0
    for pending in work:
        match_id = str(pending.get("matchId") or "")
        if not match_id:
            continue
        try:
            result = live.pending_match_outcome(match_id)
        except Exception as exc:
            encounter_log.mark_pending_attempt(owner, match_id,
                                               f"error:{type(exc).__name__}", now=now)
            processed += 1
            continue
        if result and result.get("outcome"):
            encounter_log.resolve_pending(owner, match_id, result["outcome"], result["sides"])
        else:
            encounter_log.mark_pending_attempt(owner, match_id,
                                               str((result or {}).get("status") or "not_ready"), now=now)
        processed += 1
    return processed


def _worker() -> None:
    while True:
        try:
            reconcile_once()
        except Exception:
            # A malformed local record must not permanently stop future sweeps.
            pass
        time.sleep(60)


def start() -> bool:
    global _STARTED
    with _START_LOCK:
        if _STARTED:
            return False
        _STARTED = True
        threading.Thread(target=_worker, name="EncounterReconciler", daemon=True).start()
        return True
