import { describe, expect, it } from "vitest";
import { RANKS } from "../../lib/ranks";
import { makeSnapshot } from "../previewFixtures";

describe("design preview fixtures", () => {
  it("fully populates the normal in-game review state", () => {
    const snapshot = makeSnapshot("INGAME", 1);

    expect(snapshot.board.source).toBe("local");
    expect(snapshot.board.players).toHaveLength(10);
    for (const player of snapshot.board.players) {
      expect(player.agentPortrait).toBeTruthy();
      expect(player.agentArt).toBeTruthy();
      expect(player.playerCard).toBeTruthy();
      expect(player.rankIcon).toBeTruthy();
      expect(player.peakIcon).toBeTruthy();
      expect(player.peakRankTier).toBeGreaterThanOrEqual(player.rankTier);
      expect(player.peakRankTier).toBeGreaterThanOrEqual(
        RANKS.find((rank) => rank.name === player.previousRank)?.tier ?? 0,
      );
      expect(player.rr).toBeGreaterThan(0);
      expect(player.kd).not.toBeNull();
      expect(player.hsPct).not.toBeNull();
      expect(player.winRate).not.toBeNull();
      expect(player.form).toHaveLength(5);
      expect(player.form.every((result) => result === "W" || result === "L")).toBe(true);
      expect(player.weapons).toHaveLength(4);
      expect(player.weapons.map((weapon) => weapon.weapon)).toEqual(["Vandal", "Phantom", "Operator", "Melee"]);
      for (const weapon of player.weapons) expect(weapon.skin?.icon).toBeTruthy();
      if (player.encounter) {
        expect(player.encounter.withCount).toBe(
          player.encounter.winsWith + player.encounter.lossesWith
          + (player.encounter.drawsWith ?? 0) + (player.encounter.pendingWith ?? 0),
        );
        expect(player.encounter.againstCount).toBe(
          player.encounter.winsAgainst + player.encounter.lossesAgainst
          + (player.encounter.drawsAgainst ?? 0) + (player.encounter.pendingAgainst ?? 0),
        );
      }
    }

    expect(snapshot.board.players.some((player) => player.name.length > 30 && player.party)).toBe(true);
    expect(snapshot.board.players.some((player) => player.smurf)).toBe(true);
    expect(snapshot.board.players.some((player) => player.streak?.type === "W" && player.streak.count >= 3)).toBe(true);
    expect(snapshot.board.players.some((player) => player.streak?.type === "L" && player.streak.count >= 3)).toBe(true);

    const careerMatches = snapshot.career.matches;
    const expectedCareerWins = careerMatches.filter((m) => m.result === "Victory").length;
    const expectedCareerWinRate = careerMatches.length > 0
      ? Math.round((100 * expectedCareerWins) / careerMatches.length)
      : 0;
    const expectedHsPctSum = careerMatches.reduce((sum, m) => sum + (m.hsPct ?? 0), 0);
    const expectedCareerHsPct = careerMatches.length > 0
      ? Math.round(expectedHsPctSum / careerMatches.length)
      : 0;

    expect(snapshot.performance.summary.winRate).toBe(100 * snapshot.performance.summary.wins / snapshot.performance.summary.matches);
    for (const match of [...careerMatches, ...snapshot.performance.points]) {
      expect(match.kd).toBeCloseTo((match.kills ?? 0) / (match.deaths ?? 1), 2);
    }
    expect(snapshot.matchDetail.players.filter((player) => player.isMatchMvp)).toHaveLength(1);
    for (const team of ["Blue", "Red"]) {
      expect(snapshot.matchDetail.players.filter((player) => player.team === team && player.isTeamMvp)).toHaveLength(1);
    }
    expect(snapshot.career.averages.winRate).toBe(expectedCareerWinRate);
    expect(snapshot.career.averages.hsPct).toBe(expectedCareerHsPct);
    expect(snapshot.career.matches).toHaveLength(8);
    expect(snapshot.career.matches.every((match) => match.rrDelta !== null && match.rrDelta !== undefined)).toBe(true);
    expect(snapshot.career.matches.every((match) => match.rankAfter && match.rrAfter !== null && match.rrAfter !== undefined)).toBe(true);
    expect(snapshot.career.agentPool.length).toBeGreaterThan(0);
    expect(snapshot.career.mapStats.length).toBeGreaterThan(0);
    expect(snapshot.career.coPlayers).toHaveLength(6);
    expect(snapshot.career.coPlayers.some((player) => player.name === "NovaFlux#MOCK")).toBe(false);
    expect(snapshot.career.coPlayers.filter((player) => player.name).every((player) => player.name?.includes("#"))).toBe(true);
    expect(snapshot.career.coPlayers.some((player) => !player.name && !player.puuid.startsWith("teammate-"))).toBe(true);
    expect(snapshot.board.players.some((player) => player.smurfReasons.some((reason) => /boost/i.test(reason)))).toBe(true);
    for (const skin of snapshot.inventory.top ?? []) expect(skin.icon).toBeTruthy();
  });

  it("keeps PREGAME fixtures ally-only", () => {
    const snapshot = makeSnapshot("PREGAME", 1);

    expect(snapshot.board.players).toHaveLength(5);
    expect(snapshot.board.teams.Blue).toHaveLength(5);
    expect(snapshot.board.teams.Red).toEqual([]);
    expect(snapshot.board.players.every((player) => player.team === "Blue")).toBe(true);
  });
});
