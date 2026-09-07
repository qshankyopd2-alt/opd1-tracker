// Dev-only design-mode switchboard.
//
// Replaces the HTTP backend client with synthetic fixtures when:
//   import.meta.env.DEV && import.meta.env.VITE_DESIGN_MODE === "true"
//
// Production builds never enable VITE_DESIGN_MODE, and this module is tree-shaken
// out (the import.meta.env.DEV branch evaluates to false). The LiveDataContext
// still gates rendering on `source === "local"`, so the dev harness cannot
// accidentally present fixtures as Riot data in a production build.

import type { Health, MatchMeta } from "../api/types";
import { makeSnapshot, type PreviewSnapshot } from "./previewFixtures";

export interface BackendConnection {
  url: string;
  token: string;
  version: string;
}

export type PreviewViewId =
  | "live-pregame"
  | "live-ingame"
  | "live-menus"
  | "live-offline"
  | "live-drawer"
  | "competitive"
  | "competitive-empty"
  | "history"
  | "history-empty"
  | "saved"
  | "saved-empty"
  | "collection"
  | "collection-unavailable"
  | "ascii"
  | "settings"
  | "error";

export const PREVIEW_VIEWS: { id: PreviewViewId; label: string; group: string }[] = [
  { id: "live-pregame", label: "Live · PREGAME (own team only)", group: "Live" },
  { id: "live-ingame", label: "Live · INGAME (both teams)", group: "Live" },
  { id: "live-menus", label: "Live · MENUS (lobby)", group: "Live" },
  { id: "live-offline", label: "Live · OFFLINE", group: "Live" },
  { id: "live-drawer", label: "Live · Player Drawer open", group: "Live" },
  { id: "competitive", label: "Competitive", group: "Views" },
  { id: "competitive-empty", label: "Competitive · empty", group: "Views" },
  { id: "history", label: "Match History", group: "Views" },
  { id: "history-empty", label: "Match History · empty", group: "Views" },
  { id: "saved", label: "Saved Players", group: "Views" },
  { id: "saved-empty", label: "Saved Players · empty", group: "Views" },
  { id: "collection", label: "Collection", group: "Views" },
  { id: "collection-unavailable", label: "Collection · unavailable", group: "Views" },
  { id: "ascii", label: "ASCII Studio", group: "Tools" },
  { id: "settings", label: "Settings", group: "Tools" },
  { id: "error", label: "Error state (backend down)", group: "States" },
];

export const isDesignMode = (): boolean => {
  if (typeof import.meta === "undefined") return false;
  if (!import.meta.env?.DEV) return false;
  return import.meta.env.VITE_DESIGN_MODE === "true";
};

let snapshot: PreviewSnapshot = makeSnapshot("INGAME", 1);
let healthOverride: Health | null = null;
let errorOverride: { error: string } | null = null;

export function setDesignSnapshot(next: PreviewSnapshot): void {
  snapshot = next;
}

export function setDesignHealth(next: Health | null): void {
  healthOverride = next;
}

export function setDesignError(next: { error: string } | null): void {
  errorOverride = next;
}

export function applyDesignView(view: PreviewViewId): void {
  setDesignError(null);
  switch (view) {
    case "live-pregame":
      setDesignSnapshot(makeSnapshot("PREGAME", 1));
      break;
    case "live-ingame":
      setDesignSnapshot(makeSnapshot("INGAME", 1));
      break;
    case "live-menus":
      setDesignSnapshot(makeSnapshot("MENUS", 1));
      break;
    case "live-offline":
      {
        const offline = makeSnapshot("OFFLINE", 1);
        setDesignSnapshot({ ...offline, board: { ...offline.board, source: "local" } });
      }
      break;
    case "live-drawer": {
      const ingame = makeSnapshot("INGAME", 1);
      setDesignSnapshot(ingame);
      break;
    }
    case "error": {
      setDesignSnapshot(makeSnapshot("INGAME", 1));
      setDesignError({ error: "Backend unreachable." });
      break;
    }
    case "competitive-empty": {
      const snap = makeSnapshot("OFFLINE", 1);
      setDesignSnapshot({ ...snap, performance: { ...snap.performance, points: [], summary: { ...snap.performance.summary, matches: 0, wins: 0, losses: 0, winRate: null, net: 0, avgWin: null, avgLoss: null, current: { ...RANK(0), rr: 0, tier: 0 }, next: null, exactResults: 0 }, insights: [] } });
      break;
    }
    case "history-empty": {
      const snap = makeSnapshot("OFFLINE", 1);
      setDesignSnapshot({ ...snap, performance: { ...snap.performance, points: [], matchMeta: {} } });
      break;
    }
    case "saved-empty": {
      const snap = makeSnapshot("OFFLINE", 1);
      setDesignSnapshot({ ...snap, savedPlayers: { accountPuuid: "preview-self", players: [] } });
      break;
    }
    case "collection-unavailable": {
      const snap = makeSnapshot("OFFLINE", 1);
      setDesignSnapshot({ ...snap, inventory: { available: false, retryable: true, error: "VALORANT not running" } });
      break;
    }
    case "competitive":
    case "history":
    case "saved":
    case "collection":
    case "ascii":
    case "settings":
      setDesignSnapshot(makeSnapshot("INGAME", 1));
      break;
  }
}

