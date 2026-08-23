import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  timeAgo,
  fmtDelta,
  fmtNum,
  fmtPct,
  scoreline,
  matchDate,
  resultColor,
} from "../format";

describe("format utilities", () => {
  describe("timeAgo", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T12:00:00Z")); // 1704110400000
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns '—' for null or undefined", () => {
      expect(timeAgo(null)).toBe("—");
      expect(timeAgo(undefined)).toBe("—");
    });

    it("returns 'just now' for diff < 1m", () => {
      const ts = Date.now() - 30 * 1000;
      expect(timeAgo(ts)).toBe("just now");
    });

    it("returns 'xm ago' for diff < 60m", () => {
      const ts = Date.now() - 5 * 60 * 1000;
      expect(timeAgo(ts)).toBe("5m ago");
    });

    it("returns 'xh ago' for diff < 24h", () => {
      const ts = Date.now() - 3 * 60 * 60 * 1000;
      expect(timeAgo(ts)).toBe("3h ago");
    });

    it("returns 'xd ago' for diff < 30d", () => {
      const ts = Date.now() - 5 * 24 * 60 * 60 * 1000;
      expect(timeAgo(ts)).toBe("5d ago");
    });

    it("returns 'xmo ago' for diff >= 30d", () => {
      const ts = Date.now() - 65 * 24 * 60 * 60 * 1000; // ~2 months
      expect(timeAgo(ts)).toBe("2mo ago");
    });

    it("handles seconds timestamp (ts < 1e12)", () => {
      const tsSeconds = Math.floor((Date.now() - 15 * 60 * 1000) / 1000);
      expect(timeAgo(tsSeconds)).toBe("15m ago");
    });
  });

  describe("fmtDelta", () => {
    it("returns '—' for null or undefined", () => {
      expect(fmtDelta(null)).toBe("—");
      expect(fmtDelta(undefined)).toBe("—");
    });

    it("formats positive numbers with '+'", () => {
      expect(fmtDelta(15)).toBe("+15");
    });

    it("formats negative numbers and zero as is", () => {
      expect(fmtDelta(-5)).toBe("-5");
      expect(fmtDelta(0)).toBe("0");
    });
  });

  describe("fmtNum", () => {
    it("returns '—' for null or undefined", () => {
      expect(fmtNum(null)).toBe("—");
      expect(fmtNum(undefined)).toBe("—");
    });

    it("formats numbers with default 0 digits", () => {
      expect(fmtNum(123.456)).toBe("123");
    });

    it("formats numbers with specified digits", () => {
      expect(fmtNum(123.456, 2)).toBe("123.46");
    });
  });

  describe("fmtPct", () => {
    it("returns '—' for null or undefined", () => {
      expect(fmtPct(null)).toBe("—");
      expect(fmtPct(undefined)).toBe("—");
    });

    it("formats and rounds percentages", () => {
      expect(fmtPct(45.6)).toBe("46%");
      expect(fmtPct(12.3)).toBe("12%");
    });
  });

  describe("scoreline", () => {
    it("returns '—' for undefined or empty scores", () => {
      expect(scoreline(undefined)).toBe("—");
      expect(scoreline({})).toBe("—");
    });

    it("formats based on ownTeam when provided", () => {
      const scores = { "Blue": 13, "Red": 7 };
      expect(scoreline(scores, "Blue")).toBe("13–7");
      expect(scoreline(scores, "Red")).toBe("7–13");
    });

    it("handles ownTeam when only one team has score (edge case)", () => {
        const scores = { "Blue": 13 };
        expect(scoreline(scores, "Blue")).toBe("13–0");
    });

    it("formats based on result 'Defeat' when ownTeam not provided", () => {
      const scores = { "TeamA": 10, "TeamB": 13 };
      expect(scoreline(scores, null, "Defeat")).toBe("10–13"); // lowest first
    });

    it("formats based on result 'Victory' when ownTeam not provided", () => {
      const scores = { "TeamA": 13, "TeamB": 10 };
      expect(scoreline(scores, null, "Victory")).toBe("13–10"); // highest first
    });

    it("defaults to highest first when no ownTeam or result", () => {
      const scores = { "TeamA": 10, "TeamB": 13 };
      expect(scoreline(scores)).toBe("13–10");
    });
  });

  describe("matchDate", () => {
    it("returns '—' for null or undefined", () => {
      expect(matchDate(null)).toBe("—");
      expect(matchDate(undefined)).toBe("—");
    });

    it("formats timestamp in ms to short month and day", () => {
      const date = new Date("2024-03-15T12:00:00Z");
      expect(matchDate(date.getTime())).toMatch(/Mar 15/);
    });

    it("formats timestamp in seconds to short month and day", () => {
      const date = new Date("2024-03-15T12:00:00Z");
      expect(matchDate(Math.floor(date.getTime() / 1000))).toMatch(/Mar 15/);
    });
  });

  describe("resultColor", () => {
    it("returns green for Victory", () => {
      expect(resultColor("Victory")).toBe("#10B981");
    });

    it("returns red for Defeat", () => {
      expect(resultColor("Defeat")).toBe("#EF4444");
    });

    it("returns gray for other results or null/undefined", () => {
      expect(resultColor("Draw")).toBe("#A1A1AA");
      expect(resultColor(null)).toBe("#A1A1AA");
      expect(resultColor(undefined)).toBe("#A1A1AA");
    });
  });
});
