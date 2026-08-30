import { describe, expect, it } from "vitest";
import {
  COMPACT_WINDOW_WIDTH,
  EXPANDED_WINDOW_WIDTH,
  nearestWindowWidth,
  shouldSnapWindow,
  windowDensityForWidth,
} from "../useWindowDensity";

describe("window density", () => {
  it("switches at the explicit midpoint", () => {
    expect(windowDensityForWidth(900)).toBe("compact");
    expect(windowDensityForWidth(1149)).toBe("compact");
    expect(windowDensityForWidth(1150)).toBe("expanded");
    expect(windowDensityForWidth(1400)).toBe("expanded");
  });

  it("selects the nearest supported width", () => {
    expect(nearestWindowWidth(1000)).toBe(COMPACT_WINDOW_WIDTH);
    expect(nearestWindowWidth(1300)).toBe(EXPANDED_WINDOW_WIDTH);
    expect(nearestWindowWidth(1300, 1200)).toBe(COMPACT_WINDOW_WIDTH);
  });

  it("does not snap maximized or fullscreen windows", () => {
    expect(shouldSnapWindow(false, false)).toBe(true);
    expect(shouldSnapWindow(true, false)).toBe(false);
    expect(shouldSnapWindow(false, true)).toBe(false);
  });
});
