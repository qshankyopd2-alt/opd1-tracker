from __future__ import annotations

import hmac
import json
import os
import threading
import time

from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import encounter_log
import opd1log
import live_match
import party_detector
import session_tracker
import history
import inventory
import match_meta
from runtime_paths import data_dir
from agents import AGENTS, resolve_agent
from riot_client import REGIONS, LocalAuth, RiotClient, ClientNotReady
from vconstants import APP_VERSION, STATES, rank_from_tier

app = Flask(__name__)
_ALLOWED_ORIGINS = [
    "http://tauri.localhost",
    "https://tauri.localhost",
    "tauri://localhost",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]
CORS(app, resources={r"/api/*": {"origins": _ALLOWED_ORIGINS}},
     allow_headers=["Content-Type", "X-OPD1-Token"])


@app.before_request
def _require_desktop_token():
    expected = os.getenv("OPD1_API_TOKEN", "")
    if (not expected or request.method == "OPTIONS" or
            not request.path.startswith("/api/")):
        return None
    supplied = request.headers.get("X-OPD1-Token", "")
    if not hmac.compare_digest(supplied, expected):
        return jsonify({"ok": False, "message": "Unauthorized local request."}), 401
    return None

for _h in opd1log.get_logger("backend").handlers:
    app.logger.addHandler(_h)

client = RiotClient()

_CACHE: dict[str, tuple[float, dict]] = {}
_CACHE_TTL = float(os.getenv("PLAYER_CACHE_TTL", "60"))
_ENCOUNTER_BACKFILL_AT: dict[str, float] = {}
_ENCOUNTER_BACKFILL_LOCK = threading.Lock()

_SETTINGS_PATH = os.path.join(str(data_dir()), "settings.json")
_SETTINGS_LOCK = threading.Lock()

_SETTINGS_KEYS = {"region", "autoRefresh"}

def _load_settings() -> dict:
    try:
        with open(_SETTINGS_PATH, encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}

def _save_settings(data: dict) -> None:
    os.makedirs(os.path.dirname(_SETTINGS_PATH), exist_ok=True)
    tmp = f"{_SETTINGS_PATH}.tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
    os.replace(tmp, _SETTINGS_PATH)

def _summarize(matches: list[dict]) -> dict:
    n = len(matches)
    if n == 0:
        return {"matchesAnalyzed": 0, "kills": 0, "deaths": 0, "assists": 0,
                "kd": 0, "kda": 0, "hsPct": 0, "winRate": 0, "wins": 0, "losses": 0}
    k = sum(m["stats"]["kills"] for m in matches)
    d = sum(m["stats"]["deaths"] for m in matches)
    a = sum(m["stats"]["assists"] for m in matches)
    hs = [m["stats"].get("hsPct", 0) for m in matches if m["stats"].get("hsPct")]
    wins = sum(1 for m in matches if m["result"] == "Victory")
    losses = sum(1 for m in matches if m["result"] == "Defeat")
    return {
        "matchesAnalyzed": n,
        "kills": round(k / n, 1),
        "deaths": round(d / n, 1),
        "assists": round(a / n, 1),
        "kd": round(k / d, 2) if d else float(k),
        "kda": round((k + a) / d, 2) if d else float(k + a),
        "hsPct": round(sum(hs) / len(hs), 1) if hs else 0,
        "winRate": round(100 * wins / n, 1),
        "wins": wins,
        "losses": losses,
    }

def _decorate_match(m: dict) -> dict:
    meta = resolve_agent(m.get("agent")) or {}
    st = m["stats"]
    kda = round((st["kills"] + st["assists"]) / st["deaths"], 2) if st["deaths"] else float(st["kills"] + st["assists"])
    out = dict(m)
    out.pop("teammates", None)
    out["agentMeta"] = {
        "name": meta.get("name", m.get("agent")),
        "role": meta.get("role", "Flex"),
        "color": meta.get("color", "#FF4655"),
        "portrait": meta.get("portrait"),
    }
    out["stats"] = {**st, "kda": kda}
    return out

