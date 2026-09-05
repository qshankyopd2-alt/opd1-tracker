import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { normalizeOutcome, OutcomeBadge } from "../OutcomeBadge";
import { StreakBadge } from "../StreakBadge";
import { Truncate } from "../Truncate";

describe("redesign badges", () => {
  it("keeps draw and unresolved distinct", () => {
    expect(normalizeOutcome("Draw")).toBe("draw");
    expect(normalizeOutcome(null)).toBe("unresolved");
    expect(normalizeOutcome("Victory")).toBe("win");
    expect(normalizeOutcome("Defeat")).toBe("loss");
  });

  it("uses the telemetry mono face only for the large score", () => {
    const large = renderToStaticMarkup(<OutcomeBadge outcome="draw" size="lg" score="13–13" />);
    const small = renderToStaticMarkup(<OutcomeBadge outcome="unresolved" size="sm" />);
    expect(large).toContain("font-mono");
    expect(large).toContain("13–13");
    expect(small).not.toContain("font-mono");
  });

  it("keeps streaks neutral and separate from threat and outcome colors", () => {
    const win = renderToStaticMarkup(<StreakBadge type="W" count={4} />);
    const loss = renderToStaticMarkup(<StreakBadge type="L" count={3} />);
    expect(win).toContain("text-text-secondary");
    expect(loss).toContain("text-text-secondary");
    expect(win).toContain('data-testid="streak-w"');
    expect(loss).toContain('data-testid="streak-l"');
    expect(`${win}${loss}`).not.toContain("live-alert-");
  });

  it("constrains long names", () => {
    const html = renderToStaticMarkup(<Truncate text="A Very Long Player Name That Must Truncate" maxWidth={180} />);
    expect(html).toContain("max-width:180px");
    expect(html).toContain("truncate");
  });
});
