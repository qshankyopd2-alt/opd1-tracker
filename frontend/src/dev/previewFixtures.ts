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

type PreviewAgent = { id: string; name: string; role: string; color: string; portrait: string; art: string };

// Canonical records verified against valorant-api.com. Fixture data stays synthetic;
// only public VALORANT imagery is shared with the production asset catalog.
const AGENT_ROSTER: PreviewAgent[] = [
  { id: "add6443a-41bd-e414-f6ad-e58d267f4e95", name: "Jett", role: "Duelist", color: "#9ADEFF", portrait: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png", art: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/fullportrait.png" },
  { id: "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc", name: "Reyna", role: "Duelist", color: "#B565B5", portrait: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png", art: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/fullportrait.png" },
  { id: "eb93336a-449b-9c1b-0a54-a891f7921d69", name: "Phoenix", role: "Duelist", color: "#FE8266", portrait: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png", art: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/fullportrait.png" },
  { id: "f94c3b30-42be-e959-889c-5aa313dba261", name: "Raze", role: "Duelist", color: "#FFA400", portrait: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png", art: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/fullportrait.png" },
  { id: "7f94d92c-4234-0a36-9646-3a87eb8b5c89", name: "Yoru", role: "Duelist", color: "#2846C8", portrait: "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png", art: "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/fullportrait.png" },
  { id: "bb2a4828-46eb-8cd1-e765-15848195d751", name: "Neon", role: "Duelist", color: "#00CFFF", portrait: "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png", art: "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/fullportrait.png" },
  { id: "0e38b510-41a8-5780-5e8f-568b2a4f2d6c", name: "Iso", role: "Duelist", color: "#574AC2", portrait: "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png", art: "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/fullportrait.png" },
  { id: "8e253930-4c05-31dd-1b6c-968525494517", name: "Omen", role: "Controller", color: "#47508F", portrait: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png", art: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/fullportrait.png" },
  { id: "9f0d8ba9-4140-b941-57d3-a7ad57c6b417", name: "Brimstone", role: "Controller", color: "#D1691F", portrait: "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png", art: "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/fullportrait.png" },
  { id: "707eab51-4836-f488-046a-cda6bf494859", name: "Viper", role: "Controller", color: "#38C659", portrait: "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png", art: "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/fullportrait.png" },
  { id: "117ed9e3-49f3-6512-3ccf-0cada7e3823b", name: "Cypher", role: "Sentinel", color: "#E6D9C5", portrait: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png", art: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/fullportrait.png" },
  { id: "1e58de9c-4950-5125-93e9-a0aee9f98746", name: "Killjoy", role: "Sentinel", color: "#FFD91F", portrait: "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png", art: "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/fullportrait.png" },
  { id: "569fdd95-4d10-43ab-ca70-79becc718b46", name: "Sage", role: "Sentinel", color: "#26C8AF", portrait: "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png", art: "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/fullportrait.png" },
  { id: "320b2a48-4d9b-a075-30f1-1f93a9b638fa", name: "Sova", role: "Initiator", color: "#3BA0E5", portrait: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png", art: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/fullportrait.png" },
  { id: "6f2a04ca-43e0-be17-7f36-b3908627744d", name: "Skye", role: "Initiator", color: "#C0E69E", portrait: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png", art: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/fullportrait.png" },
];