def build_player_payload(puuid: str) -> dict:
    raw = client.get_player_overview(puuid)
    matches = raw.get("matches", [])

    party = party_detector.analyze(matches, top_n=5)
    rank = rank_from_tier(raw.get("rankTier"))
    peak = rank_from_tier(raw.get("peakTier"))

    decorated = [_decorate_match(m) for m in party["matches"]]

    for dm, pm in zip(decorated, party["matches"]):
        dm["partyMembers"] = pm.get("partyMembers", [])

    return {
        "puuid": puuid,
        "riotId": raw.get("riotId", "Player"),
        "currentRank": rank["name"],
        "rankTier": rank["tier"],
        "rankGroup": rank["group"],
        "rankColor": rank["color"],
        "rr": raw.get("rr", 0),
        "peakRank": peak["name"],
        "peakColor": peak["color"],
        "source": raw.get("source", "unavailable"),
        "sourceDetail": raw.get("sourceDetail", ""),
        "averages": _summarize(matches),
        "coPlayers": party["coPlayers"],
        "partyCount": party["partyCount"],
        "matches": decorated,
    }

@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "service": "opd1-tracker",
        "appVersion": APP_VERSION,
        "dataSourcePreference": client.source_pref,
        "officialKey": bool(client.api_key),
        "clientStatus": "ok" if LocalAuth.available() else "not_running",
    })

@app.get("/api/agents")
def agents():
    return jsonify({"agents": AGENTS, "count": len(AGENTS)})

@app.get("/api/settings")
def settings_get():
    with _SETTINGS_LOCK:
        return jsonify(_load_settings())

@app.post("/api/settings")
def settings_post():
    body = request.get_json(silent=True) or {}
    incoming = {k: v for k, v in body.items() if k in _SETTINGS_KEYS}
    with _SETTINGS_LOCK:
        merged = _load_settings()
        merged.update(incoming)
        try:
            _save_settings(merged)
        except Exception as e:
            app.logger.exception("settings save failed")
            return jsonify({"ok": False, "message": str(e),
                            "settings": merged}), 200
    return jsonify({"ok": True, "settings": merged})

def _live_enabled() -> bool:
    return LocalAuth.available()

def _attach_encounters(board: dict) -> dict:
    is_live = board.get("source") == "local"
    self_team = board.get("selfTeam")
    for p in board.get("players") or []:
        if not isinstance(p, dict):
            continue
        enc = encounter_log.encounter_for(board.get("selfPuuid"), p.get("puuid")) if is_live else None
        saved = encounter_log.saved_for(board.get("selfPuuid"), p.get("puuid")) if is_live else None

        if enc:
            if self_team is not None and p.get("team") == self_team:
                enc["withCount"] = max(0, enc["withCount"] - 1)
            else:
                enc["againstCount"] = max(0, enc["againstCount"] - 1)
        p["encounter"] = enc
        p["saved"] = bool(saved)
        p["savedNote"] = str((saved or {}).get("note") or "")
    return board

def _client_notice() -> dict:
    if not LocalAuth.available():
        return {"level": "info", "action": "open_game",
                "message": "Open VALORANT to see live ranks, parties and stats."}
    return {"level": "warn", "action": "restart_game",
            "message": "Couldn't read VALORANT — please restart your game "
                       "(close it completely and relaunch), then try again."}

_LAST_GOOD = {"board": None, "at": 0.0, "notReady": False}
_HOLD_SECS = 12

_BUILD_LOCK = threading.Lock()
_BUILD_FRESH = 3.5

