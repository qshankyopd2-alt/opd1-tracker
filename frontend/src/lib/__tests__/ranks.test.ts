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
      const unranked = RANKS[0];
      expect(rankFromTier(null)).toEqual(unranked);
      expect(rankFromTier(undefined)).toEqual(unranked);
    });

    it('returns Unranked for tier 0', () => {
      expect(rankFromTier(0)).toEqual(RANKS[0]);
    });

    it('clamps negative tiers to tier 0 (Unranked)', () => {
      expect(rankFromTier(-1)).toEqual(RANKS[0]);
      expect(rankFromTier(-100)).toEqual(RANKS[0]);
    });

    it('clamps overly high tiers to max tier (Radiant)', () => {
      const maxTier = RANKS.length - 1;
      const radiant = RANKS[maxTier];
      expect(rankFromTier(maxTier)).toEqual(radiant);
      expect(rankFromTier(maxTier + 1)).toEqual(radiant);
      expect(rankFromTier(100)).toEqual(radiant);
    });

    it('returns correct rank for valid middle tiers', () => {
      const tier1 = RANKS[1]; // Iron 1
      expect(rankFromTier(1)).toEqual(tier1);

      const middleTierIndex = Math.floor(RANKS.length / 2);
      const middleTier = RANKS[middleTierIndex];
      expect(rankFromTier(middleTierIndex)).toEqual(middleTier);
    });

    it('truncates fractional tiers', () => {
      expect(rankFromTier(1.1)).toEqual(RANKS[1]);
      expect(rankFromTier(1.9)).toEqual(RANKS[1]);
    });
  });
});
