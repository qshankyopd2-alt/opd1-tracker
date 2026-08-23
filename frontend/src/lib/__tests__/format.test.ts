import { describe, it, expect } from 'vitest';
import { scoreline } from '../format';

describe('scoreline', () => {
  it('returns "—" for undefined scores', () => {
    expect(scoreline(undefined)).toBe('—');
  });

  it('returns "—" for empty scores', () => {
    expect(scoreline({})).toBe('—');
  });

  it('formats correctly when ownTeam is provided and found', () => {
    const scores = { Red: 13, Blue: 7 };
    expect(scoreline(scores, 'Red')).toBe('13–7');
    expect(scoreline(scores, 'Blue')).toBe('7–13');
  });

  it('formats correctly when ownTeam is provided but only own team is in scores (e.g. forfeit)', () => {
    const scores = { Red: 13 };
    expect(scoreline(scores, 'Red')).toBe('13–0');
  });

  it('sorts correctly for Defeat when ownTeam is not provided', () => {
    const scores = { Red: 13, Blue: 7 };
    expect(scoreline(scores, undefined, 'Defeat')).toBe('7–13');
  });

  it('sorts correctly for Victory when ownTeam is not provided', () => {
    const scores = { Red: 13, Blue: 7 };
    expect(scoreline(scores, undefined, 'Victory')).toBe('13–7');
  });

  it('defaults to highest first when result is missing and ownTeam is missing', () => {
    const scores = { Red: 7, Blue: 13 };
    expect(scoreline(scores)).toBe('13–7');
  });

  it('defaults to highest first when result is missing and ownTeam is missing (multiple scores)', () => {
    const scores = { Red: 7, Blue: 13, Green: 10 };
    expect(scoreline(scores)).toBe('13–10–7');
  });
});
