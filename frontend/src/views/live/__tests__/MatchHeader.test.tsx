import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { MatchHeader, probabilityTone } from "../MatchHeader";

describe("MatchHeader", () => {
  it.each([
    { value: 58, color: "var(--ally)" },
    { value: 50, color: "var(--text-secondary)" },
    { value: 40, color: "var(--enemy)" },
  ])("renders the in-game command strip with an estimate-labeled meter for $value", ({ value, color }) => {
    const board = { ...makeSnapshot("INGAME", 1).board, winProb: value };
    const html = renderToStaticMarkup(<MatchHeader board={board} />);

    expect(probabilityTone(value)).toBe(color);
    expect(html).toContain('role="meter"');
    expect(html).toContain(`aria-valuenow="${value}"`);
    expect(html).toContain(`${value}%`);
    expect(html).toContain(color);
    // Win chance is explicitly labeled as an estimate
    expect(html).toContain("Win chance · Estimate");
    expect(html).toContain('data-testid="win-probability"');
    expect(html).toContain(`aria-valuetext="${value} percent estimate"`);
    // The live score stays in the game itself — the tracker shows round + side only
    expect(html).not.toContain("match-score-block");
    expect(html).toContain('data-testid="match-round"');
    expect(html).toContain('data-testid="match-side"');
    // Map + mode context
    expect(html).toContain(board.map ?? "");
    expect(html).toContain(board.mode);
    // Map splash artwork behind the strip
    expect(html).toContain("live-match-header-splash");
  });

  it("renders nothing for an in-game board without probability data", () => {
    const board = { ...makeSnapshot("INGAME", 1).board, winProb: null };
    expect(renderToStaticMarkup(<MatchHeader board={board} />)).toBe("");
  });

  it("keeps compact functional pregame and menus states", () => {
    const pregame = makeSnapshot("PREGAME", 1).board;
    const menus = makeSnapshot("MENUS", 1).board;

    const pregameHtml = renderToStaticMarkup(<MatchHeader board={pregame} />);
    expect(pregameHtml).toContain('data-testid="lock-progress"');
    expect(pregameHtml).toContain("3/5 locked");
    expect(pregameHtml).toContain("Agent select");
    expect(pregameHtml).toContain("Hidden until the match starts");

    const menusHtml = renderToStaticMarkup(<MatchHeader board={menus} />);
    expect(menusHtml).toContain("queue-info");
    expect(menusHtml).toContain("Competitive");
    expect(menusHtml).toContain("Lobby");
  });
});
