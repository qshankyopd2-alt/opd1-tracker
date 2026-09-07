import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchDetail, MatchMeta } from "../../api/types";
import { designApi, setDesignError, setDesignSnapshot } from "../designMode";
import { makeSnapshot } from "../previewFixtures";

beforeEach(() => {
  vi.useFakeTimers();
  setDesignError(null);
  setDesignSnapshot(makeSnapshot("INGAME", 1));
});
afterEach(() => vi.useRealTimers());

async function request<T>(kind: string, path: string, init?: RequestInit): Promise<T> {
  const pending = designApi<T>(kind, path, init);
  await vi.runAllTimersAsync();
  return pending;
}

describe("design-mode match consistency", () => {
  it("keeps ten unique players and one subject for every player profile", async () => {
    const snapshot = makeSnapshot("INGAME", 1);
    for (const player of snapshot.board.players) {
      const match = snapshot.career.matches[0];
      const detail = await request<MatchDetail>("match", `/api/match/${match.matchId}?subject=${player.puuid}`);
      expect(new Set(detail.players.map((p) => p.puuid)).size).toBe(10);
      const subjects = detail.players.filter((p) => p.isSubject);
      expect(subjects).toHaveLength(1);
      expect(subjects[0]).toMatchObject({ puuid: player.puuid, kills: match.kills, deaths: match.deaths, assists: match.assists, acs: match.acs });
      expect(detail.players.filter((p) => p.isMatchMvp)).toHaveLength(1);
      for (const team of ["Blue", "Red"]) {
        const members = detail.players.filter((p) => p.team === team);
        expect(members).toHaveLength(5);
        expect(members.filter((p) => p.isTeamMvp)).toHaveLength(1);
        expect(members.find((p) => p.isTeamMvp)?.acs).toBe(Math.max(...members.map((p) => p.acs)));
      }
      const team = subjects[0].team;
      expect(detail.scores[team]).toBeGreaterThan(detail.scores[team === "Blue" ? "Red" : "Blue"]);
    }
  });

  it.each(["Victory", "Defeat", "Draw", "Unresolved"] as const)("preserves %s outcomes", async (result) => {
    const snapshot = makeSnapshot("INGAME", 1);
    const matchId = snapshot.performance.points[0].matchId;
    snapshot.career.matches = [];
    snapshot.performance.points[0] = { ...snapshot.performance.points[0], result: result === "Unresolved" ? undefined : result, scores: {} };
    setDesignSnapshot(snapshot);
    const detail = await request<MatchDetail>("match", `/api/match/${matchId}`);
    expect(detail.result).toBe(result);
    if (result === "Draw") expect(detail.scores.Blue).toBe(detail.scores.Red);
    if (result === "Unresolved") expect(detail.scores).toEqual({});
  });
});

describe("preview note persistence", () => {
  it("saves note, tags and bookmark together in the preview snapshot", async () => {
    const meta = { note: " Review ", tags: [" clutch ", ""], bookmarked: true };
    const saved = await request<{ ok: boolean; meta: MatchMeta }>("matchMeta", "/api/matches/preview-match-0/meta", { method: "PUT", body: JSON.stringify(meta) });
    expect(saved.ok).toBe(true);
    expect(saved.meta).toMatchObject({ note: "Review", tags: ["clutch"], bookmarked: true });
    const performance = await request<{ matchMeta: Record<string, MatchMeta> }>("performance", "/api/performance");
    expect(performance.matchMeta["preview-match-0"]).toEqual(saved.meta);
  });

  it("rejects a failed save without overwriting the existing note", async () => {
    setDesignError({ error: "Preview save failed" });
    const pending = designApi("matchMeta", "/api/matches/preview-match-0/meta", { method: "PUT", body: JSON.stringify({ note: "lost" }) });
    const rejected = expect(pending).rejects.toThrow("Preview save failed");
    await vi.runAllTimersAsync();
    await rejected;
    setDesignError(null);
    const performance = await request<{ matchMeta: Record<string, MatchMeta> }>("performance", "/api/performance");
    expect(performance.matchMeta["preview-match-0"].note).not.toBe("lost");
  });
});


describe("preview saved-player acknowledgements", () => {
  it("saves and removes an observed player inside the harness", async () => {
    const snap = makeSnapshot("INGAME", 1);
    setDesignSnapshot(snap);
    const puuid = snap.board.players[1].puuid;
    const path = `/api/saved-players/${puuid}`;
    const body = { accountPuuid: snap.savedPlayers.accountPuuid, saved: true, note: " Review aim " };
    const result = await request<{ ok: boolean; player: { note: string } }>("savedPlayers", path, { method: "PUT", body: JSON.stringify(body) });
    expect(result).toMatchObject({ ok: true, player: { note: "Review aim" } });
    await request("savedPlayers", path, { method: "PUT", body: JSON.stringify({ ...body, saved: false }) });
    expect(snap.savedPlayers.players.some((player) => player.puuid === puuid)).toBe(false);
  });
  it("rejects an account mismatch without mutating saved players", async () => {
    const snap = makeSnapshot("INGAME", 1);
    setDesignSnapshot(snap);
    const before = JSON.stringify(snap.savedPlayers);
    const pending = designApi("savedPlayers", `/api/saved-players/${snap.board.players[0].puuid}`, { method: "PUT", body: JSON.stringify({ accountPuuid: "other", saved: true, note: "Wrong owner" }) });
    const rejected = expect(pending).rejects.toThrow("Active account changed");
    await vi.runAllTimersAsync();
    await rejected;
    expect(JSON.stringify(snap.savedPlayers)).toBe(before);
  });
});
