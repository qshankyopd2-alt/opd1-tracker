# OPD1 Tracker — Backend Capability Reference

Audited from `backend/`. This documents what the Python backend actually does and the
HTTP interface the desktop UI consumes. Format for key data:
`Source → Request → Authentication → Response → Processing → Frontend-ready value`.

## Authentication chain (local Riot client)

`riot_client.LocalAuth`:

1. **Lockfile** — `%LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile` → `{name, PID, port, password, protocol}`. `LocalAuth.available()` = VALORANT/Riot client running.
2. **Entitlements** — `GET https://127.0.0.1:{port}/entitlements/v1/token` with `Basic riot:{password}` → `{subject (self PUUID), accessToken, token}`. Not ready → `ClientNotReady`.
3. **Headers** for pd/glz/shared endpoints: `Authorization: Bearer {accessToken}`, `X-Riot-Entitlements-JWT`, `X-Riot-ClientPlatform` (fixed base64), `X-Riot-ClientVersion` (from local presence → valorant-api.com/v1/version → ShooterGame.log).
4. **Region/shard** — explicit `RIOT_REGION` or parsed from `ShooterGame.log`. Builds `pd.{shard}.a.pvp.net` and `glz-{r0}.{r1}.a.pvp.net` base URLs.
5. **Rate limiting** — token buckets (`RIOT_MAX_RPS`, separate 0.4 rps bucket for `/mmr/*`), `Retry-After` holds on 429.

Tokens never leave the backend; Flask responses contain processed data only.

## Game-state detection

Local chat presences (`GET 127.0.0.1:{port}/chat/v4/presences`, Basic auth) → self presence
`private` field base64-decoded → `sessionLoopState`: `MENUS | PREGAME | INGAME`.
Exposed via `GET /api/state` and as `board.state` on `/api/live`.

## Live scoreboard (`live_match.LiveMatch.build_scoreboard`)

| State | Player source |
|---|---|
| INGAME | `glz /core-game/v1/players/{puuid}` → MatchID → `glz /core-game/v1/matches/{mid}` (both teams, 10 players, MapID, QueueID) |
| PREGAME | `glz /pregame/v1/players/{puuid}` → `glz /pregame/v1/matches/{mid}` (ally team only + `CharacterSelectionState`) |
| MENUS | party members from chat presences (lobby board) |

Per player enrichment (parallel, cached per match):
- **Names**: `pd PUT /name-service/v2/players` (batch, retried per-player); fallback official `account-v1` if `RIOT_API_KEY` set; fallback agent name/`Player N`.
- **Rank/RR/peak/WR**: `pd /mmr/v1/players/{puuid}` → `QueueSkills.competitive.SeasonalInfoBySeasonID`; current act from `shared /content-service/v3/content` (1h cache); peak scans `WinsByTier` across acts (+3 tier shift for pre-Ascendant acts); leaderboard rank; win rate = wins/games of current act.
- **K/D, HS%, form, top agents, map W/L**: `pd /match-history/v1/history/{puuid}` (queue fallback competitive→unrated→swiftplay→any) → last 3–5 `pd /match-details/v1/matches/{mid}`; headshot% from `roundResults[].playerStats[].damage[]`. Filled asynchronously (`_spawn_kd_fill`) — values arrive on later polls.
- **RR earned last game**: `pd /mmr/v1/players/{puuid}/competitiveupdates?queue=competitive`.
- **Level**: match presence `PlayerIdentity.AccountLevel`; if hidden/0 → recovered from latest match details.
- **Loadouts / skins**: `glz /core-game/v1/matches/{mid}/loadouts` (or pregame) → socket `bcef87d6-…` skin ids → names/icons via valorant-api.com `weapons/skins` (module cache).
- **Parties**: best-effort live grouping from visible presence `partyId`+`partySize`, with per-team coverage metadata and colored badges (`vconstants.PARTY_COLORS`). Riot exposes authoritative `players[].partyId` only in completed match details; live enemy parties can remain unknown when their presence data is hidden.
- **Smurf flags** (`compute_smurf`): low level vs peak tier / K/D / win-rate heuristics with human-readable reasons.
- **Cosmetics**: player card art + title text via valorant-api.com.
- **Score**: self presence `partyOwnerMatchScoreAllyTeam/EnemyTeam` (null for DM/TDM round display).

`finalize()` sorts (ally first, rank desc), groups `teams`, computes `teamStats`
(avg rank/KD/WR, smurf count) and a heuristic `winProb` (rank + KD deltas, clamped 5–95).
Board caches: 3.5 s build freshness, 90 s hold for INGAME payload gaps, 20 s lobby cache.

## HTTP interface consumed by the desktop UI

