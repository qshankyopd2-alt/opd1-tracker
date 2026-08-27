import { describe, it, expect } from 'vitest';
import { RANKS, rankFromTier } from '../ranks';

describe('ranks', () => {
  describe('RANKS array', () => {
    it('is properly populated and not empty', () => {
      expect(RANKS.length).toBeGreaterThan(0);
      expect(RANKS[0].name).toBe('Unranked');
      expect(RANKS[0].tier).toBe(0);
      expect(RANKS[RANKS.length - 1].name).toBe('Radiant');
      expect(RANKS[RANKS.length - 1].tier).toBe(RANKS.length - 1);
    });
  });

  describe('rankFromTier', () => {
    it('returns Unranked (tier 0) for nullish inputs', () => {
      expect(rankFromTier(null).name).toBe('Unranked');
      expect(rankFromTier(undefined).name).toBe('Unranked');
    });

    it('returns Unranked for tiers 0, 1, and 2', () => {
      expect(rankFromTier(0).name).toBe('Unranked');
      expect(rankFromTier(1).name).toBe('Unranked');
      expect(rankFromTier(2).name).toBe('Unranked');
    });

    it('returns Iron 1 for tier 3', () => {
      expect(rankFromTier(3).name).toBe('Iron 1');
    });

    it('clamps negative tiers to tier 0 (Unranked)', () => {
      expect(rankFromTier(-1).name).toBe('Unranked');
      expect(rankFromTier(-100).name).toBe('Unranked');
    });

    it('clamps overly high tiers to max tier (Radiant)', () => {
      const maxTier = RANKS.length - 1;
      expect(rankFromTier(maxTier).name).toBe('Radiant');
      expect(rankFromTier(maxTier + 1).name).toBe('Radiant');
      expect(rankFromTier(100).name).toBe('Radiant');
    });

    it('truncates fractional tiers', () => {
      expect(rankFromTier(3.1).name).toBe('Iron 1');
      expect(rankFromTier(3.9).name).toBe('Iron 1');
    });
  });
});
