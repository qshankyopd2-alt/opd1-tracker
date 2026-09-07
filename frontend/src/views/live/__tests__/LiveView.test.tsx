import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { useLiveData } from "../../../state/LiveDataContext";
import { LiveView } from "../LiveView";

vi.mock("../../../state/LiveDataContext", () => ({ useLiveData: vi.fn() }));
vi.mock("../../../state/AppContext", () => ({ useApp: () => ({ healthError: null, setView: vi.fn() }) }));

describe("Live state routing", () => {
  it.each(["OFFLINE", "MENUS", "PREGAME", "INGAME"] as const)("renders only actual players in %s", (state) => {
    const board = { ...makeSnapshot(state, 1).board, source: "local" };
    vi.mocked(useLiveData).mockReturnValue({ board, error: null, loading: false, updatedAt: null, refresh: vi.fn(), showBoard: true, isLive: state !== "OFFLINE" });
    const html = renderToStaticMarkup(<LiveView />);
    if (state === "OFFLINE") {
      expect(html).toContain('data-testid="offline-hero"');
      expect(html).not.toContain('data-testid="weapon-loadout"');
    } else {
      expect(html.match(/data-testid="player-row-open-/g)?.length ?? 0).toBe(board.players.length);
      expect(html.match(/data-testid="weapon-slot-/g)?.length ?? 0).toBe(0);
    }
  });

  it("rejects demo sources even when their state says INGAME", () => {
    const board = { ...makeSnapshot("INGAME", 1).board, source: "demo" };
    vi.mocked(useLiveData).mockReturnValue({ board, error: null, loading: false, updatedAt: null, refresh: vi.fn(), showBoard: false, isLive: false });
    expect(renderToStaticMarkup(<LiveView />)).toContain('data-testid="offline-hero"');
  });
});
