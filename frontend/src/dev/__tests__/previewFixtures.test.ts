import { describe, expect, it } from "vitest";
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
      expect(player.rr).toBeGreaterThan(0);
      expect(player.kd).not.toBeNull();
      expect(player.hsPct).not.toBeNull();
      expect(player.winRate).not.toBeNull();
      expect(player.form).toHaveLength(5);
      expect(player.form.every((result) => result === "W" || result === "L")).toBe(true);
      expect(player.weapons).toHaveLength(4);
      expect(player.weapons.map((weapon) => weapon.weapon)).toEqual(["Vandal", "Phantom", "Operator", "Melee"]);
      for (const weapon of player.weapons) expect(weapon.skin?.icon).toBeTruthy();
    }

    expect(snapshot.board.players.some((player) => player.name.length > 30 && player.party)).toBe(true);
    expect(snapshot.board.players.some((player) => player.smurf)).toBe(true);
    expect(snapshot.board.players.some((player) => player.streak?.type === "W" && player.streak.count >= 3)).toBe(true);
    expect(snapshot.board.players.some((player) => player.streak?.type === "L" && player.streak.count >= 3)).toBe(true);

    expect(snapshot.performance.summary.winRate).toBe(55);
    expect(snapshot.career.averages.winRate).toBe(55);
    expect(snapshot.career.averages.hsPct).toBe(31);
    expect(snapshot.career.matches).toHaveLength(8);
    expect(snapshot.career.matches.every((match) => match.rrDelta !== null && match.rrDelta !== undefined)).toBe(true);
    expect(snapshot.career.matches.every((match) => match.rankAfter && match.rrAfter !== null && match.rrAfter !== undefined)).toBe(true);
    expect(snapshot.career.agentPool.length).toBeGreaterThan(0);
    expect(snapshot.career.mapStats.length).toBeGreaterThan(0);
    expect(snapshot.career.coPlayers.length).toBeGreaterThan(0);
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
