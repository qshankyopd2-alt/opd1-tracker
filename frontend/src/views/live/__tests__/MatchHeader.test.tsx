import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { MatchHeader, probabilityTone } from "../MatchHeader";

describe("MatchHeader", () => {
  it.each([
    { value: 58, color: "#10B981" },
    { value: 50, color: "#F59E0B" },
    { value: 40, color: "#EF4444" },
  ])("renders the in-game probability instrument for $value", ({ value, color }) => {
    const board = { ...makeSnapshot("INGAME", 1).board, winProb: value };
    const html = renderToStaticMarkup(<MatchHeader board={board} />);

    expect(probabilityTone(value)).toBe(color);
    expect(html).toContain('role="meter"');
    expect(html).toContain(`aria-valuenow="${value}"`);
    expect(html).toContain(`${value}%`);
    expect(html).toContain(color);
    expect(html).not.toContain("<img");
    expect(html).not.toContain(board.map ?? "Missing map");
    expect(html).not.toContain(board.mode);
    expect(html).not.toContain("match-score");
    expect(html).not.toContain("match-state-badge");
  });

  it("renders nothing for an in-game board without probability data", () => {
    const board = { ...makeSnapshot("INGAME", 1).board, winProb: null };
    expect(renderToStaticMarkup(<MatchHeader board={board} />)).toBe("");
  });

  it("keeps compact functional pregame and menus states", () => {
    const pregame = makeSnapshot("PREGAME", 1).board;
    const menus = makeSnapshot("MENUS", 1).board;

    expect(renderToStaticMarkup(<MatchHeader board={pregame} />)).toContain("Agents locked");
    expect(renderToStaticMarkup(<MatchHeader board={menus} />)).toContain("queue-info");
  });
});
