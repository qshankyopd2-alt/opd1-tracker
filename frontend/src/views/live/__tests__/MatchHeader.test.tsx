import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { MatchHeader, probabilityTone } from "../MatchHeader";

describe("MatchHeader", () => {
  it.each([
    { value: 58, color: "var(--accent-team-a)" },
    { value: 50, color: "var(--text-secondary)" },
    { value: 40, color: "var(--accent-team-b)" },
  ])("renders the in-game probability instrument for $value", ({ value, color }) => {
    const board = { ...makeSnapshot("INGAME", 1).board, winProb: value };
    const html = renderToStaticMarkup(<MatchHeader board={board} />);

    expect(probabilityTone(value)).toBe(color);
    expect(html).toContain('role="meter"');
    expect(html).toContain("Estimated win chance");
    expect(html).toContain('aria-label="Your team estimated win chance"');
    expect(html).toContain(`aria-valuenow="${value}"`);
    expect(html).toContain(`${value}%`);
    expect(html).toContain(color);
    expect(html).not.toContain("<img");
    expect(html).toContain(board.map ?? "Missing map");
    expect(html).toContain(board.mode);
    expect(html).toContain("match-score");
    expect(html).not.toContain("match-state-badge");
  });

  it("keeps match context without inventing a probability", () => {
    const board = { ...makeSnapshot("INGAME", 1).board, winProb: null };
    const html = renderToStaticMarkup(<MatchHeader board={board} />);
    expect(html).toContain("match-context");
    expect(html).not.toContain('role="meter"');
  });

  it("keeps compact functional pregame and menus states", () => {
    const pregame = makeSnapshot("PREGAME", 1).board;
    const menus = makeSnapshot("MENUS", 1).board;

    expect(renderToStaticMarkup(<MatchHeader board={pregame} />)).toContain("Agents locked");
    expect(renderToStaticMarkup(<MatchHeader board={menus} />)).toContain("queue-info");
  });
});