def build_live(seed: int = 7, want_state: str | None = None) -> dict:
    notice = None
    if _live_enabled():
        with _BUILD_LOCK:
            if _LAST_GOOD["board"] and time.time() - _LAST_GOOD["at"] < _BUILD_FRESH:
                return _LAST_GOOD["board"]
            try:
                lm = live_match.LiveMatch(LocalAuth())
                board = lm.build_scoreboard(
                    include_stats=os.getenv("LIVE_INCLUDE_STATS", "true").lower() != "false"
                )
                board.setdefault("sourceDetail", "Local VALORANT client")
                board["selfPuuid"] = lm.self_puuid

                try:
                    session_tracker.observe(board, lm)
                    session_tracker.attach(board)
                except Exception:
                    app.logger.exception("session tracking failed")

                try:
                    encounter_log.record_board(board)
                    _attach_encounters(board)
                except Exception:
                    app.logger.exception("encounter logging failed")
                board["appVersion"] = APP_VERSION
                _LAST_GOOD["board"], _LAST_GOOD["at"] = board, time.time()
                _LAST_GOOD["notReady"] = False
                return board
            except Exception as e:
                if isinstance(e, ClientNotReady):
                    if not _LAST_GOOD["notReady"]:
                        app.logger.info("live scoreboard: %s — waiting for sign-in", e)
                        _LAST_GOOD["notReady"] = True
                else:
                    app.logger.exception("live scoreboard failed")

                if _LAST_GOOD["board"] and time.time() - _LAST_GOOD["at"] < _HOLD_SECS:
                    return _LAST_GOOD["board"]
                notice = _client_notice()
                return {"state": "OFFLINE", "stateLabel": "Offline", "source": "local",
                        "error": str(e), "players": [], "teams": {}, "parties": [],
                        "notice": notice, "appVersion": APP_VERSION}

    notice = _client_notice()
    return {"state": "OFFLINE", "stateLabel": "Offline", "source": "local",
            "players": [], "teams": {}, "parties": [],
            "notice": notice, "appVersion": APP_VERSION}


@app.get("/api/state")
def state():
    if _live_enabled():
        try:
            lm = live_match.LiveMatch(LocalAuth())
            st = lm.game_state(lm._presences())
            return jsonify({"state": st, "stateLabel": STATES.get(st, st), "source": "local"})
        except Exception as e:
            return jsonify({"state": "OFFLINE", "stateLabel": "Offline",
                            "source": "local", "error": str(e)})
    return jsonify({"state": "OFFLINE", "stateLabel": "Offline", "source": "local"})

@app.get("/api/live")
def live():
    try:
        seed = int(request.args.get("seed", 7))
    except (TypeError, ValueError):
        seed = 7
    return jsonify(build_live(seed, request.args.get("state")))


def _refresh_encounter_history(owner: str | None) -> None:
    if not owner or not _live_enabled():
        return
    now = time.time()
    with _ENCOUNTER_BACKFILL_LOCK:
        if now - _ENCOUNTER_BACKFILL_AT.get(owner, 0) < 600:
            return
        _ENCOUNTER_BACKFILL_AT[owner] = now

    def _run() -> None:
        try:
            lm = live_match.LiveMatch(LocalAuth())
            career = lm.player_career(owner, count=10)
            encounter_log.backfill_career(owner, career.get("matches") or [])

            season = lm.season_id()
            previous_season = lm.prev_season_id()
            for teammate in (career.get("coPlayers") or [])[:6]:
                if int(teammate.get("sharedMatches") or 0) < 2:
                    continue
                puuid = teammate.get("puuid")
                if not puuid:
                    continue
                rank = lm.rank_info(puuid, season, previous_season)
                tier = int(rank.get("tier") or 0)
                if tier <= 0:
                    continue
                current = rank_from_tier(tier)
                peak = rank_from_tier(rank.get("peak") or tier)
                encounter_log.enrich_player(owner, puuid, {
                    "name": teammate.get("name"),
                    "rank": current["name"],
                    "peakRank": peak["name"],
                    "rankTier": current["tier"],
                    "peakTier": peak["tier"],
                    "rankColor": current["color"],
                    "winRate": rank.get("wr"),
                })
        except Exception:
            with _ENCOUNTER_BACKFILL_LOCK:
                _ENCOUNTER_BACKFILL_AT.pop(owner, None)
            app.logger.exception("encounter history backfill failed")

    threading.Thread(
        target=_run,
        daemon=True,
        name=f"encounter-backfill-{owner[:8]}",
    ).start()

@app.get("/api/encounters")
def encounters():
    owner = _current_puuid()
    _refresh_encounter_history(owner)
    scope = "all" if request.args.get("scope") == "all" else "current"
    return jsonify({"players": encounter_log.get_all_accounts(owner) if scope == "all"
                    else encounter_log.get_all(owner),
                    "accountCount": encounter_log.account_count(), "scope": scope})


@app.get("/api/saved-players")
def saved_players_get():
    owner = encounter_log.last_owner()
    return jsonify({"accountPuuid": owner,
                    "players": encounter_log.get_saved(owner)})


