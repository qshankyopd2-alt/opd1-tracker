// Dev-only design preview fixtures.
// These mirror the backend payload shapes but are clearly synthetic.
// They are NEVER used in production builds. The harness is gated by
// import.meta.env.DEV and a dedicated env flag, and is never wired
// into the live data path (LiveDataContext still gates on source === "local").

import type {
  Career,
  CareerMatch,
  CareerTeammate,
  DetailPlayer,
  HistoryPoint,
  Inventory,
  InventoryItem,
  LiveBoard,
  LivePlayer,
  MatchDetail,
  MatchMeta,
  Party,
  PartyDetection,
  PerformancePayload,
  PerformanceSummary,
  RankChange,
  SavedPlayer,
  SavedPlayersPayload,
} from "../api/types";

const RANK = (tier: number) => {
  const groups = [
    { name: "Unranked", color: "#4A4A4A", count: 3 },
    { name: "Iron", color: "#5A5751", count: 3 },
    { name: "Bronze", color: "#BB8F5A", count: 3 },
    { name: "Silver", color: "#AEB2B2", count: 3 },
    { name: "Gold", color: "#C5BA3F", count: 3 },
    { name: "Platinum", color: "#18A7B9", count: 3 },
    { name: "Diamond", color: "#D864C7", count: 3 },
    { name: "Ascendant", color: "#189452", count: 3 },
    { name: "Immortal", color: "#DD4444", count: 3 },
    { name: "Radiant", color: "#FFFDCD", count: 1 },
  ];
  let acc = 0;
  for (const g of groups) {
    if (tier < acc + g.count) {
      const i = tier - acc + 1;
      const name = g.name === "Unranked" || g.name === "Radiant" ? g.name : `${g.name} ${i}`;
      return { tier, name, color: g.color, group: g.name };
    }
    acc += g.count;
  }
  return { tier: 27, name: "Radiant", color: "#FFFDCD", group: "Radiant" };
};

