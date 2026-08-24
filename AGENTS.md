# OPD1 Tracker — Agent Guide

Entry point for AI agents and new developers working on this repository.
Read this first, then `docs/BACKEND_CAPABILITIES.md` (the audited API/data
contract).

## What this is

A Windows desktop VALORANT tracker: Tauri 2 shell + React 18 / TypeScript /
Vite / Tailwind frontend, wrapping a Flask backend that was copied **verbatim**
from the proven Valorant-Scout reference implementation.

## Non-negotiable rules

1. **Treat Riot communication as sensitive, tiered code.**
   - `backend/riot_client.py` — FROZEN: lockfile discovery, entitlements/token
     handling, headers, PD/GLZ endpoints, rate limiting, retry behavior.
     Changes risk breaking auth or triggering rate limits/account issues.
   - `backend/live_match.py` — MAINTAINED but conservative: live scoreboard,
     party detection (with per-team coverage metadata), name refresh retry,
     KD/HS sampling. You may change grouping/parsing/caching logic, but keep
     request patterns and throttling behavior unchanged, and add/adjust tests
     in `backend/tests/` for any behavior change.
   - Request/fetch behavior inside `backend/history.py` (`refresh`, `enrich`)
     — treat as frozen reference code.
2. **Real data only.** Backend demo payloads are marked `source:"demo"` /
   `demo:true`. The UI must gate rendering on `source === "local"` (see
   `LiveDataContext.showBoard`) and must never present generated data as real.
3. **No features beyond existing backend capabilities.** The endpoint list in
   `docs/BACKEND_CAPABILITIES.md` is the contract. Do not invent endpoints or
   request new data from Riot.
4. **Postponed features — do not build without owner approval:** queue
   controls UI, dodge button UI, per-map instalock overrides UI, encounter
   timeline drill-down.
5. **Region stays automatic.** Region is detected from `ShooterGame.log`; do
   not add region pickers or hard-coded regions.

## Layout

| Path | Purpose |
|---|---|
| `backend/app.py` | Flask API (all `/api/*` routes) |
| `backend/desktop.py` | Desktop entry point used by the Tauri shell |
| `backend/live_match.py` | Live scoreboard, party detection, career/profile |
| `backend/riot_client.py` | Frozen Riot local-client transport (do not edit) |
| `backend/tests/` | pytest suites (run from `backend/`) |
| `frontend/src/views/` | Seven views: live, competitive, history, encounters, collection, ascii, settings |
| `frontend/src/api/client.ts` | Single fetch client (GET dedup, timeouts, Tauri URL resolution) |
| `frontend/src/hooks/usePerformance.ts` | Shared TTL-cached `/api/performance` store (Competitive + History) |
| `frontend/src/state/AppContext.tsx` | View switching and health polling |
| `frontend/src/api/types.ts` | Typed backend contracts |
| `frontend/src-tauri/src/main.rs` | Backend process lifecycle + IPC (`backend_connection`) |
| `frontend/src-tauri/tauri.conf.json` | Window, CSP, bundle/resources config |
| `scripts/build-windows.ps1` | Full release: frozen backend → tests → NSIS installer |
| `design_guidelines.json` | UI design tokens (colors, typography) |
| `VERSION` | Release version (kept in sync with tauri.conf.json / Cargo.toml / package.json) |

## Generated directories — never edit or commit

`frontend/node_modules/`, `frontend/dist/`, `frontend/src-tauri/target/`,
`frontend/src-tauri/gen/`, `frontend/src-tauri/binaries/` (PyInstaller output),
`frontend/src-tauri/resources/`, `.build/` (build venv), `backend/data/`
(user data), `.scout/` (local runtime state), `__pycache__/`, `.pytest_cache/`.

## Commands

```bash
# frontend
cd frontend
npm install
npm run dev        # Vite dev server (expects backend on 127.0.0.1:5000)
npm run build      # tsc --noEmit && vite build — must pass before delivery
npm run typecheck  # tsc --noEmit only
npm run tauri dev  # full desktop shell (Windows + Rust toolchain required)

# backend (from backend/)
python -m pytest tests/test_saved_players.py tests/test_live_name_refresh.py tests/test_live_party_detection.py tests/test_live_match_cache.py -q

# full Windows release (backend freeze + tests + NSIS installer)
powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1
```

Backend standalone: `python backend/desktop.py` (live data requires VALORANT /
Riot Client running on the same machine).

## Conventions

- TypeScript strict mode; no `any`.
- Polling goes through `usePoll`; shared server caches through module-level
  stores (pattern: `hooks/usePerformance.ts`).
- Interactive elements carry `data-testid` attributes.
- Keep edits minimal and focused; match surrounding code style.

## Verify before committing

1. `cd frontend && npm run build` (TypeScript + Vite must pass).
2. Backend changes: run the pytest suites listed above from `backend/`.
3. Rust changes: `cargo check` (and `cargo clippy --all-targets -- -D warnings`)
   from `frontend/src-tauri/`.
4. Release-facing changes: run `scripts/build-windows.ps1` end to end.
