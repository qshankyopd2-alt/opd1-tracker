import { useEffect, useReducer } from "react";
import { ApiError, backend } from "../api/client";
import type { PerformancePayload } from "../api/types";

interface Store {
  data: PerformancePayload | null;
  error: string | null;
  loading: boolean;
  at: number;
  promise: Promise<void> | null;
  /** True when displayed data comes from a previous session / failed refresh. */
  stale: boolean;
}

const CACHE_KEY = "opd1.performance.v2";
const LEGACY_CACHE_KEY = "opd1.performance.v1";
const TTL = 60_000;

const store: Store = { data: null, error: null, loading: false, at: 0, promise: null, stale: false };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Restore the last good payload from localStorage so history survives restarts. */
function hydrate(): void {
  if (store.data) return;
  try {
    localStorage.removeItem(LEGACY_CACHE_KEY);
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as {
      lastAccount?: string;
      accounts?: Record<string, { at?: number; data?: PerformancePayload | null }>;
    };
    const account = saved.lastAccount ? saved.accounts?.[saved.lastAccount] : null;
    if (account?.data && account.data.points?.length) {
      store.data = account.data;
      store.at = account.at ?? 0;
      store.stale = true;
    }
  } catch {
    /* corrupted cache — ignore */
  }
}

function persist(): void {
  if (!store.data) return;
  try {
    const account = store.data.account?.puuid;
    if (!account) return;
    const raw = localStorage.getItem(CACHE_KEY);
    const saved = raw ? JSON.parse(raw) as {
      lastAccount?: string;
      accounts?: Record<string, { at: number; data: PerformancePayload }>;
    } : {};
    const accounts = saved.accounts ?? {};
    accounts[account] = { at: Date.now(), data: store.data };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ lastAccount: account, accounts }));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

function load(force = false): Promise<void> {
  if (store.promise) return store.promise;
  if (!force && store.data && !store.stale && Date.now() - store.at < TTL) return Promise.resolve();
  store.loading = true;
  store.error = null;
  notify();
  store.promise = backend
    .performance()
    .then((data) => {
      const incomingPoints = data?.points ?? [];
      const accountUnavailable = !data?.account?.puuid;
      if (accountUnavailable && !incomingPoints.length && store.data?.points?.length) {
        // Backend couldn't resolve the live account (e.g. VALORANT closed) —
        // keep showing the last known history instead of blanking the view.
        store.stale = true;
      } else {
        store.data = data;
        store.at = Date.now();
        store.stale = false;
        persist();
      }
    })
    .catch((err) => {
      store.error = err instanceof ApiError ? err.message : "Failed to load competitive data.";
      if (store.data) store.stale = true;
    })
    .finally(() => {
      store.loading = false;
      store.promise = null;
      notify();
    });
  return store.promise;
}

/** Shared, TTL-cached /api/performance payload (used by Competitive + Match History). */
export function usePerformance() {
  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(force);
    hydrate();
    notify();
    void load();
    return () => {
      listeners.delete(force);
    };
  }, []);

  return {
    data: store.data,
    error: store.error,
    loading: store.loading && !store.data,
    stale: store.stale,
    refresh: () => void load(true),
  };
}
