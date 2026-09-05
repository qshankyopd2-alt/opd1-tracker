import { describe, expect, it } from "vitest";
import type { Career, CareerMatch } from "../../api/types";
import { mapRecentFormDetails } from "../useRecentFormDetails";

function match(matchId: string, startMillis: number, result: CareerMatch["result"], rrDelta: number | null): CareerMatch {
  return {
    matchId,
    map: "Bind",
    mapSplash: null,
    mode: "Competitive",
    startMillis,
    result,
    score: 13,
    opponentScore: 9,
    agent: "Jett",
    agentPortrait: null,
    agentColor: "#10B981",
    kills: 20,
    deaths: 12,
    assists: 4,
    kd: 1.67,
    acs: 240,
    hsPct: 28,
    partySize: 1,
    teammates: [],
    rrDelta,
  };
}

function career(source: string, matches: CareerMatch[]): Career {
  return {
    source,
    puuid: "player",
    matches,
    averages: { games: 0, wins: 0, winRate: 0, kills: 0, deaths: 0, assists: 0, kd: 0, hsPct: null },
    coPlayers: [],
    agentPool: [],
    mapStats: [],
  };
}

describe("mapRecentFormDetails", () => {
  it("sorts newest-first, excludes draws, and keeps real RR and time", () => {
    const details = mapRecentFormDetails(career("local", [
      match("older", 1_000, "Defeat", -18),
      match("draw", 4_000, "Draw", 0),
      match("newest", 5_000, "Victory", 22),
    ]));

    expect(details).toEqual([
      { result: "W", rrDelta: 22, startMillis: 5_000 },
      { result: "L", rrDelta: -18, startMillis: 1_000 },
    ]);
  });

  it("rejects non-local career payloads", () => {
    expect(mapRecentFormDetails(career("demo", [match("demo", 5_000, "Victory", 25)]))).toEqual([]);
  });

  it("limits the result to five matches", () => {
    const matches = Array.from({ length: 7 }, (_, index) => match(`${index}`, index, index % 2 ? "Defeat" : "Victory", index));
    expect(mapRecentFormDetails(career("local", matches))).toHaveLength(5);
  });
});