@app.put("/api/saved-players/<puuid>")
def saved_players_put(puuid: str):
    body = request.get_json(silent=True) or {}
    owner = encounter_log.last_owner()
    requested_owner = body.get("accountPuuid")
    if not owner:
        return jsonify({"ok": False,
                        "message": "Open VALORANT and load Live Match first."}), 409
    if requested_owner != owner:
        return jsonify({"ok": False,
                        "message": "The active account changed. Refresh and try again."}), 409
    result = encounter_log.update_saved(owner, puuid, body)
    status = 200 if result.get("ok") else 404 if result.get("code") == "unknown_player" else 400
    return jsonify(result), status

@app.get("/api/recap")
def recap():
    live_recap = session_tracker.current_recap() if _live_enabled() else None
    return jsonify(live_recap or None)


def _current_puuid() -> str | None:
    if not _live_enabled():
        return None
    try:
        auth = LocalAuth()
        auth.headers()
        return auth.puuid
    except Exception:
        return None


@app.get("/api/sessions")
def sessions_get():
    return jsonify(session_tracker.list_for(_current_puuid()))


@app.post("/api/session/start")
def session_start():
    owner = _current_puuid()
    baseline = history.payload(owner).get("summary", {}) if owner else None
    return jsonify(session_tracker.start(owner, (request.get_json(silent=True) or {}).get("goal"), baseline))


@app.post("/api/session/end")
def session_end():
    return jsonify(session_tracker.end(_current_puuid()))


@app.delete("/api/sessions/<session_id>")
def session_delete(session_id: str):
    return jsonify(session_tracker.delete(_current_puuid(), session_id.strip()))


@app.post("/api/session/reset")
def session_reset():
    body = request.get_json(silent=True) or {}
    return jsonify(session_tracker.reset(_current_puuid(), body.get("goal")))


def _insights_payload(timezone_name: str | None = None) -> dict:
    puuid = None
    if _live_enabled():
        try:
            auth = LocalAuth()
            auth.headers()
            puuid = auth.puuid
            threading.Thread(target=history.refresh,
                             args=(auth, timezone_name), daemon=True,
                             name=f"rr-refresh-{str(puuid)[:8]}").start()
        except Exception:
            app.logger.exception("rr history refresh failed")
    return history.payload(puuid, timezone_name)


def _performance_payload(timezone_name: str | None = None, rich_limit: int = 20) -> dict:
    payload = _insights_payload(timezone_name)
    owner = (payload.get("account") or {}).get("puuid")
    if owner and _live_enabled():
        def enrich_recent():
            try:
                history.enrich(live_match.LiveMatch(LocalAuth()), owner, rich_limit)
            except Exception:
                app.logger.exception("performance enrichment failed")
        threading.Thread(target=enrich_recent, daemon=True,
                         name=f"perf-enrich-{str(owner)[:8]}").start()
    if owner:
        session_tracker.ensure_active(owner, payload.get("summary", {}))
    payload["sessions"] = session_tracker.list_for(owner)
    payload["matchMeta"] = match_meta.get_all(owner)
    payload["encounters"] = encounter_log.get_all(owner)
    return payload

@app.get("/api/insights")
def insights():
    return jsonify(_insights_payload(request.args.get("tz")))


@app.get("/api/performance")
def performance():
    try:
        rich_limit = int(request.args.get("richLimit", 20))
    except (TypeError, ValueError):
        rich_limit = 20
    return jsonify(_performance_payload(request.args.get("tz"), rich_limit))

def _inventory_payload() -> dict:
    if not _live_enabled():
        return {
            "available": False,
            "retryable": True,
            "error": "Live client not available.",
        }
    auth = LocalAuth()
    owner = None
    try:
        data = inventory.snapshot(auth)
        owner = getattr(auth, "puuid", None)
        return data
    except ClientNotReady:
        owner = getattr(auth, "puuid", None)
        cached = inventory.last_good(owner)
        if cached:
            return cached
        return {"available": False, "retryable": True,
                "error": "Your collection is still loading from Riot."}
    except Exception:
        app.logger.exception("inventory snapshot failed")
        cached = inventory.last_good(owner)
        if cached:
            return cached
        return {"available": False,
                "retryable": True,
                "error": "Couldn't read your collection from the Riot client."}

@app.get("/api/inventory")
def inventory_route():
    return jsonify(_inventory_payload())

