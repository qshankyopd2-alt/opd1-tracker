import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecentFormTiles, type RecentFormDetail } from "../RecentFormTiles";

function render(form: ("W" | "L" | "D" | "?")[], latestRr: number | null = null, recentDetails?: RecentFormDetail[]) {
  return renderToStaticMarkup(<RecentFormTiles form={form} latestRr={latestRr} recentDetails={recentDetails} testId="recent" />);
}

describe("RecentFormTiles", () => {
  it.each([0, 3, 5, 7])("keeps five equally sized slots for %i results", (count) => {
    const html = render(Array.from({ length: count }, () => "W"));
    expect(html.match(/data-testid="recent-tile-/g)).toHaveLength(5);
    expect(html.match(/data-outcome="unresolved"/g) ?? []).toHaveLength(Math.max(0, 5 - count));
    expect(html.match(/class="recent-result"/g)).toHaveLength(5);
  });
  it("shows newest first with explicit chronology and keyboard-readable descriptions", () => {
    const html = render(["W", "L", "D", "?", "L"], 24);
    expect(html).toContain("newest to oldest: Victory, Defeat, Draw, Unavailable, Defeat");
    expect(html).not.toContain("flex-row-reverse");
    expect(html.match(/tabindex="0"/g)).toHaveLength(5);
    expect(html).toContain('title="Newest match');
    expect(html).not.toContain('role="tooltip"');
    expect(html.indexOf('recent-tile-0')).toBeLessThan(html.indexOf('recent-tile-4'));
  });
  it.each([24, -18, 0])("keeps a real newest RR of %i", (rr) => {
    const html = render(["W", "L"], rr);
    expect(html).toContain(`${rr > 0 ? "+" : ""}${rr} RR`);
    expect(html).toContain("Match 2 · Defeat · RR unavailable");
  });
  it("does not fabricate an absent delta", () => {
    expect(render(["W"])).toContain("Victory · RR unavailable");
  });
  it("uses one coherent career source for result, RR and age", () => {
    const html = render(["L"], -18, [{ result: "W", rrDelta: 22, startMillis: Date.now() - 7 * 3_600_000 }]);
    expect(html).toContain("Recent matches, all modes");
    expect(html).toContain("Victory · +22 RR · 7 hours ago");
    expect(html).not.toContain("-18 RR");
    expect(html).not.toContain("Defeat");
  });
  it("preserves null career RR rather than falling back to unrelated live RR", () => {
    expect(render(["W"], 24, [{ result: "D", rrDelta: null }])).toContain("Draw · RR unavailable");
    expect(render(["W"], 24, [{ result: "D", rrDelta: null }])).not.toContain("+24 RR");
  });
  it("caps details to five without manufacturing results", () => {
    const html = render([], null, Array.from({ length: 6 }, (_, index) => ({ result: index === 5 ? "L" : "W" })));
    expect(html).not.toContain("Defeat");
  });
});