const MAPS: { name: string; splash: string }[] = [
  { name: "Haven", splash: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png" },
  { name: "Bind", splash: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png" },
  { name: "Split", splash: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png" },
  { name: "Ascent", splash: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png" },
  { name: "Icebox", splash: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png" },
  { name: "Breeze", splash: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png" },
  { name: "Fracture", splash: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png" },
  { name: "Pearl", splash: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png" },
  { name: "Lotus", splash: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png" },
  { name: "Sunset", splash: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png" },
  { name: "Abyss", splash: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png" },
];

const SAMPLE_NAMES = [
  "NovaFlux", "MakoLine", "VexOrbit", "PixelRift", "KiteSignal", "EchoVector", "RookArc", "IrisFold", "SlateViper", "QuantaDash",
  "AxiomWave", "CinderByte", "LumenShift", "MossCircuit", "NexusBloom", "RiftMason", "SolaceGrid", "TalonFrame",
  "UmbraPulse", "VectorMoth", "WardenKite", "XenoScope", "YonderFox", "ZenithMako", "ArclightVex", "BastionRue",
];

const SAMPLE_PLAYER_CARDS = [
  "https://media.valorant-api.com/playercards/1711d20d-4b1c-c64a-14be-d4ae58a457c6/wideart.png",
  "https://media.valorant-api.com/playercards/c8b2f5fd-4331-b172-f3b7-c8a26f356a1f/wideart.png",
];

const SAMPLE_RANK_ICONS: Record<number, string> = {
  14: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/14/smallicon.png",
  15: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/15/smallicon.png",
  16: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/16/smallicon.png",
  17: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/17/smallicon.png",
  18: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/18/smallicon.png",
  19: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/19/smallicon.png",
  20: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/20/smallicon.png",
  21: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/smallicon.png",
  22: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/22/smallicon.png",
  23: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/23/smallicon.png",
  24: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/smallicon.png",
  25: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/25/smallicon.png",
  26: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/26/smallicon.png",
  27: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/smallicon.png",
};

type PreviewSkin = NonNullable<LivePlayer["weapons"][number]["skin"]>;

const SAMPLE_WEAPON_SKINS: Record<"Vandal" | "Phantom" | "Operator" | "Melee", PreviewSkin[]> = {
  Vandal: [
    { name: "Araxys Vandal", icon: "https://media.valorant-api.com/weaponskins/4c926aa9-4f26-bc80-c486-9b888333373f/displayicon.png" },
    { name: "Champions 2023 Vandal", icon: "https://media.valorant-api.com/weaponskins/b0f65660-4c51-13b7-9d01-e29a1e2879b0/displayicon.png" },
    { name: "Kuronami Vandal", icon: "https://media.valorant-api.com/weaponskins/d8d5d7a1-4d81-8560-54bc-0692ab40f69b/displayicon.png" },
    { name: "Reaver Vandal", icon: "https://media.valorant-api.com/weaponskins/30388628-42f0-606c-82c0-73ad43de997f/displayicon.png" },
    { name: "Oni Vandal", icon: "https://media.valorant-api.com/weaponskins/7156c2ee-41fc-f8f4-d457-ebb287965c08/displayicon.png" },
    { name: "Elderflame Vandal", icon: "https://media.valorant-api.com/weaponskins/18609205-4edb-5966-cff8-0fba0230ba1e/displayicon.png" },
  ],
  Phantom: [
    { name: "Champions 2022 Phantom", icon: "https://media.valorant-api.com/weaponskins/8c72ae0b-4357-1a75-ad62-fbaec7b64f92/displayicon.png" },
    { name: "Reaver Phantom", icon: "https://media.valorant-api.com/weaponskins/044b28ba-4c3b-d315-140d-d9a249da5567/displayicon.png" },
    { name: "Oni Phantom", icon: "https://media.valorant-api.com/weaponskins/36791b03-452d-8dad-0091-898cc28d2196/displayicon.png" },
    { name: "Spectrum Phantom", icon: "https://media.valorant-api.com/weaponskins/980fa063-436e-e51f-c38d-70a5b93a0f1c/displayicon.png" },
  ],
  Operator: [
    { name: "Araxys Operator", icon: "https://media.valorant-api.com/weaponskins/6db556e4-4255-6c2c-6a80-8a9dfac96aa9/displayicon.png" },
    { name: "Reaver Operator", icon: "https://media.valorant-api.com/weaponskins/aecab890-43b7-d719-06bc-9295e3d116dc/displayicon.png" },
    { name: "Elderflame Operator", icon: "https://media.valorant-api.com/weaponskins/d722313d-43cb-b38d-7841-75880a3ed2cb/displayicon.png" },
    { name: "Origin Operator", icon: "https://media.valorant-api.com/weaponskins/17831113-4ff0-a6c9-0b20-6f9c077d74a2/displayicon.png" },
  ],
  Melee: [
    { name: "Kuronami no Yaiba", icon: "https://media.valorant-api.com/weaponskins/e37229ed-4ddf-5e7e-e744-8fba60fa2c37/displayicon.png" },
    { name: "Champions 2022 Butterfly Knife", icon: "https://media.valorant-api.com/weaponskins/6946cd0e-4e4a-ec4f-9238-dfb71715722b/displayicon.png" },
    { name: "Reaver Karambit", icon: "https://media.valorant-api.com/weaponskins/b73d7b16-4652-bc5b-5c4c-068aabb19d0a/displayicon.png" },
    { name: "Glitchpop Dagger", icon: "https://media.valorant-api.com/weaponskins/ddc025b2-475f-889a-2800-80b4215582bc/displayicon.png" },
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
  const kd = +((0.78 + (index * 0.13) % 1.4).toFixed(2));
  const games = 12 + (index * 7) % 80;
  const winRate = 30 + (index * 11) % 60;
  const weapons: LivePlayer["weapons"] = [
    { weapon: "Vandal", skin: pick(SAMPLE_WEAPON_SKINS.Vandal, index) },
    { weapon: "Phantom", skin: pick(SAMPLE_WEAPON_SKINS.Phantom, index + 1) },
    { weapon: "Operator", skin: pick(SAMPLE_WEAPON_SKINS.Operator, index + 2) },
    { weapon: "Melee", skin: pick(SAMPLE_WEAPON_SKINS.Melee, index + 3) },
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
    title: pick(["The One Who Waits", "Arcane Archivist", "Challenger", "Headhunter", "Night Market Regular", "First Light"], index),
    playerCard: pick(SAMPLE_PLAYER_CARDS, index),
    agent: agent.name,
    agentId: agent.id,
    agentPortrait: agent.portrait,
    agentArt: agent.art,
    agentColor: agent.color,
    role: agent.role,
    selection: opts.team === "ally" && index < 3 ? "locked" : null,
    rankTier: opts.tier,
    rank: r.name,
    rankColor: r.color,
    rankGroup: r.group,
    rankIcon: SAMPLE_RANK_ICONS[opts.tier] ?? null,
    rr: opts.tier > 2 ? 30 + (index * 13) % 70 : 0,
    rrEarned: index % 2 === 0 ? 24 - (index % 4) : -17 - (index % 4),
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
    skin: weapons[0].skin,
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
    makePlayer(0, { team: "ally", tier: 24, isSelf: true, winStreak: true }),
    makePlayer(1, { team: "ally", tier: 21, party: 1 }),
    makePlayer(2, { team: "ally", tier: 20, party: 1, longName: true }),
    makePlayer(3, { team: "ally", tier: 18, party: 2 }),
    makePlayer(4, { team: "ally", tier: 16, party: 2, lowLevel: true, smurf: true, saved: true, note: "Insane Jett, possibly boosting" }),
  ];
  const enemyPlayers: LivePlayer[] = state === "PREGAME" || state === "MENUS"
    ? []
    : [
        makePlayer(5, { team: "enemy", tier: 25, radiant: true, nameHidden: true }),
        makePlayer(6, { team: "enemy", tier: 22, party: 1 }),
        makePlayer(7, { team: "enemy", tier: 21, party: 1 }),
        makePlayer(8, { team: "enemy", tier: 19, party: 2, smurf: true }),
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
    sourceDetail: "Synthetic Design Mode fixture",
    appVersion: "1.0.2-preview",
  };
}

function makeCareer(): Career {
  const now = Date.now();
  const matches: CareerMatch[] = [];
  const maps = MAPS.slice(0, 6);
  const teammates: CareerTeammate[] = [
    { puuid: "teammate-1", name: "NovaFlux", agent: "Jett", agentPortrait: AGENT_ROSTER[0].portrait, agentColor: AGENT_ROSTER[0].color, kills: 18, deaths: 11, assists: 6, acs: 246 },
    { puuid: "teammate-2", name: "MakoLine", agent: "Killjoy", agentPortrait: AGENT_ROSTER[11].portrait, agentColor: AGENT_ROSTER[11].color, kills: 14, deaths: 13, assists: 9, acs: 198 },
    { puuid: "teammate-3", name: "VexOrbit", agent: "Omen", agentPortrait: AGENT_ROSTER[7].portrait, agentColor: AGENT_ROSTER[7].color, kills: 12, deaths: 15, assists: 16, acs: 188 },
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
    winRate: 55,
    kills: 19.4,
    deaths: 13.6,
    assists: 7.5,
    kd: 1.42,
    hsPct: 31,
  };
  return {
    source: "local",
    puuid: "preview-self",
    matches,
    averages,
    coPlayers: [
      { puuid: "teammate-1", name: "NovaFlux", sharedMatches: 6, agents: ["Jett", "Raze"], isParty: true },
      { puuid: "teammate-2", name: "MakoLine", sharedMatches: 4, agents: ["Killjoy", "Cypher"], isParty: false },
      { puuid: "teammate-3", name: "VexOrbit", sharedMatches: 3, agents: ["Omen"], isParty: false },
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
    winRate: 55,
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
    account: { puuid: "preview-self", riotId: "Preview#OPD1", timezone: "UTC" },
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
      previous: { id: "ep7a3", matches: 18, wins: 11, losses: 7, winRate: 61, net: 36, avgWin: 24, avgLoss: -20, current: { ...RANK(22), rr: 100, tier: 22 }, next: null, exactResults: 18 },
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
        summary: { matches: 4, wins: 3, losses: 1, winRate: 75, net: 12, currentTier: 23, currentRr: 78 },
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
      name: "NovaFlux",
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
      accountsSeen: ["novaflux#preview"],
      timeline: [
        { matchId: "preview-match-1", at: now - 86400 * 1000, side: "with", result: "win", agent: "Jett", map: "Haven" },
        { matchId: "preview-match-2", at: now - 86400 * 2 * 1000, side: "with", result: "win", agent: "Raze", map: "Bind" },
        { matchId: "preview-match-3", at: now - 86400 * 4 * 1000, side: "with", result: "loss", agent: "Jett", map: "Ascent" },
        { matchId: "preview-match-4", at: now - 86400 * 5 * 1000, side: "against", result: "loss", agent: "Jett", map: "Split" },
      ],
    },
    {
      puuid: "enc-2",
      name: "MakoLine",
      saved: true,
      note: "Solid sentinel. Watches flank consistently. Queues regularly with NovaFlux.",
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
      accountsSeen: ["makoline#preview"],
      timeline: [
        { matchId: "preview-match-5", at: now - 86400 * 3 * 1000, side: "with", result: "win", agent: "Killjoy", map: "Ascent" },
        { matchId: "preview-match-6", at: now - 86400 * 7 * 1000, side: "against", result: "loss", agent: "Cypher", map: "Bind" },
      ],
    },
    {
      puuid: "enc-3",
      name: "RiftMason",
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
      accountsSeen: ["riftmason#preview", "masonalt#preview"],
      timeline: [],
    },
  ];
  return { accountPuuid: "preview-self", players };
}

function makeInventory(): Inventory {
  const top: InventoryItem[] = [
    { ...SAMPLE_WEAPON_SKINS.Vandal[1], vp: 5350, tier: "Ultra" },
    { ...SAMPLE_WEAPON_SKINS.Vandal[2], vp: 5350, tier: "Exclusive" },
    { ...SAMPLE_WEAPON_SKINS.Phantom[1], vp: 1775, tier: "Premium" },
    { ...SAMPLE_WEAPON_SKINS.Operator[0], vp: 2175, tier: "Premium" },
    { ...SAMPLE_WEAPON_SKINS.Operator[2], vp: 2475, tier: "Exclusive" },
    { ...SAMPLE_WEAPON_SKINS.Melee[3], vp: 5350, tier: "Premium" },
  ];
  const recent: InventoryItem[] = [
    { ...SAMPLE_WEAPON_SKINS.Phantom[3], vp: 2675, tier: "Deluxe" },
    { ...SAMPLE_WEAPON_SKINS.Phantom[2], vp: 1775, tier: "Premium" },
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
      makePlayer(0, { team: "ally", tier: 23, isSelf: true }),
      makePlayer(1, { team: "ally", tier: 22, party: 1 }),
      makePlayer(2, { team: "ally", tier: 21, party: 1 }),
      makePlayer(3, { team: "ally", tier: 19, party: 2 }),
      makePlayer(4, { team: "ally", tier: 17, party: 2 }),
    ],
    Red: [
      makePlayer(5, { team: "enemy", tier: 24, radiant: true }),
      makePlayer(6, { team: "enemy", tier: 22, party: 1 }),
      makePlayer(7, { team: "enemy", tier: 21, party: 1 }),
      makePlayer(8, { team: "enemy", tier: 19, smurf: true }),
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
