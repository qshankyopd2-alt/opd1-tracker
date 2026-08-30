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
    expect(html.match(/>—<\/span>/g) ?? []).toHaveLength(placeholders);
  });

  it("preserves newest-to-oldest order and exposes a text summary", () => {
    const html = render(["W", "L", "L", "W", "W"], 24);

    expect(html).toContain("Recent form, newest to oldest: Win, Loss, Loss, Win, Win. Newest match RR +24.");
    expect(html).not.toContain(">Newest<");
    expect(html).not.toContain(">Oldest<");
    expect(html).not.toContain(">→<");
    expect(html).toContain('data-testid="recent-recency-scale"');
    expect(html).not.toContain('data-testid="recent-recency-rail"');
    expect(html.match(/data-recency-marker=/g)).toHaveLength(5);
    expect(html).toContain("rounded-[1px]");
    expect(html).not.toContain("rounded-full");
    expect(html).toContain("flex-row-reverse");
    expect(html.match(/data-recency="current"/g)).toHaveLength(1);
    expect(html).toContain("h-[18px] w-[18px]");
    expect(html).toContain("motion-reduce:transition-none");
    expect(html.indexOf('data-testid="recent-tile-0"')).toBeLessThan(html.indexOf('data-testid="recent-tile-4"'));
    expect(html.indexOf("+24 RR")).toBeLessThan(html.indexOf('id="recent-tooltip-1"'));
    expect(html.lastIndexOf("+24 RR")).toBeLessThan(html.indexOf('id="recent-tooltip-1"'));
  });

  it("clips results after the fifth match", () => {
    const html = render(["W", "W", "W", "W", "W", "L"]);

    expect(html).toContain("Recent form, newest to oldest: Win, Win, Win, Win, Win.");
    expect(html).not.toContain("Defeat");
  });

  it.each([
    { rr: 24, expected: "+24 RR" },
    { rr: -18, expected: "-18 RR" },
    { rr: 0, expected: "0 RR" },
  ])("shows only the newest available RR value: $expected", ({ rr, expected }) => {
    const html = render(["W", "L", "W", "L", "W"], rr);

    expect(html).toContain(expected);
    expect(html.lastIndexOf(expected)).toBeLessThan(html.indexOf('id="recent-tooltip-1"'));
  });

  it("omits RR when the newest delta is unavailable", () => {
    const html = render(["W", "L", "W", "L", "W"], null);

    expect(html).not.toContain(" RR");
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
});