const AGENT_ROSTER: { name: string; role: string; color: string; portrait: string }[] = [
  { name: "Jett", role: "Duelist", color: "#9DDDE6", portrait: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png" },
  { name: "Reyna", role: "Duelist", color: "#8B5CF6", portrait: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png" },
  { name: "Phoenix", role: "Duelist", color: "#F97316", portrait: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f02e33d6/displayicon.png" },
  { name: "Raze", role: "Duelist", color: "#F59E0B", portrait: "https://media.valorant-api.com/agents/cee12a40-4c1d-03a9-6f1c-8c89c54a6d16/displayicon.png" },
  { name: "Yoru", role: "Duelist", color: "#3B82F6", portrait: "https://media.valorant-api.com/agents/7fafd45c-41b2-ed84-fb06-233fe76e7a0a/displayicon.png" },
  { name: "Neon", role: "Duelist", color: "#22D3EE", portrait: "https://media.valorant-api.com/agents/bb2a4822-4eb5-c1ea-4687-4f7f9c0c1c3a/displayicon.png" },
  { name: "Iso", role: "Duelist", color: "#FDE68A", portrait: "https://media.valorant-api.com/agents/0e38ee55-3d2c-72b3-1c5b-7a1e6c0b3f11/displayicon.png" },
  { name: "Omen", role: "Controller", color: "#A78BFA", portrait: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-7185256d61c5/displayicon.png" },
  { name: "Brimstone", role: "Controller", color: "#FB923C", portrait: "https://media.valorant-api.com/agents/9f0d8ba9-4af1-5cd2-8e2c-7b9a7b3b0c1c/displayicon.png" },
  { name: "Viper", role: "Controller", color: "#10B981", portrait: "https://media.valorant-api.com/agents/707eab51-4c30-7d0a-9f1c-7a3c0b2c1a4d/displayicon.png" },
  { name: "Cypher", role: "Sentinel", color: "#F4D35E", portrait: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png" },
  { name: "Killjoy", role: "Sentinel", color: "#FACC15", portrait: "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93f9-0dba99f4bbf7/displayicon.png" },
  { name: "Sage", role: "Sentinel", color: "#22D3EE", portrait: "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca0a-22f7b9b2c8b6/displayicon.png" },
  { name: "Sova", role: "Initiator", color: "#60A5FA", portrait: "https://media.valorant-api.com/agents/ded3520f-4264-bfed-162d-3b6c1e9b3a3e/displayicon.png" },
  { name: "Skye", role: "Initiator", color: "#84CC16", portrait: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-0c36-b1d9d7b1d2a3/displayicon.png" },
];

const MAPS: { name: string; splash: string }[] = [
  { name: "Haven", splash: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6043/splash.png" },
  { name: "Bind", splash: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2931-8c9c4a06b15f/splash.png" },
  { name: "Split", splash: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png" },
  { name: "Ascent", splash: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06bf31a/splash.png" },
  { name: "Icebox", splash: "https://media.valorant-api.com/maps/e2ad5c54-4d3a-bb81-5ff6-2c1b1a7c0a5a/splash.png" },
  { name: "Breeze", splash: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-1a7b-3b3a-0c1c2d3e4f50/splash.png" },
  { name: "Fracture", splash: "https://media.valorant-api.com/maps/b529448c-4c60-e1c7-4b3a-9c3a4c1b1d2e/splash.png" },
  { name: "Pearl", splash: "https://media.valorant-api.com/maps/fd267378-4d2d-bb1c-1b6c-7a8c5b3a0c4e/splash.png" },
  { name: "Lotus", splash: "https://media.valorant-api.com/maps/2c3a8a9c-4d7e-1b2a-8b1c-0a1b2c3d4e5f/splash.png" },
  { name: "Sunset", splash: "https://media.valorant-api.com/maps/2c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f/splash.png" },
  { name: "Abyss", splash: "https://media.valorant-api.com/maps/2c5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a/splash.png" },
];

const SAMPLE_NAMES = [
  "TenZ", "SicK", "Zekken", "Suygetsu", "Marved", "Asuna", "yay", "Leaf", "Boostio", "Derke",
  "cNed", "Alfajer", "kaajak", "cambzz", "keznit", "Boaster", "Mixwell", "SUYGETSU",
  "Trent", "Tarik", "ShahZaM", "SicK", "Vanquish", "Wardell", "Subroza", "Dazed",
];

const SAMPLE_PLAYER_CARDS = [
  "https://media.valorant-api.com/playercards/9fb348bc-4a0c-c0d1-9b3e-3a2b1c0d4e5f/wideart.png",
  "https://media.valorant-api.com/playercards/1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d/wideart.png",
];

const SAMPLE_RANK_ICONS: Record<number, string> = {
  3: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/3/smallicon.png",
  6: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/6/smallicon.png",
  9: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/9/smallicon.png",
  12: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/12/smallicon.png",
  15: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/15/smallicon.png",
  18: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/18/smallicon.png",
  21: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/21/smallicon.png",
  24: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/24/smallicon.png",
  27: "https://media.valorant-api.com/competitivetiers/0e2ee288-4d12-3b53-9a3b-2e9b8c1d4e5f/27/smallicon.png",
};

const SAMPLE_WEAPON_SKINS: Record<string, string[]> = {
  Vandal: [
    "Araxys Vandal",
    "Champions 2022 Vandal",
    "Kuronami Vandal",
    "Reaver Vandal",
    "Sovereign Vandal",
    "Elderflame Vandal",
    "Oni Vandal",
  ],
  Phantom: [
    "Champions Phantom",
    "Reaver Phantom",
    "Kuronami Phantom",
    "Spectrum Phantom",
    "Magepunk Phantom",
    "Ruination Phantom",
  ],
  Operator: [
    "Araxys Operator",
    "Kuronami Operator",
    "Reaver Operator",
    "Elderflame Operator",
    "Sovereign Operator",
  ],
  Melee: [
    "Kuronami No-Weapon",
    "Champions 2022 Melee",
    "Reaver Karambit",
    "Glitchpop Dagger",
  ],
};

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function makePlayer(index: number, opts: {
  name?: string;
  team: "ally" | "enemy";
  tier: number;
  isSelf?: boolean;
  party?: number | null;
  smurf?: boolean;
  kdKnown?: boolean;
  nameHidden?: boolean;
  longName?: boolean;
  radiant?: boolean;
  lowLevel?: boolean;
  winStreak?: boolean;
  agentOverride?: number;
  saved?: boolean;
  note?: string;
}): LivePlayer {
  const r = RANK(opts.tier);
  const agent = opts.agentOverride !== undefined ? AGENT_ROSTER[opts.agentOverride] : pick(AGENT_ROSTER, index);
  const peakTier = Math.max(0, opts.tier - 1 - (index % 3));
  const peakR = RANK(peakTier);
  const prevR = RANK(Math.max(0, opts.tier - 2));
  const kd = opts.kdKnown ? 0.78 + (index * 0.13) % 1.4 : null;
  const games = 12 + (index * 7) % 80;
  const winRate = 30 + (index * 11) % 60;
  const weapons: LivePlayer["weapons"] = [
    { weapon: "Vandal", skin: { name: pick(SAMPLE_WEAPON_SKINS.Vandal, index), icon: null } },
    { weapon: "Phantom", skin: { name: pick(SAMPLE_WEAPON_SKINS.Phantom, index + 1), icon: null } },
    { weapon: "Operator", skin: { name: pick(SAMPLE_WEAPON_SKINS.Operator, index + 2), icon: null } },
    { weapon: "Melee", skin: { name: pick(SAMPLE_WEAPON_SKINS.Melee, index + 3), icon: null } },
  ];
  const form: ("W" | "L")[] = [];
  for (let i = 0; i < 5; i++) form.push(((index + i) % 2 === 0 ? "W" : "L"));
  const isSelf = Boolean(opts.isSelf);
  return {
    puuid: `puuid-${opts.team}-${index}`,
    name: opts.longName
      ? "XxX_" + (opts.name ?? pick(SAMPLE_NAMES, index)) + "_LONG_RADIANT_Pro_2026_XxX"
      : opts.nameHidden
        ? "HiddenPlayer#????"
        : opts.name ?? pick(SAMPLE_NAMES, index),
    nameHidden: Boolean(opts.nameHidden),
    team: opts.team === "ally" ? "Blue" : "Red",
    isSelf,
    title: pick(["The One Who Waits", "VCT Champion", "Challenger", "Headhunter", null, null], index),
    playerCard: pick(SAMPLE_PLAYER_CARDS, index),
    agent: agent.name,
    agentId: agent.name.toLowerCase(),
    agentPortrait: agent.portrait,
    agentArt: agent.portrait,
    agentColor: agent.color,
    role: agent.role,
    selection: opts.team === "ally" && !isSelf && (index % 3 === 0) ? "locked" : null,
    rankTier: opts.tier,
    rank: r.name,
    rankColor: r.color,
    rankGroup: r.group,
    rankIcon: SAMPLE_RANK_ICONS[opts.tier] ?? null,
    rr: opts.tier > 2 ? 30 + (index * 13) % 70 : 0,
    rrEarned: index % 4 === 0 ? null : (index % 2 === 0 ? 24 : -19),
    leaderboard: opts.radiant ? index + 5 : 0,
    peakRankTier: peakTier,
    peakRank: peakR.name,
    peakColor: peakR.color,
    peakIcon: SAMPLE_RANK_ICONS[peakTier] ?? null,
    peakAct: "Episode 7 Act 2",
    previousRank: prevR.name,
    winRate,
    games,
    kd,
    hsPct: 18 + (index * 7) % 35,
    recentMatches: 5,
    skin: null,
    weapons,
    level: opts.lowLevel ? 18 : 150 + (index * 11) % 350,
    levelHidden: false,
    party: opts.party != null
      ? { id: `party-${opts.party}`, color: pick(["#3B82F6", "#8B5CF6", "#EC4899", "#10B981"], opts.party - 1), number: opts.party }
      : null,
    smurf: Boolean(opts.smurf),
    smurfReasons: opts.smurf
      ? [
          `Level 22 vs ${r.name} peak`,
          `Recent K/D 2.84 across 7 games`,
          `Headshot 41% on Phantom mains`,
        ]
      : [],
    topAgents: AGENT_ROSTER.slice(index, index + 3).map((a) => ({ agent: a.name, games: 30 + (index * 5) % 50 })),
    form,
    streak: opts.winStreak
      ? { type: "W", count: 4 + (index % 4) }
      : index % 5 === 0
        ? { type: "L", count: 2 + (index % 3) }
        : null,
    mapWinRate: { winRate: 40 + (index * 9) % 50, games: 18 + (index * 3) % 30 },
    encounter: opts.team === "enemy"
      ? {
          withCount: 4 + (index % 5),
          againstCount: 11 + (index % 6),
          winsWith: 2 + (index % 3),
          lossesWith: 1 + (index % 2),
          winsAgainst: 5 + (index % 4),
          lossesAgainst: 6 + (index % 3),
        }
      : null,
    saved: Boolean(opts.saved),
    savedNote: opts.note,
  };
}

function partiesFor(players: LivePlayer[]): Party[] {
  const groups = new Map<number, LivePlayer[]>();
  for (const p of players) {
    if (!p.party) continue;
    const list = groups.get(p.party.number) ?? [];
    list.push(p);
    groups.set(p.party.number, list);
  }
  const result: Party[] = [];
  let i = 0;
  for (const [number, list] of groups) {
    const ref = list[0].party!;
    result.push({
      id: ref.id,
      number,
      color: ref.color,
      size: list.length,
      declaredSize: list.length + 1,
      members: list.map((p) => p.puuid),
    });
    i++;
  }
  return result;
}

function teamStatsFor(players: LivePlayer[]): LiveBoard["teamStats"][string] {
  const tierSum = players.reduce((s, p) => s + p.rankTier, 0);
  const kdVals = players.map((p) => p.kd).filter((v): v is number => v !== null);
  const wrVals = players.map((p) => p.winRate).filter((v): v is number => v !== null);
  const avgTier = players.length ? Math.round(tierSum / players.length) : 0;
  const r = RANK(avgTier);
  return {
    avgRankTier: avgTier,
    avgRank: r.name,
    rankColor: r.color,
    rankIcon: SAMPLE_RANK_ICONS[avgTier] ?? null,
    avgKd: kdVals.length ? kdVals.reduce((a, b) => a + b, 0) / kdVals.length : null,
    avgWinRate: wrVals.length ? wrVals.reduce((a, b) => a + b, 0) / wrVals.length : null,
    smurfCount: players.filter((p) => p.smurf).length,
    size: players.length,
  };
}

function makeBoard(state: "MENUS" | "PREGAME" | "INGAME" | "OFFLINE", seed: number): LiveBoard {
  const map = pick(MAPS, seed);
  const allyPlayers: LivePlayer[] = [
    makePlayer(0, { team: "ally", tier: 24, isSelf: true, kdKnown: true, winStreak: true }),
    makePlayer(1, { team: "ally", tier: 21, party: 1 }),
    makePlayer(2, { team: "ally", tier: 20, party: 1, longName: true }),
    makePlayer(3, { team: "ally", tier: 18, party: 2, kdKnown: true }),
    makePlayer(4, { team: "ally", tier: 16, party: 2, lowLevel: true, smurf: true, saved: true, note: "Insane Jett, possibly boosting" }),
  ];
  const enemyPlayers: LivePlayer[] = state === "PREGAME"
    ? []
    : [
        makePlayer(5, { team: "enemy", tier: 25, radiant: true, kdKnown: true, nameHidden: true }),
        makePlayer(6, { team: "enemy", tier: 22, party: 1 }),
        makePlayer(7, { team: "enemy", tier: 21, party: 1 }),
        makePlayer(8, { team: "enemy", tier: 19, party: 2, smurf: true, kdKnown: true }),
        makePlayer(9, { team: "enemy", tier: 17, party: 2, name: "VeryLongEnemyName#9999" }),
      ];
  const allPlayers = [...allyPlayers, ...enemyPlayers];
  const parties = partiesFor(allPlayers);
  const detection: PartyDetection = {
    status: "complete",
    expectedPlayers: 10,
    presencePlayers: 10,
    decodedPlayers: 10,
    partyDataPlayers: 10,
    teams: {
      Blue: { status: "complete", expectedPlayers: 5, presencePlayers: 5, decodedPlayers: 5, partyDataPlayers: 5 },
      Red: state === "PREGAME"
        ? { status: "unavailable", expectedPlayers: 5, presencePlayers: 0, decodedPlayers: 0, partyDataPlayers: 0 }
        : { status: "complete", expectedPlayers: 5, presencePlayers: 5, decodedPlayers: 5, partyDataPlayers: 5 },
    },
  };
  return {
    state,
    stateLabel:
      state === "INGAME" ? "In Game" :
      state === "PREGAME" ? "Agent Select" :
      state === "MENUS" ? "In Lobby" : "Offline",
    source: "local",
    map: state === "MENUS" ? null : map.name,
    mapSplash: state === "MENUS" ? null : map.splash,
    mode: state === "MENUS" ? "Custom" : "Competitive",
    matchId: "preview-match-1",
    selfTeam: "Blue",
    side: state === "INGAME" ? "Attacker" : null,
    players: allPlayers,
    teams: { Blue: allyPlayers, Red: enemyPlayers },
    teamStats: {
      Blue: teamStatsFor(allyPlayers),
      Red: teamStatsFor(enemyPlayers),
    },
    winProb: state === "INGAME" ? 58 : null,
    parties,
    partyDetection: detection,
    score: state === "INGAME" ? { ally: 8, enemy: 6, round: 15 } : null,
    lockProgress: state === "PREGAME" ? { locked: 3, total: 5 } : null,
    queue: state === "MENUS" ? { available: true, queueName: "Competitive", inQueue: false, partySize: 3 } : undefined,
    selfPuuid: "puuid-ally-0",
    sourceDetail: "Live VALORANT client",
    appVersion: "1.0.2-preview",
  };
}

function makeCareer(): Career {
  const now = Date.now();
  const matches: CareerMatch[] = [];
  const maps = MAPS.slice(0, 6);
  const teammates: CareerTeammate[] = [
    { puuid: "teammate-1", name: "Boostio", agent: "Jett", kills: 18, deaths: 11, assists: 6, acs: 246 },
    { puuid: "teammate-2", name: "SicK", agent: "Killjoy", kills: 14, deaths: 13, assists: 9, acs: 198 },
    { puuid: "teammate-3", name: "Marved", agent: "Omen", kills: 12, deaths: 15, assists: 16, acs: 188 },
  ];
  for (let i = 0; i < 8; i++) {
    const m = maps[i % maps.length];
    const isWin = i % 2 === 0;
    matches.push({
      matchId: `preview-match-${i}`,
      map: m.name,
      mapSplash: m.splash,
      mode: "Competitive",
      startMillis: now - i * 1000 * 60 * 60 * 18,
      result: isWin ? "Victory" : "Defeat",
      score: isWin ? 13 : 9,
      opponentScore: isWin ? 7 : 13,
      agent: AGENT_ROSTER[i % AGENT_ROSTER.length].name,
      agentPortrait: AGENT_ROSTER[i % AGENT_ROSTER.length].portrait,
      agentColor: AGENT_ROSTER[i % AGENT_ROSTER.length].color,
      kills: 14 + (i * 3) % 12,
      deaths: 10 + (i * 4) % 9,
      assists: 4 + (i * 5) % 11,
      kd: 0.9 + (i % 5) * 0.18,
      acs: 180 + (i * 11) % 90,
      hsPct: 22 + (i * 3) % 28,
      partySize: 1 + (i % 3),
      scores: { Blue: isWin ? 13 : 9, Red: isWin ? 7 : 13 },
      teammates: i % 2 === 0 ? teammates : [],
      rrDelta: isWin ? 22 + (i * 2) % 8 : -18 - (i * 2) % 6,
      tierAfter: 22 - (i % 3),
      rrAfter: 30 + (i * 7) % 60,
      rankAfter: RANK(22 - (i % 3)).name,
      rankColor: RANK(22 - (i % 3)).color,
      rankIcon: SAMPLE_RANK_ICONS[22 - (i % 3)] ?? null,
    });
  }
  const averages: Career["averages"] = {
    games: matches.length,
    wins: matches.filter((m) => m.result === "Victory").length,
    winRate: 0.55,
    kills: 19.4,
    deaths: 13.6,
    assists: 7.5,
    kd: 1.42,
    hsPct: 0.31,
  };
  return {
    source: "local",
    puuid: "preview-self",
    matches,
    averages,
    coPlayers: [
      { puuid: "teammate-1", name: "Boostio", sharedMatches: 6, agents: ["Jett", "Raze"], isParty: true },
      { puuid: "teammate-2", name: "SicK", sharedMatches: 4, agents: ["Killjoy", "Cypher"], isParty: false },
      { puuid: "teammate-3", name: "Marved", sharedMatches: 3, agents: ["Omen"], isParty: false },
    ],
    agentPool: [
      { agent: "Jett", games: 28, winRate: 64, portrait: AGENT_ROSTER[0].portrait, color: AGENT_ROSTER[0].color },
      { agent: "Reyna", games: 14, winRate: 51, portrait: AGENT_ROSTER[1].portrait, color: AGENT_ROSTER[1].color },
      { agent: "Omen", games: 9, winRate: 44, portrait: AGENT_ROSTER[7].portrait, color: AGENT_ROSTER[7].color },
    ],
    mapStats: maps.slice(0, 5).map((m, i) => ({
      map: m.name,
      games: 6 + i,
      wins: 4 - (i % 2),
      winRate: 50 + (i * 7) % 30,
    })),
  };
}

function makePerformance(): PerformancePayload {
  const now = Date.now();
  const points: HistoryPoint[] = [];
  const maps = MAPS.slice(0, 6);
  const agents = AGENT_ROSTER;
  for (let i = 0; i < 22; i++) {
    const isWin = i % 2 === 0;
    const m = maps[i % maps.length];
    const a = agents[i % agents.length];
    points.push({
      matchId: `preview-match-${i}`,
      ts: Math.floor((now - i * 1000 * 60 * 60 * 14) / 1000),
      map: m.name,
      mapSplash: m.splash,
      mode: "Competitive",
      result: isWin ? "Victory" : "Defeat",
      resultExact: true,
      delta: isWin ? 22 + (i * 2) % 7 : -18 - (i * 2) % 5,
      tier: 22 - (i % 3),
      rr: 30 + (i * 7) % 60,
      agent: a.name,
      agentPortrait: a.portrait,
      agentColor: a.color,
      partySize: 1 + (i % 3),
      scores: { Blue: isWin ? 13 : 7, Red: isWin ? 7 : 13 },
      kills: 14 + (i * 3) % 12,
      deaths: 10 + (i * 4) % 9,
      assists: 4 + (i * 5) % 11,
      kd: 0.9 + (i % 5) * 0.18,
      acs: 180 + (i * 11) % 90,
      hsPct: 22 + (i * 3) % 28,
      source: "career",
    });
  }
  const current = RANK(23);
  const next = RANK(24);
  const summary: PerformanceSummary = {
    matches: points.length,
    wins: points.filter((p) => p.result === "Victory").length,
    losses: points.filter((p) => p.result === "Defeat").length,
    winRate: 0.55,
    net: 42,
    avgWin: 23,
    avgLoss: -19,
    current: { ...current, rr: 78, tier: 23 },
    next: { ...next, rrNeeded: 22, progress: 78 },
    exactResults: points.length,
  };
  const splits = {
    maps: maps.map((m, i) => ({
      name: m.name,
      games: 6 + i,
      wins: 4 - (i % 2),
      losses: 2 + (i % 2),
      winRate: 50 + (i * 7) % 30,
      netRr: 18 - i * 2,
      avgKd: 1.1 + (i % 4) * 0.15,
      avgAcs: 200 + (i * 9) % 60,
      portrait: m.splash,
      color: null,
    })),
    agents: agents.slice(0, 6).map((a, i) => ({
      name: a.name,
      games: 14 + (i * 3) % 9,
      wins: 8 + (i % 4),
      losses: 4 + (i % 3),
      winRate: 50 + (i * 8) % 30,
      netRr: 22 - i * 3,
      avgKd: 1.0 + (i % 5) * 0.12,
      avgAcs: 195 + (i * 7) % 50,
      portrait: a.portrait,
      color: a.color,
    })),
    schedule: {
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, i) => ({
        name,
        games: 4 + (i * 3) % 6,
        wins: 2 + (i * 2) % 3,
        winRate: 50 + (i * 5) % 35,
        netRr: 8 - (i % 3) * 4,
      })),
      dayparts: [
        { name: "Morning", games: 6, wins: 4, winRate: 67, netRr: 22 },
        { name: "Afternoon", games: 10, wins: 6, winRate: 60, netRr: 14 },
        { name: "Evening", games: 18, wins: 11, winRate: 61, netRr: 30 },
        { name: "Night", games: 8, wins: 4, winRate: 50, netRr: -4 },
      ],
      calendar: [],
    },
  };
  const rankChanges: RankChange[] = [
    { matchId: "preview-match-2", ts: now / 1000 - 86400 * 2, fromTier: 21, toTier: 22, type: "promotion" },
    { matchId: "preview-match-5", ts: now / 1000 - 86400 * 5, fromTier: 22, toTier: 21, type: "demotion" },
    { matchId: "preview-match-9", ts: now / 1000 - 86400 * 9, fromTier: 20, toTier: 21, type: "promotion" },
    { matchId: "preview-match-14", ts: now / 1000 - 86400 * 14, fromTier: 19, toTier: 20, type: "promotion" },
  ];
  const matchMeta: Record<string, MatchMeta> = {
    "preview-match-0": { note: "Tight 13-11 win, good reads on Ascent", tags: ["Ascent", "W"], bookmarked: true, updatedAt: now - 3600 * 1000 },
    "preview-match-3": { note: "", tags: [], bookmarked: false, updatedAt: now - 86400 * 1000 },
  };
  return {
    version: 1,
    account: { puuid: "preview-self", riotId: "TenZ#NA1", timezone: "UTC" },
    points,
    summary,
    insights: [
      { title: "Strong on Haven", text: "84% win rate over 6 matches — keep queuing here.", tone: "pos", samples: 6, confidence: "medium" },
      { title: "Struggling on Icebox", text: "33% win rate in the last 5 attempts.", tone: "neg", samples: 5, confidence: "low" },
      { title: "Jett main identity", text: "Jett accounts for 56% of your ranked games this act.", tone: "neutral", samples: 24, confidence: "high" },
    ],
    insightsMinimum: 10,
    timezone: "UTC",
    dataQuality: { exact: 22, estimated: 0 },
    rankIcons: SAMPLE_RANK_ICONS,
    mapSplashes: Object.fromEntries(MAPS.map((m) => [m.name, m.splash])),
    splits,
    actComparison: {
      current: { id: "ep8a1", ...summary, current: { ...current, rr: 78, tier: 23 }, next: { ...next, rrNeeded: 22, progress: 78 } },
      previous: { id: "ep7a3", matches: 18, wins: 11, losses: 7, winRate: 0.61, net: 36, avgWin: 24, avgLoss: -20, current: { ...RANK(22), rr: 100, tier: 22 }, next: null, exactResults: 18 },
    },
    rankChanges,
    personalBests: { bestRrMatch: "preview-match-1", bestRr: 28, bestAcsMatch: "preview-match-2", bestAcs: 312, highestTier: 23, highestRr: 88 },
    enrichment: { rich: 22, target: 22, updatedAt: now, error: false },
    backfill: { matches: 22, updatedAt: now, error: false },
    sessions: {
      active: {
        id: "session-1",
        startedAt: now - 3600 * 1000,
        points: points.slice(0, 4).map((p) => ({
          matchId: p.matchId,
          ts: p.ts,
          map: p.map,
          mode: p.mode,
          result: p.result ?? undefined,
          delta: p.delta ?? null,
          tier: p.tier ?? null,
          rr: p.rr ?? null,
          agent: p.agent,
          kd: p.kd,
          acs: p.acs,
        })),
        summary: { matches: 4, wins: 3, losses: 1, winRate: 0.75, net: 12, currentTier: 23, currentRr: 78 },
      },
      archive: [],
    },
    matchMeta,
    encounters: [],
  };
}

function makeEncounters(): SavedPlayersPayload {
  const now = Date.now();
  const players: SavedPlayer[] = [
    {
      puuid: "enc-1",
      name: "Boostio",
      saved: true,
      note: "Plays Jett / Raze, very aggressive, always duels B main on Haven",
      savedAt: now - 86400 * 6 * 1000,
      updatedAt: now - 86400 * 1000,
      withCount: 6, againstCount: 2,
      winsWith: 4, lossesWith: 2,
      winsAgainst: 1, lossesAgainst: 1,
      rank: "Diamond 2", peakRank: "Immortal 1",
      rankTier: 20, peakTier: 24,
      rankIcon: SAMPLE_RANK_ICONS[20] ?? null, rankColor: RANK(20).color,
      kd: 1.32, winRate: 56, level: 247,
      lastSeen: now - 86400 * 1000,
      agents: ["Jett", "Raze", "Reyna"],
      withKd: 1.4, withAcs: 248, withHsPct: 31, withStatGames: 6,
      topAgent: "Jett", topAgentGames: 32,
      topAgentPortrait: AGENT_ROSTER[0].portrait, topAgentColor: AGENT_ROSTER[0].color,
      accountsSeen: ["boostio#NA1"],
      timeline: [
        { matchId: "preview-match-1", at: now - 86400 * 1000, side: "with", result: "win", agent: "Jett", map: "Haven" },
        { matchId: "preview-match-2", at: now - 86400 * 2 * 1000, side: "with", result: "win", agent: "Raze", map: "Bind" },
        { matchId: "preview-match-3", at: now - 86400 * 4 * 1000, side: "with", result: "loss", agent: "Jett", map: "Ascent" },
        { matchId: "preview-match-4", at: now - 86400 * 5 * 1000, side: "against", result: "loss", agent: "Jett", map: "Split" },
      ],
    },
    {
      puuid: "enc-2",
      name: "SicK",
      saved: true,
      note: "Solid sentinel. Watches flank consistently. Friends with Boostio.",
      savedAt: now - 86400 * 14 * 1000,
      updatedAt: now - 86400 * 3 * 1000,
      withCount: 4, againstCount: 5,
      winsWith: 3, lossesWith: 1,
      winsAgainst: 2, lossesAgainst: 3,
      rank: "Platinum 3", peakRank: "Diamond 2",
      rankTier: 15, peakTier: 20,
      rankIcon: SAMPLE_RANK_ICONS[15] ?? null, rankColor: RANK(15).color,
      kd: 1.05, winRate: 52, level: 178,
      lastSeen: now - 86400 * 3 * 1000,
      agents: ["Killjoy", "Cypher"],
      withKd: 1.18, withAcs: 198, withHsPct: 24, withStatGames: 4,
      topAgent: "Killjoy", topAgentGames: 21,
      topAgentPortrait: AGENT_ROSTER[11].portrait, topAgentColor: AGENT_ROSTER[11].color,
      accountsSeen: ["sick#NA1"],
      timeline: [
        { matchId: "preview-match-5", at: now - 86400 * 3 * 1000, side: "with", result: "win", agent: "Killjoy", map: "Ascent" },
        { matchId: "preview-match-6", at: now - 86400 * 7 * 1000, side: "against", result: "loss", agent: "Cypher", map: "Bind" },
      ],
    },
    {
      puuid: "enc-3",
      name: "Vanquish",
      saved: true,
      note: "Toxic, smurfs on new accounts, rage quits when losing. Avoid in voice.",
      savedAt: now - 86400 * 30 * 1000,
      updatedAt: now - 86400 * 2 * 1000,
      withCount: 1, againstCount: 8,
      winsWith: 0, lossesWith: 1,
      winsAgainst: 3, lossesAgainst: 5,
      rank: "Ascendant 1", peakRank: "Immortal 2",
      rankTier: 21, peakTier: 25,
      rankIcon: SAMPLE_RANK_ICONS[21] ?? null, rankColor: RANK(21).color,
      kd: 1.78, winRate: 58, level: 312,
      lastSeen: now - 86400 * 2 * 1000,
      agents: ["Jett", "Phoenix", "Raze"],
      withKd: 0.62, withAcs: 156, withHsPct: 28, withStatGames: 1,
      topAgent: "Jett", topAgentGames: 28,
      topAgentPortrait: AGENT_ROSTER[0].portrait, topAgentColor: AGENT_ROSTER[0].color,
      accountsSeen: ["vanquish1#NA1", "vq2#NA1"],
      timeline: [],
    },
  ];
  return { accountPuuid: "preview-self", players };
}

function makeInventory(): Inventory {
  const top: InventoryItem[] = [
    { name: "Champions 2022 Vandal", icon: null, vp: 17750, tier: "Ultra" },
    { name: "Kuronami Vandal", icon: null, vp: 12750, tier: "Exclusive" },
    { name: "Reaver Phantom", icon: null, vp: 8750, tier: "Premium" },
    { name: "Araxys Operator", icon: null, vp: 8750, tier: "Premium" },
    { name: "Elderflame Operator", icon: null, vp: 12750, tier: "Exclusive" },
    { name: "Glitchpop Dagger", icon: null, vp: 5350, tier: "Premium" },
  ];
  const recent: InventoryItem[] = [
    { name: "Spectrum Phantom", icon: null, vp: 5350, tier: "Deluxe" },
    { name: "Magepunk Phantom", icon: null, vp: 7100, tier: "Premium" },
  ];
  return {
    available: true,
    totalVp: 286450,
    usdApprox: 2245,
    wallet: { vp: 1240, rad: 320, kc: 8500 },
    counts: { skins: 142, earned: 38, buddies: 12, cards: 24, sprays: 31, agents: 19 },
    tiers: {
      Ultra: { skins: 6, vp: 88000 },
      Exclusive: { skins: 18, vp: 145200 },
      Premium: { skins: 42, vp: 41200 },
      Deluxe: { skins: 51, vp: 9850 },
      Select: { skins: 25, vp: 2200 },
    },
    top,
    recent,
    at: Date.now(),
  };
}

function makeMatchDetail(): MatchDetail {
  const teams = {
    Blue: [
      makePlayer(0, { team: "ally", tier: 23, isSelf: true, kdKnown: true }),
      makePlayer(1, { team: "ally", tier: 22, party: 1 }),
      makePlayer(2, { team: "ally", tier: 21, party: 1 }),
      makePlayer(3, { team: "ally", tier: 19, party: 2 }),
      makePlayer(4, { team: "ally", tier: 17, party: 2 }),
    ],
    Red: [
      makePlayer(5, { team: "enemy", tier: 24, radiant: true, kdKnown: true }),
      makePlayer(6, { team: "enemy", tier: 22, party: 1 }),
      makePlayer(7, { team: "enemy", tier: 21, party: 1 }),
      makePlayer(8, { team: "enemy", tier: 19, smurf: true, kdKnown: true }),
      makePlayer(9, { team: "enemy", tier: 18 }),
    ],
  };
  const detailPlayers: DetailPlayer[] = Object.values(teams).flat().map((p, i) => {
    const kills = 14 + (i * 3) % 14;
    const deaths = 10 + (i * 4) % 9;
    const assists = 4 + (i * 5) % 11;
    return {
      puuid: p.puuid,
      name: p.name,
      team: p.team,
      agent: p.agent ?? "—",
      agentPortrait: p.agentPortrait,
      agentColor: p.agentColor,
      kills, deaths, assists,
      kd: +(kills / Math.max(1, deaths)).toFixed(2),
      acs: 180 + (i * 11) % 90,
      hsPct: 22 + (i * 3) % 28,
      rankTier: p.rankTier,
      rank: p.rank,
      rankColor: p.rankColor,
      rankIcon: p.rankIcon,
      rr: p.rr,
      peakRankTier: p.peakRankTier,
      peakRank: p.peakRank,
      peakColor: p.peakColor,
      peakIcon: p.peakIcon,
      level: p.level,
      playerCard: p.playerCard,
      isSubject: p.isSelf,
      isMatchMvp: i === 0,
      isTeamMvp: i % 2 === 0,
    };
  });
  return {
    matchId: "preview-match-1",
    map: "Haven",
    mapSplash: MAPS[0].splash,
    mode: "Competitive",
    scores: { Blue: 13, Red: 9 },
    result: "Victory",
    players: detailPlayers,
    teamStats: {
      Blue: { avgRankTier: 20, avgRank: "Diamond 2", avgRankColor: RANK(20).color, rankIcon: SAMPLE_RANK_ICONS[20] ?? null },
      Red: { avgRankTier: 20, avgRank: "Diamond 2", avgRankColor: RANK(20).color, rankIcon: SAMPLE_RANK_ICONS[20] ?? null },
    },
  };
}

export interface PreviewSnapshot {
  board: LiveBoard;
  career: Career;
  performance: PerformancePayload;
  savedPlayers: SavedPlayersPayload;
  inventory: Inventory;
  matchDetail: MatchDetail;
  health: {
    ok: true;
    service: string;
    appVersion: string;
    dataSourcePreference: string;
    officialKey: boolean;
    clientStatus: "ok" | "not_running";
  };
}

export function makeSnapshot(state: "MENUS" | "PREGAME" | "INGAME" | "OFFLINE", seed: number): PreviewSnapshot {
  return {
    board: makeBoard(state, seed),
    career: makeCareer(),
    performance: makePerformance(),
    savedPlayers: makeEncounters(),
    inventory: makeInventory(),
    matchDetail: makeMatchDetail(),
    health: {
      ok: true,
      service: "opd1-tracker-backend",
      appVersion: "1.0.2-preview",
      dataSourcePreference: "local",
      officialKey: false,
      clientStatus: state === "OFFLINE" ? "not_running" : "ok",
    },
  };
}
