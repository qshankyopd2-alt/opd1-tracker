import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecentFormTiles, type RecentFormDetail } from "../RecentFormTiles";

function render(form: ("W" | "L")[], latestRr: number | null = null, recentDetails?: RecentFormDetail[]): string {
  return renderToStaticMarkup(
    <RecentFormTiles form={form} latestRr={latestRr} recentDetails={recentDetails} testId="recent" />,
  );
}

describe("RecentFormTiles", () => {
  it.each([
    { form: [] as ("W" | "L")[], placeholders: 5 },
    { form: ["W", "L", "W"] as ("W" | "L")[], placeholders: 2 },
    { form: ["W", "L", "W", "L", "W"] as ("W" | "L")[], placeholders: 0 },
    { form: ["W", "L", "W", "L", "W", "L"] as ("W" | "L")[], placeholders: 0 },
  ])("renders five slots for $form.length results", ({ form, placeholders }) => {
    const html = render(form);

    expect(html.match(/data-testid="recent-tile-/g)).toHaveLength(5);
    expect(html.match(/match-chip unresolved/g) ?? []).toHaveLength(placeholders);
  });

  it("renders chronologically oldest → newest with the newest tile highlighted on the right", () => {
    // form is newest-first: [W, L, L, W, W] → oldest→newest display: W, W, L, L, W
    const html = render(["W", "L", "L", "W", "W"], 24);

    expect(html).toContain("Recent form, oldest to newest: Win, Win, Loss, Loss, Win. Newest match RR +24.");
    // The newest match (dataIndex 0) is the rightmost tile.
    expect(html.indexOf('data-testid="recent-tile-0"')).toBeGreaterThan(html.indexOf('data-testid="recent-tile-4"'));
    expect(html.match(/data-recency="current"/g)).toHaveLength(1);
    expect(html.match(/data-recency="past"/g)).toHaveLength(4);
    expect(html).toContain("recent-form-tile-newest");
    // Tile 0 carries the current marker
    const newestTile = html.slice(
      html.indexOf('data-testid="recent-tile-0"'),
      html.indexOf('data-testid="recent-tile-0"') + 600,
    );
    expect(newestTile).toContain('data-recency="current"');
    expect(newestTile).toContain("recent-form-tile-newest");
    // No legacy ordering scaffolding
    expect(html).not.toContain("flex-row-reverse");
    expect(html).not.toContain("recent-recency-scale");
    expect(html).not.toContain("recent-recency-rail");
    expect(html).not.toContain("data-recency-marker");
    expect(html).not.toContain("live-alert-badge");
    // Progressive sizing: leftmost (oldest) smallest, rightmost (newest) largest
    expect(html).toContain('data-size="9"');
    expect(html).toContain('data-size="13"');
    // No "5M" scope label — the tooltip alone explains the strip
    expect(html).not.toContain(">5M<");
    expect(html).toContain("motion-reduce:transition-none");
    expect(html).toContain("group-hover/form-tile:opacity-100");
    expect(html).toContain("group-focus-within/form-tile:opacity-100");
    // Result words appear in per-tile tooltips
    expect(html).toContain("Victory");
    expect(html).toContain("Defeat");
  });

  it("clips results after the fifth match", () => {
    const html = render(["W", "W", "W", "W", "W", "L"]);

    expect(html).toContain("Recent form, oldest to newest: Win, Win, Win, Win, Win.");
    expect(html).not.toContain("Defeat");
  });

  it.each([
    { rr: 24, expected: "+24 RR" },
    { rr: -18, expected: "-18 RR" },
    { rr: 0, expected: "0 RR" },
  ])("shows only the newest available RR value: $expected", ({ rr, expected }) => {
    const html = render(["W", "L", "W", "L", "W"], rr);

    expect(html).toContain(expected);
    // Only the newest tile carries the live RR value
    expect(html.match(new RegExp(expected.replace("+", "\\+"), "g"))).toHaveLength(1);
  });

  it("omits RR when the newest delta is unavailable", () => {
    const html = render(["W", "L", "W", "L", "W"], null);

    expect(html).not.toContain(" RR");
    expect(html).toContain("RR unavailable");
  });

  it("shows real RR and elapsed time for every loaded match", () => {
    const now = Date.now();
    const html = render(["W", "L", "W"], null, [
      { result: "W", rrDelta: 22, startMillis: now - 7 * 3_600_000 },
      { result: "L", rrDelta: -18, startMillis: now - 26 * 3_600_000 },
      { result: "W", rrDelta: 19, startMillis: now - 96 * 3_600_000 },
    ]);

    expect(html).toContain("+22 RR");
    expect(html).toContain("-18 RR");
    expect(html).toContain("+19 RR");
    expect(html).toContain("7 hours ago");
    expect(html).toContain("26 hours ago");
    expect(html).toContain("4 days ago");
    expect(html).not.toContain("matches ago");
  });

  it("keeps the live form authoritative when delayed career details belong to a different result", () => {
    const html = render(["L"], -18, [
      { result: "W", rrDelta: 22, startMillis: Date.now() - 3_600_000 },
    ]);

    expect(html).toContain("Defeat");
    expect(html).toContain("-18 RR");
    expect(html).not.toContain("+22 RR");
  });
});
