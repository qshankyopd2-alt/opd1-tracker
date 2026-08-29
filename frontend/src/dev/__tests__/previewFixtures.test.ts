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
      expect(player.weapons).toHaveLength(4);
      for (const weapon of player.weapons) expect(weapon.skin?.icon).toBeTruthy();
    }

    expect(snapshot.performance.summary.winRate).toBe(55);
    expect(snapshot.career.averages.winRate).toBe(55);
    expect(snapshot.career.averages.hsPct).toBe(31);
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
