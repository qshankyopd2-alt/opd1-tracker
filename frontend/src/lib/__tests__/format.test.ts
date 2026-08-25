import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timeAgo, fmtDelta, fmtNum, fmtPct, scoreline, matchDate, resultColor } from '../format';

describe('format', () => {
  describe('timeAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "—" for null or undefined', () => {
      expect(timeAgo(null)).toBe('—');
      expect(timeAgo(undefined)).toBe('—');
    });

    it('formats "just now"', () => {
      const nowMs = Date.now();
      expect(timeAgo(nowMs)).toBe('just now');
      expect(timeAgo(nowMs - 59000)).toBe('just now'); // 59 seconds ago
      // Testing with seconds timestamp
      expect(timeAgo(Math.floor(nowMs / 1000))).toBe('just now');
    });

    it('formats minutes ago', () => {
      const nowMs = Date.now();
      expect(timeAgo(nowMs - 60000)).toBe('1m ago');
      expect(timeAgo(nowMs - 59 * 60000)).toBe('59m ago');
    });

    it('formats hours ago', () => {
      const nowMs = Date.now();
      expect(timeAgo(nowMs - 60 * 60000)).toBe('1h ago');
      expect(timeAgo(nowMs - 23 * 60 * 60000)).toBe('23h ago');
    });

    it('formats days ago', () => {
      const nowMs = Date.now();
      expect(timeAgo(nowMs - 24 * 60 * 60000)).toBe('1d ago');
      expect(timeAgo(nowMs - 29 * 24 * 60 * 60000)).toBe('29d ago');
    });

    it('formats months ago', () => {
      const nowMs = Date.now();
      expect(timeAgo(nowMs - 30 * 24 * 60 * 60000)).toBe('1mo ago');
      expect(timeAgo(nowMs - 60 * 24 * 60 * 60000)).toBe('2mo ago');
    });
  });

  describe('fmtDelta', () => {
    it('returns "—" for null or undefined', () => {
      expect(fmtDelta(null)).toBe('—');
      expect(fmtDelta(undefined)).toBe('—');
    });

    it('adds "+" to positive numbers', () => {
      expect(fmtDelta(5)).toBe('+5');
      expect(fmtDelta(42)).toBe('+42');
    });

    it('does not add "+" to 0 or negative numbers', () => {
      expect(fmtDelta(0)).toBe('0');
      expect(fmtDelta(-5)).toBe('-5');
    });
  });

  describe('fmtNum', () => {
    it('returns "—" for null or undefined', () => {
      expect(fmtNum(null)).toBe('—');
      expect(fmtNum(undefined)).toBe('—');
    });

    it('formats numbers with default 0 digits', () => {
      expect(fmtNum(5.5)).toBe('6');
      expect(fmtNum(5.4)).toBe('5');
    });

    it('formats numbers with specified digits', () => {
      expect(fmtNum(5.56, 1)).toBe('5.6');
      expect(fmtNum(5.123, 2)).toBe('5.12');
    });
  });

  describe('fmtPct', () => {
    it('returns "—" for null or undefined', () => {
      expect(fmtPct(null)).toBe('—');
      expect(fmtPct(undefined)).toBe('—');
    });

    it('formats numbers as percentage', () => {
      expect(fmtPct(50.4)).toBe('50%');
      expect(fmtPct(50.6)).toBe('51%');
      expect(fmtPct(0)).toBe('0%');
    });
  });

  describe('scoreline', () => {
    it('returns "—" for missing or empty scores', () => {
      expect(scoreline(undefined)).toBe('—');
      expect(scoreline({})).toBe('—');
    });

    it('formats with ownTeam first', () => {
      const scores = { Red: 13, Blue: 11 };
      expect(scoreline(scores, 'Blue')).toBe('11–13');
      expect(scoreline(scores, 'Red')).toBe('13–11');
    });

    it('formats without ownTeam based on result (Victory)', () => {
      const scores = { Red: 13, Blue: 11 };
      expect(scoreline(scores, null, 'Victory')).toBe('13–11');
    });

    it('formats without ownTeam based on result (Defeat)', () => {
      const scores = { Red: 13, Blue: 11 };
      expect(scoreline(scores, null, 'Defeat')).toBe('11–13'); // sort a - b
    });

    it('formats missing other team correctly', () => {
      const scores = { Red: 13 };
      expect(scoreline(scores, 'Red')).toBe('13–0');
    });
  });

  describe('matchDate', () => {
    it('returns "—" for null or undefined', () => {
      expect(matchDate(null)).toBe('—');
      expect(matchDate(undefined)).toBe('—');
    });

    it('formats matchDate correctly', () => {
      const ts = new Date('2024-05-15T12:00:00Z').getTime(); // Use fixed timestamp
      const result = matchDate(ts);
      // Depending on the local timezone where the test runs,
      // the formatted string might be "May 15" or "May 14" (or "May 16")
      // Since it uses toLocaleDateString without specifying UTC
      expect(["May 14", "May 15", "May 16"]).toContain(result);

      const secondsTs = ts / 1000;
      expect(["May 14", "May 15", "May 16"]).toContain(matchDate(secondsTs));
    });
  });

  describe('resultColor', () => {
    it('returns colors correctly', () => {
      expect(resultColor('Victory')).toBe('#10B981');
      expect(resultColor('Defeat')).toBe('#EF4444');
      expect(resultColor('Draw')).toBe('#A1A1AA');
      expect(resultColor(null)).toBe('#A1A1AA');
    });
  });
});
