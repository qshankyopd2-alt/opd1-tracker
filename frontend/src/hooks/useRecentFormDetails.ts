import { useCallback, useRef, useState } from "react";
import type { Career, CareerMatch } from "../api/types";
import { backend } from "../api/client";

export interface RecentFormDetail {
  result: "W" | "L";
  rrDelta: number | null;
  startMillis: number;
}

export type RecentDetailsByPlayer = Record<string, RecentFormDetail[]>;

export function mapRecentFormDetails(career: Career | null | undefined): RecentFormDetail[] {
  if (!career || career.source !== "local") return [];
  return career.matches
    .filter((match): match is CareerMatch & { result: "Victory" | "Defeat" } =>
      match.result === "Victory" || match.result === "Defeat")
    .slice()
    .sort((a, b) => b.startMillis - a.startMillis)
    .slice(0, 5)
    .map((match) => ({
      result: match.result === "Victory" ? "W" : "L",
      rrDelta: match.rrDelta ?? null,
      startMillis: match.startMillis,
    }));
}

/** Fetches a player's recent match metadata only when requested, with cache/in-flight dedupe. */
export function useRecentFormDetails() {
  const [recentDetailsByPlayer, setRecentDetailsByPlayer] = useState<RecentDetailsByPlayer>({});
  const cache = useRef(new Map<string, RecentFormDetail[]>());
  const inFlight = useRef(new Map<string, Promise<RecentFormDetail[]>>());

  const onRequestRecentDetails = useCallback((puuid: string) => {
    if (!puuid || cache.current.has(puuid) || inFlight.current.has(puuid)) return;
    const request = backend.profile(puuid)
      .then((career) => mapRecentFormDetails(career))
      .catch(() => [])
      .then((details) => {
        cache.current.set(puuid, details);
        setRecentDetailsByPlayer((current) => ({ ...current, [puuid]: details }));
        inFlight.current.delete(puuid);
        return details;
      });
    inFlight.current.set(puuid, request);
  }, []);

  return { recentDetailsByPlayer, onRequestRecentDetails };
}