function RANK(tier: number) {
  const groups = [
    { name: "Unranked", color: "#4A4A4A", count: 3 },
    { name: "Iron", color: "#5A5751", count: 3 },
    { name: "Bronze", color: "#BB8F5A", count: 3 },
    { name: "Silver", color: "#AEB2B2", count: 3 },
    { name: "Gold", color: "#C5BA3F", count: 3 },
    { name: "Platinum", color: "#18A7B9", count: 3 },
    { name: "Diamond", color: "#D864C7", count: 3 },
    { name: "Ascendant", color: "#189452", count: 3 },
    { name: "Immortal", color: "#DD4444", count: 3 },
    { name: "Radiant", color: "#FFFDCD", count: 1 },
  ];
  let acc = 0;
  for (const g of groups) {
    if (tier < acc + g.count) {
      const i = tier - acc + 1;
      const name = g.name === "Unranked" || g.name === "Radiant" ? g.name : `${g.name} ${i}`;
      return { tier, name, color: g.color, group: g.name };
    }
    acc += g.count;
  }
  return { tier: 27, name: "Radiant", color: "#FFFDCD", group: "Radiant" };
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function designConnection(): BackendConnection {
  return { url: "design://preview", token: "", version: "design" };
}

export async function designApi<T>(kind: string, path: string, init?: RequestInit): Promise<T> {
  await sleep(80 + Math.random() * 60);
  if (errorOverride) throw new Error(errorOverride.error);
  const snap = snapshot;
  switch (kind) {
    case "matchMeta": {
      const matchId = decodeURIComponent(path.split("/")[3]);
      if (init?.method !== "PUT" || typeof init.body !== "string") throw new Error("Invalid preview save request.");
      const body = JSON.parse(init.body) as Partial<MatchMeta>;
      const meta: MatchMeta = {
        note: (body.note ?? "").trim().slice(0, 500),
        tags: (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
        bookmarked: Boolean(body.bookmarked),
        updatedAt: Date.now(),
      };
      snap.performance.matchMeta = { ...snap.performance.matchMeta, [matchId]: meta };
      return { ok: true, meta } as T;
    }
    case "health":
      return (healthOverride ?? snap.health) as unknown as T;
    case "state":
      return { state: snap.board.state, stateLabel: snap.board.stateLabel, source: "local" } as unknown as T;
    case "live":
      return snap.board as unknown as T;
    case "performance":
      return snap.performance as unknown as T;
    case "savedPlayers": {
      if (init?.method === "PUT") {
        const body = JSON.parse(String(init.body)) as { accountPuuid: string; saved: boolean; note: string };
        if (body.accountPuuid !== snap.savedPlayers.accountPuuid) throw new Error("Active account changed.");
        if (typeof body.note !== "string" || body.note.length > 500 || typeof body.saved !== "boolean") throw new Error("Invalid player note.");
        const puuid = decodeURIComponent(path.split("/")[3]);
        const player = snap.board.players.find((candidate) => candidate.puuid === puuid);
        if (!player) throw new Error("Player not observed in this preview.");
        const saved = { ...player, saved: true as const, note: body.note.trim(), savedAt: Date.now() / 1000, updatedAt: Date.now() / 1000 };
        snap.savedPlayers.players = snap.savedPlayers.players.filter((candidate) => candidate.puuid !== puuid);
        if (body.saved) snap.savedPlayers.players.push(saved);
        player.saved = body.saved;
        player.savedNote = body.saved ? saved.note : "";
        return { ok: true, saved: body.saved, player: body.saved ? saved : null } as T;
      }
      return snap.savedPlayers as unknown as T;
    }
    case "inventory":
      return snap.inventory as unknown as T;
    case "profile":
      return snap.career as unknown as T;
    case "match": {
      const url = new URL(path, "http://localhost");
      const matchId = url.pathname.split("/")[3]?.split("?")[0] || "preview-match-1";
      const requestedSubject = url.searchParams.get("subject");
      const matchInCareer = snap.career.matches.find((m) => m.matchId === matchId) || snap.performance.points.find((p) => p.matchId === matchId);
      const md = structuredClone(snap.matchDetail);
      md.matchId = matchId;

      if (matchInCareer) {
        md.map = matchInCareer.map || md.map;
        md.mapSplash = matchInCareer.mapSplash || md.mapSplash;
        md.mode = ("mode" in matchInCareer && matchInCareer.mode) || md.mode || "Competitive";
        const result = matchInCareer.result || "Unresolved";
        md.result = result;

        if ("scores" in matchInCareer && matchInCareer.scores && Object.keys(matchInCareer.scores).length > 0) {
          md.scores = { ...matchInCareer.scores };
        } else if (result === "Victory") {
          md.scores = { Blue: 13, Red: 9 };
        } else if (result === "Defeat") {
          md.scores = { Blue: 9, Red: 13 };
        } else if (result === "Draw") {
          md.scores = { Blue: 12, Red: 12 };
        } else {
          md.scores = {};
        }

        const targetSubjectPuuid = requestedSubject || snap.board.selfPuuid || "preview-self";
        const targetBoardPlayer = snap.board.players.find((p) => p.puuid === targetSubjectPuuid);

        const existingSubjectIndex = md.players.findIndex((p) => p.puuid === targetSubjectPuuid);
        const subjectIndex = existingSubjectIndex >= 0 ? existingSubjectIndex : Math.max(0, md.players.findIndex((p) => p.isSubject));
        md.players = md.players.map((p, idx) => {
          if (idx === subjectIndex) {
            const kills = matchInCareer.kills ?? p.kills;
            const deaths = matchInCareer.deaths ?? p.deaths;
            const assists = matchInCareer.assists ?? p.assists;
            const acs = matchInCareer.acs ?? p.acs;
            const kd = deaths > 0 ? +(kills / deaths).toFixed(2) : kills;

            return {
              ...p,
              puuid: targetSubjectPuuid,
              name: targetBoardPlayer?.name ?? p.name,
              isSubject: true,
              agent: matchInCareer.agent || (targetBoardPlayer?.agent ?? p.agent),
              agentPortrait: matchInCareer.agentPortrait || (targetBoardPlayer?.agentPortrait ?? p.agentPortrait),
              agentColor: matchInCareer.agentColor || (targetBoardPlayer?.agentColor ?? p.agentColor),
              kills,
              deaths,
              assists,
              kd,
              acs,
              hsPct: matchInCareer.hsPct ?? p.hsPct,
            };
          }
          return {
            ...p,
            isSubject: false,
          };
        });

        // Fixture scores are generated from Blue's perspective; the result belongs to the requested player.
        if (md.players[subjectIndex]?.team === "Red" && md.scores.Blue !== undefined && md.scores.Red !== undefined) {
          md.scores = { ...md.scores, Blue: md.scores.Red, Red: md.scores.Blue };
        }

        // Recalculate MVP using ACS after override
        let maxAcs = -1;
        let maxAcsPlayerId: string | null = null;
        const teamMaxAcs: Record<string, { id: string; acs: number }> = {};

        for (const player of md.players) {
          if (player.acs > maxAcs) {
            maxAcs = player.acs;
            maxAcsPlayerId = player.puuid;
          }
          const currentTeamMax = teamMaxAcs[player.team];
          if (!currentTeamMax || player.acs > currentTeamMax.acs) {
            teamMaxAcs[player.team] = { id: player.puuid, acs: player.acs };
          }
        }

        md.players = md.players.map((player) => ({
          ...player,
          isMatchMvp: player.puuid === maxAcsPlayerId,
          isTeamMvp: player.puuid === teamMaxAcs[player.team]?.id,
        }));
      }
      return md as unknown as T;
    }
    default:
      throw new Error(`Unknown design api kind: ${kind}`);
  }
}

export type { PreviewSnapshot };