| Endpoint | Data |
|---|---|
| `GET /api/health` | service ok, appVersion, `clientStatus: ok\|not_running`, data-source preference, official key present, live-instalock flag |
| `GET /api/state` | `MENUS\|PREGAME\|INGAME\|OFFLINE` + label |
| `GET /api/live?seed&state` | full board (above) + `queue`, `session`, `recap` (after a match), `notice`, `encounter`, `saved`, and `savedNote` per player. Falls back to deterministic demo board (`source:"demo"`) when the client isn't running |
| `GET /api/profile/{puuid}` | career: last 8 matches (`pd match-history` + details), averages, agent pool, map stats, co-players, per-match RR deltas (60 s server cache) |
| `GET /api/match/{id}?subject=` | full 10-player scoreboard: KDA/ACS/HS%, ranks (mmr), MVP flags, team avg ranks |
| `GET /api/performance?tz=` | persisted competitive history (`data/rr_history.json`): points (RR delta/tier/rr per match, enriched with KDA/ACS/HS% via match details), summary (current rank, next-rank progress), map/agent/schedule splits, automated insights, milestones, act comparison, sessions, matchMeta, encounters. Triggers async backfill (`/mmr competitiveupdates`, 10 min TTL) + enrichment |
| `GET /api/insights?tz=` | same payload without enrichment kick |
| `GET /api/encounters?scope=` | players met before (`data/encounters.json`): with/against counts, W/L records both sides, rank/peak/KD/WR/level, teammate-stat aggregates, timeline |
| `GET /api/saved-players` | account-scoped local watchlist built from the encounter store; includes note, counters, and encounter-game timeline; makes no Riot request |
| `PUT /api/saved-players/{puuid}` | save/edit/remove a player note already observed in Live Match; makes no Riot request |
| `GET /api/inventory` | owned skins (`pd /store/v1/entitlements/{puuid}/{type}`) priced via valorant-api content tiers → total VP + ≈USD, wallet (`pd /store/v1/wallet`: VP/RAD/KC), counts (buddies/cards/sprays/agents), tier breakdown, top/recent skins. 10 min cache, stale-cache fallback |
| `GET/POST /api/settings` | persisted UI settings (`data/settings.json`): region, agent, mode, delay, dryRun, perMap, autoRefresh |
| `GET /api/region` | detected shard + region list |
| `GET /api/agents` | agent roster (uuid, role, color, portraits) |
| `POST /api/instalock/start\|stop`, `GET /api/instalock/status` | agent auto-lock worker (dry-run by default; live gated by `ALLOW_LIVE_INSTALOCK`) |
| `POST /api/dodge` | quit pregame (dry-run default) |
| `GET/POST /api/queue` | party/queue snapshot + select/start/stop (glz parties API) |
| `GET /api/recap` | last finished match recap (detected on INGAME→MENUS transition) |
| `GET/POST/DELETE /api/session*` | session tracker (net RR per sitting, archive) |
| `PUT /api/matches/{id}/meta` | per-match note/tags/bookmark (`data/match_meta.json`) |

## Data availability matrix

- **Only while in a match**: loadouts/skins, enemy identities, selection state, score, side, lock progress.
- **Anytime the client runs**: lobby party board, rank/career/history for any PUUID, inventory, queue state.
- **Persisted across restarts**: rr_history, encounters/saved players, sessions, match_meta, settings. Source development uses `backend/data/`; installed builds use per-user AppData and ship without data files.
- **Demo fallback**: when VALORANT isn't running (or `DATA_SOURCE=demo`) `/api/live`, `/api/match`, `/api/profile`, `/api/recap`, `/api/encounters(demo)` return deterministic generated data marked `source:"demo"` / `demo:true`. The desktop UI rejects demo payloads and renders an offline state.
- **Unsupported / not exposed**: official val-match-v1 without a production key (403 handled), name reveal for Incognito players without `RIOT_API_KEY`, per-round timelines (fetched but only aggregated).

## Asset sources

All imagery via `https://media.valorant-api.com` (+ metadata `https://valorant-api.com/v1/*`,
module-level cached): agent portraits, rank tier icons, map splashes, weapon/skin renders,
player cards, titles, seasons. Agent uuid/role/color table lives in `backend/agents.py`.

## Peripheral modules not used by OPD1 Tracker

`ws_server.py`/`scout_commands.py`/`remote_ably.py` (hosted-site bridge + phone mode),
`discord_presence.py` (Discord RPC for the original product), `sync.py` (telemetry to
valorantscout.com), `offline_launch.py` (Deceive-style offline masking). They remain
functional behind the original `python app.py` entry; `desktop.py` deliberately does not
start them.
