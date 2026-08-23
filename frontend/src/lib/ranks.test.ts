import { describe, it, expect } from 'vitest';
import { rankFromTier, RANKS } from './ranks';

describe('rankFromTier', () => {
  it('should return Unranked (tier 0) for null', () => {
    const result = rankFromTier(null);
    expect(result.tier).toBe(0);
    expect(result.name).toBe('Unranked');
  });

  it('should return Unranked (tier 0) for undefined', () => {
    const result = rankFromTier(undefined);
    expect(result.tier).toBe(0);
    expect(result.name).toBe('Unranked');
  });

  it('should return Unranked (tier 0) for tier 0', () => {
    const result = rankFromTier(0);
    expect(result.tier).toBe(0);
    expect(result.name).toBe('Unranked');
  });

  it('should return the correct rank for a valid within-bounds tier', () => {
    // 0,1,2 are Unranked. 3 is Iron 1.
    const result = rankFromTier(3);
    expect(result.tier).toBe(3);
    expect(result.name).toBe('Iron 1');
  });

  it('should clamp negative numbers to 0 (Unranked)', () => {
    const result = rankFromTier(-5);
    expect(result.tier).toBe(0);
    expect(result.name).toBe('Unranked');
  });

  it('should clamp exceedingly large numbers to the maximum tier', () => {
    const maxTierIndex = RANKS.length - 1;
    const maxRank = RANKS[maxTierIndex];

    const result = rankFromTier(999);
    expect(result.tier).toBe(maxTierIndex);
    expect(result.name).toBe(maxRank.name);
  });

  it('should truncate decimal/fractional numbers to integer', () => {
    // Math.trunc(3.7) = 3 -> Iron 1
    const result = rankFromTier(3.7);
    expect(result.tier).toBe(3);
    expect(result.name).toBe('Iron 1');
  });
});
