// Dev-only design-mode switchboard.
//
// Replaces the HTTP backend client with synthetic fixtures when:
//   import.meta.env.DEV && import.meta.env.VITE_DESIGN_MODE === "true"
//
// Production builds never enable VITE_DESIGN_MODE, and this module is tree-shaken
// out (the import.meta.env.DEV branch evaluates to false). The LiveDataContext
// still gates rendering on `source === "local"`, so the dev harness cannot
// accidentally present fixtures as Riot data in a production build.

import type { Health } from "../api/types";
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
      setDesignSnapshot(makeSnapshot("OFFLINE", 1));
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
      setDesignError(null);
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

export async function designApi<T>(kind: string): Promise<T> {
  await sleep(80 + Math.random() * 60);
  if (errorOverride) throw new Error(errorOverride.error);
  const snap = snapshot;
  switch (kind) {
    case "health":
      return (healthOverride ?? snap.health) as unknown as T;
    case "state":
      return { state: snap.board.state, stateLabel: snap.board.stateLabel, source: "local" } as unknown as T;
    case "live":
      return snap.board as unknown as T;
    case "performance":
      return snap.performance as unknown as T;
    case "savedPlayers":
      return snap.savedPlayers as unknown as T;
    case "inventory":
      return snap.inventory as unknown as T;
    case "profile":
      return snap.career as unknown as T;
    case "match":
      return snap.matchDetail as unknown as T;
    default:
      throw new Error(`Unknown design api kind: ${kind}`);
  }
}

export type { PreviewSnapshot };
