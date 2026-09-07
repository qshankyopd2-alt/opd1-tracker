import { useCallback, useEffect, useRef, useState } from "react";
import type { Career } from "../api/types";
import { backend } from "../api/client";

export interface RecentFormDetail {
  result: "W" | "L" | "D" | "?";
  rrDelta: number | null;
  startMillis: number;
}

export type RecentDetailsByPlayer = Record<string, RecentFormDetail[]>;

export function mapRecentFormDetails(career: Career | null | undefined): RecentFormDetail[] {
  if (!career || career.source !== "local") return [];
  return career.matches
    .slice()
    .sort((a, b) => b.startMillis - a.startMillis)
    .slice(0, 5)
    .map((match) => ({
      result: match.result === "Victory" ? "W" : match.result === "Defeat" ? "L" : match.result === "Draw" ? "D" : "?",
      rrDelta: match.rrDelta ?? null,
      startMillis: match.startMillis,
    }));
}

/** Fetches a player's recent match metadata only when requested, with cache/in-flight dedupe. */
export function useRecentFormDetails(scope = "") {
  const [recentDetailsByPlayer, setRecentDetailsByPlayer] = useState<RecentDetailsByPlayer>({});
  const cache = useRef(new Map<string, RecentFormDetail[]>());
  const inFlight = useRef(new Map<string, Promise<RecentFormDetail[]>>());
  const generation = useRef(0);
  useEffect(() => {
    generation.current += 1;
    cache.current.clear();
    inFlight.current.clear();
    setRecentDetailsByPlayer({});
    return () => { generation.current += 1; };
  }, [scope]);

  const onRequestRecentDetails = useCallback((puuid: string) => {
    if (!puuid || cache.current.has(puuid) || inFlight.current.has(puuid)) return;
    const requestedGeneration = generation.current;
    const request = backend.profile(puuid)
      .then((career) => mapRecentFormDetails(career))
      .catch(() => [])
      .then((details) => {
        if (requestedGeneration !== generation.current) return details;
        cache.current.set(puuid, details);
        setRecentDetailsByPlayer((current) => ({ ...current, [puuid]: details }));
        inFlight.current.delete(puuid);
        return details;
      });
    inFlight.current.set(puuid, request);
  }, []);

  return { recentDetailsByPlayer, onRequestRecentDetails };
}
