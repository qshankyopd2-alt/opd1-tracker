import type {
  ActionResult,
  Career,
  EncounterRow,
  Health,
  Inventory,
  LiveBoard,
  MatchDetail,
  MatchMeta,
  PerformancePayload,
  SavedPlayer,
  SavedPlayersPayload,
  SessionView,
  StateInfo,
} from "./types";
import { designApi, designConnection, isDesignMode } from "../dev/designMode";

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

interface BackendConnection {
  url: string;
  token: string;
  version: string;
}

let connectionPromise: Promise<BackendConnection> | null = null;

async function resolveConnection(): Promise<BackendConnection> {
  if (isDesignMode()) {
    return designConnection();
  }
  if ("__TAURI_INTERNALS__" in window) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<BackendConnection>("backend_connection");
  }
  return {
    url: (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "",
    token: (import.meta.env.VITE_BACKEND_TOKEN as string | undefined) ?? "",
    version: "dev",
  };
}

export function apiBase(): Promise<string> {
  connectionPromise ??= resolveConnection();
  return connectionPromise.then((connection) => connection.url);
}

const inflight = new Map<string, Promise<unknown>>();

async function api<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const method = init?.method ?? "GET";
  const key = method === "GET" ? path : null;
  const pending = key ? inflight.get(key) : undefined;
  if (pending) return pending as Promise<T>;

  const run = (async () => {
    if (isDesignMode()) {
      try {
        const kind = pathToKind(path);
        if (kind) return await designApi<T>(kind);
        throw new ApiError(`Design harness has no mapping for ${path}.`);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(err instanceof Error ? err.message : "Design harness error.");
      } finally {
        if (key) inflight.delete(key);
      }
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 20000);
    try {
      connectionPromise ??= resolveConnection();
      const connection = await connectionPromise;
      const headers = new Headers(init?.headers);
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      if (connection.token) headers.set("X-OPD1-Token", connection.token);
      const res = await fetch(connection.url + path, {
        ...init,
        signal: ctrl.signal,
        headers,
      });
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (!res.ok) {
        const b = body as { error?: string; message?: string } | null;
        throw new ApiError(b?.error ?? b?.message ?? `Request failed (${res.status})`, res.status);
      }
      return body as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const aborted = err instanceof DOMException && err.name === "AbortError";
      throw new ApiError(aborted ? "Request timed out." : "Backend unreachable.");
    } finally {
      clearTimeout(timer);
      if (key) inflight.delete(key);
    }
  })();

  if (key) inflight.set(key, run);
  return run;
}

function pathToKind(path: string): string | null {
  if (path === "/api/health") return "health";
  if (path === "/api/state") return "state";
  if (path.startsWith("/api/live")) return "live";
  if (path.startsWith("/api/performance") || path.startsWith("/api/insights")) return "performance";
  if (path.startsWith("/api/saved-players")) return "savedPlayers";
  if (path.startsWith("/api/inventory")) return "inventory";
  if (path.startsWith("/api/profile/")) return "profile";
  if (path.startsWith("/api/match/")) return "match";
  return null;
}

const tz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
};

export const backend = {
  health: () => api<Health>("/api/health", { timeoutMs: 6000 }),
  state: () => api<StateInfo>("/api/state", { timeoutMs: 8000 }),
  live: (seed?: number, state?: string) => {
    const q = new URLSearchParams();
    if (seed !== undefined) q.set("seed", String(seed));
    if (state) q.set("state", state);
    const qs = q.toString();
    return api<LiveBoard>(`/api/live${qs ? `?${qs}` : ""}`, { timeoutMs: 30000 });
  },
  performance: (richLimit = 20) =>
    api<PerformancePayload>(`/api/performance?tz=${encodeURIComponent(tz())}&richLimit=${richLimit}`, {
      timeoutMs: 30000,
    }),
  encounters: (scope: "current" | "all") =>
    api<{ players: EncounterRow[]; accountCount: number; scope: string }>(`/api/encounters?scope=${scope}`),
  savedPlayers: () => api<SavedPlayersPayload>("/api/saved-players"),
  updateSavedPlayer: (puuid: string, body: { accountPuuid: string; saved: boolean; note: string }) =>
    api<{ ok: boolean; saved: boolean; player?: SavedPlayer | null }>(`/api/saved-players/${encodeURIComponent(puuid)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  inventory: () => api<Inventory>("/api/inventory", { timeoutMs: 30000 }),
  profile: (puuid: string) => api<Career>(`/api/profile/${encodeURIComponent(puuid)}`, { timeoutMs: 30000 }),
  match: (matchId: string, subject?: string | null) =>
    api<MatchDetail>(
      `/api/match/${encodeURIComponent(matchId)}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`,
      { timeoutMs: 30000 },
    ),
  sessionStart: () => api<ActionResult & { session?: SessionView }>("/api/session/start", { method: "POST", body: "{}" }),
  sessionEnd: () => api<ActionResult & { session?: SessionView }>("/api/session/end", { method: "POST", body: "{}" }),
  updateMatchMeta: (matchId: string, meta: Partial<MatchMeta>) =>
    api<{ ok: boolean; meta: MatchMeta }>(`/api/matches/${encodeURIComponent(matchId)}/meta`, {
      method: "PUT",
      body: JSON.stringify(meta),
    }),
};