@app.get("/api/encounters/<puuid>")
def encounter(puuid: str):
    return jsonify(encounter_log.get_one(_current_puuid(), puuid.strip()))


@app.put("/api/matches/<match_id>/meta")
def match_meta_update(match_id: str):
    return jsonify(match_meta.update(_current_puuid(), match_id.strip(), request.get_json(silent=True) or {}))

@app.get("/api/match/<match_id>")
def match(match_id: str):
    subject = request.args.get("subject")
    if _live_enabled():
        try:
            data = live_match.LiveMatch(LocalAuth()).match_detail(match_id, subject)
            if not data.get("error"):
                return jsonify(data)
        except Exception:
            app.logger.exception("match detail failed")
    return jsonify({"error": "Match detail requires VALORANT to be running.", "matchId": match_id}), 503

@app.get("/api/debug/reveal")
def debug_reveal():
    if not _live_enabled():
        return jsonify({"error": "Live client not available — open VALORANT."}), 400
    try:
        return jsonify(live_match.LiveMatch(LocalAuth()).diagnose_reveal())
    except Exception as e:
        app.logger.exception("debug reveal failed")
        return jsonify({"error": str(e)}), 500

@app.get("/api/profile/<puuid>")
def profile(puuid: str):
    puuid = puuid.strip()
    if not puuid:
        return jsonify({"error": "puuid required"}), 400

    now = time.time()
    cached = _CACHE.get(f"profile:{puuid}")
    if cached and now - cached[0] < _CACHE_TTL:
        return jsonify(cached[1])

    data = None
    if _live_enabled():
        try:
            data = live_match.LiveMatch(LocalAuth()).player_career(puuid)
            if not data.get("matches"):
                data = None
        except Exception:
            app.logger.exception("live profile failed")
            data = None
    if data is None:
        data = {"puuid": puuid, "matches": [], "source": "unavailable",
                "sourceDetail": "VALORANT is not running."}

    _CACHE[f"profile:{puuid}"] = (now, data)
    return jsonify(data)

@app.get("/api/player/<puuid>")
def player(puuid: str):
    puuid = puuid.strip()
    if not puuid or len(puuid) < 6:
        return jsonify({"error": "A valid PUUID (or Riot identifier) is required."}), 400

    now = time.time()
    cached = _CACHE.get(puuid)
    if cached and now - cached[0] < _CACHE_TTL:
        return jsonify(cached[1])

    try:
        payload = build_player_payload(puuid)
    except Exception as e:
        app.logger.exception("player payload failed")
        return jsonify({"error": f"Failed to build player profile: {e}"}), 500

    _CACHE[puuid] = (now, payload)
    return jsonify(payload)

@app.get("/api/region")
def region():
    detected = None
    if LocalAuth.available():
        try:
            detected = LocalAuth().shard
        except Exception:
            detected = None
    return jsonify({"detected": detected, "regions": REGIONS})

@app.get("/api/queue")
def queue_get():
    return jsonify(client.party_state())

@app.post("/api/queue")
def queue_post():
    # Queue-control actions (set_queue, start_queue, stop_queue) were removed
    # from riot_client.py as part of the pick-advisor/queue-controls removal.
    # Per AGENTS.md, queue controls UI is a postponed feature.
    return jsonify({"ok": False,
                    "message": "Queue control is not available in this version."}), 501

@app.get("/")
def index():
    return jsonify({
        "service": "OPD1 Tracker API",
        "endpoints": ["/api/health", "/api/live", "/api/profile/<puuid>", "/api/agents",
                      "/api/settings", "/api/encounters"],
    })

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", os.getenv("PORT", "5000")))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    import encounter_reconciler
    if encounter_reconciler.should_start_flask_worker(debug):
        encounter_reconciler.start()

    print(f"[app] OPD1 Tracker API on http://127.0.0.1:{port}  "
          f"(source={client.source_pref}, key={'set' if client.api_key else 'unset'})",
          flush=True)
    try:
        app.run(host="127.0.0.1", port=port, debug=debug)
    except OSError as e:
        app.logger.error("OPD1-BACKEND-001 could not bind 127.0.0.1:%s: %s", port, e)
        print(f"[app] OPD1-BACKEND-001 could not bind 127.0.0.1:{port}: {e}", flush=True)
        raise SystemExit(1)
