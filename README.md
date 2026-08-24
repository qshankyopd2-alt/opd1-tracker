# OPD1 Tracker

A Windows desktop VALORANT tracker. While VALORANT runs, OPD1 shows the live match
(both teams with rank, RR, peak, win rate, K/D, HS%, parties and smurf flags), your
competitive RR history with insights, match history with notes, saved-player notes and
encounter games, and your skin collection — all read from the local Riot client on your PC.

**Stack:** Python (Flask) backend · React + TypeScript (Vite) frontend · Tauri 2 desktop shell.

## Repository layout

```
backend/    Python data service (Riot local-client integration, Flask API)
  tests/     pytest suites (storage, live name refresh, party detection)
frontend/   React + TypeScript UI (Vite)
  src-tauri/ Tauri 2 Windows shell (spawns/kills the Python backend)
scripts/    Windows build + frozen-backend test scripts
docs/       BACKEND_CAPABILITIES.md — audited data-flow reference
```

## Prerequisites

- **Python 3.12 x64** for development/building only; installed users do not need Python
- **Node.js 20+** and **npm**
- For the desktop build: **Rust (stable)** + the [Tauri 2 Windows prerequisites](https://tauri.app/start/prerequisites/) (MSVC build tools, WebView2)
- VALORANT installed (live data only appears while the Riot client runs)

## Setup

```bash
# backend
cd backend
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy ..\.env.example .env                           # optional; defaults work

# frontend
cd ../frontend
npm install
```

## Development

Two options:

**A) One command (Tauri window, backend auto-started):**

```bash
cd frontend
npm run tauri dev
```

The Tauri shell launches `backend/desktop.py` on an available loopback port, the UI asks the
shell for its authenticated connection via the `backend_connection` IPC command, and the
backend is killed when the window closes. Set `OPD1_PYTHON` if your Python isn't simply `python`/`python3`
(e.g. point it at `backend/.venv/Scripts/python.exe`).

**B) Browser dev (no Rust needed):**

```bash
cd backend && python desktop.py          # Flask on http://127.0.0.1:5000
cd frontend && npm run dev               # Vite on http://127.0.0.1:3000
```

Set `VITE_BACKEND_URL=http://127.0.0.1:5000` in `frontend/.env` for this mode
(leave it empty when the frontend is reverse-proxied to the backend under `/api`).

## How the frontend talks to the backend

The UI only ever calls the local Flask HTTP API (`/api/health`, `/api/live`,
`/api/performance`, `/api/inventory`, …). Riot tokens/lockfile credentials never leave
the Python process. Polling is adaptive: ~4 s during agent select / matches, slower in
menus, and paused while the window is hidden. See `docs/BACKEND_CAPABILITIES.md` for the
full endpoint and data-flow reference.

When VALORANT isn't running the backend may report demo data flagged `source:"demo"`;
the UI rejects it and renders an offline state. Generated data is never presented as real.

## Tests

```bash
cd backend
python -m pytest tests/test_saved_players.py tests/test_live_name_refresh.py tests/test_live_party_detection.py tests/test_live_match_cache.py -q
```

`backend/tests/backend_test.py` is a read-only integration suite against a
*running* backend; it is driven automatically by
`scripts/test-frozen-backend.ps1` during release builds.

## Building the Windows app

```bash
powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1
```

Produces an NSIS installer under `frontend/src-tauri/target/release/bundle/nsis/`.
The installer includes a frozen Python 3.12 backend, so the target machine does not need
Python, Node.js, Rust, or pip. It uses an available `127.0.0.1` port and a new private token
for every launch. Only one OPD1 Tracker instance can run at a time. The build runs storage,
frozen-API, authentication and package-data checks before producing the installer.

The installer is unsigned unless it is built with a separate Windows code-signing setup.
Windows SmartScreen may therefore show an unknown-publisher warning when sharing it.

## Configuration (`backend/.env`)

| Key | Default | Meaning |
|---|---|---|
| `DATA_SOURCE` | `auto` | `auto` = local client when VALORANT runs; `demo` forces generated data; `local` requires the client |
| `RIOT_REGION` | `na` | shard override (`na eu ap kr latam br`) — normally auto-detected |
| `RIOT_API_KEY` | empty | optional official key; reveals hidden names via account-v1 |
| `RIOT_MAX_RPS` | `10` | global Riot request rate limit (lower it when sharing the machine with other Riot-API tools) |
| `BACKEND_PORT` | `5000` | standalone development port; Tauri passes `0` to choose an available port |
| `LIVE_INCLUDE_STATS` | `true` | set `false` to skip live K/D + HS enrichment |
| `PLAYER_CACHE_TTL` | `60` | profile/player cache TTL in seconds |
| `ALLOW_LIVE_INSTALOCK` | `true` | backend hard gate for auto-lock; its desktop UI is currently deferred |

Frontend-only (browser dev): `VITE_BACKEND_URL` / `VITE_BACKEND_TOKEN` — see
`.env.example`. The Tauri shell sets `OPD1_API_TOKEN`, `OPD1_DATA_DIR`,
`OPD1_LOG_DIR` and `OPD1_APP_VERSION` itself; do not set them manually.

Development data lives in `backend/data/`. Installed data and logs live under the current
Windows user's Tauri AppData directory (`com.opd1.tracker`). No data JSON files are bundled
in the installer, so every Windows user starts clean and builds their own cache/history.

## Notes

- `backend/server.py` is an ASGI shim used only by the cloud preview environment.
- `backend/app.py` remains runnable standalone (original entry with the hosted-site
  WebSocket bridge); the desktop app uses `backend/desktop.py`, which skips the bridge,
  telemetry and Discord RPC.
- OPD1 Tracker isn't endorsed by Riot Games. The desktop UI intentionally does not expose
  instalock, dodge, appear-offline, remote/phone mode, or queue mutation controls.
