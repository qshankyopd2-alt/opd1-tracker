import { describe, it, expect } from 'vitest';
import { splitTeams } from '../teamSplit';
import type { LiveBoard, LivePlayer } from '../../../api/types';

function player(puuid: string, team: string): LivePlayer {
  return {
    puuid,
    name: `Player ${puuid}`,
    nameHidden: false,
    team,
    isSelf: puuid === 'self',
    title: null,
    playerCard: null,
    agent: null,
    agentId: null,
    agentPortrait: null,
    agentArt: null,
    agentColor: '#FF4655',
    role: null,
    selection: null,
    rankTier: 0,
    rank: 'Unranked',
    rankColor: '#4A4A4A',
    rankGroup: 'Unranked',
    rankIcon: null,
    rr: 0,
    rrEarned: null,
    leaderboard: 0,
    peakRankTier: 0,
    peakRank: 'Unranked',
    peakColor: '#4A4A4A',
    peakIcon: null,
    peakAct: null,
    previousRank: 'Unranked',
    winRate: null,
    games: 0,
    kd: null,
    hsPct: null,
    skin: null,
    weapons: [],
    level: 0,
    levelHidden: false,
    party: null,
    smurf: false,
    smurfReasons: [],
    topAgents: [],
    form: [],
    streak: null,
    mapWinRate: null,
  };
}

function boardWith(state: LiveBoard['state'], teams: Record<string, LivePlayer[]>): LiveBoard {
  return {
    state,
    stateLabel: state,
    source: 'local',
    map: null,
    mapSplash: null,
    mode: '',
    matchId: '',
    selfTeam: 'Blue',
    side: null,
    players: Object.values(teams).flat(),
    teams,
    teamStats: {},
    winProb: null,
    parties: [],
    partyDetection: null,
    score: null,
    lockProgress: null,
  };
}

describe('splitTeams PREGAME boundary', () => {
  it('returns the ally team during PREGAME', () => {
    const teams = {
      Blue: [player('self', 'Blue'), player('a1', 'Blue')],
      Red: [player('e1', 'Red'), player('e2', 'Red')],
    };
    const result = splitTeams(boardWith('PREGAME', teams));
    expect(result.ally).toHaveLength(2);
    expect(result.ally.map((p) => p.team)).toEqual(['Blue', 'Blue']);
  });

  it('hides enemy data during PREGAME even when the fixture supplies it', () => {
    const teams = {
      Blue: [player('self', 'Blue'), player('a1', 'Blue')],
      Red: [player('e1', 'Red'), player('e2', 'Red')],
    };
    const result = splitTeams(boardWith('PREGAME', teams));
    expect(result.enemy).toHaveLength(0);
  });

  it('reveals both teams during INGAME', () => {
    const teams = {
      Blue: [player('self', 'Blue'), player('a1', 'Blue')],
      Red: [player('e1', 'Red'), player('e2', 'Red')],
    };
    const result = splitTeams(boardWith('INGAME', teams));
    expect(result.enemy).toHaveLength(2);
    expect(result.enemy.map((p) => p.team)).toEqual(['Red', 'Red']);
  });
});
