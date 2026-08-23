// Typed contracts mirroring the Flask backend payloads (see docs/BACKEND_CAPABILITIES.md).

export type GameState = "MENUS" | "PREGAME" | "INGAME" | "OFFLINE";
export type DataSource = "local" | "demo" | "official";

export interface Health {
  ok: boolean;
  service: string;
  appVersion: string;
  dataSourcePreference: string;
  officialKey: boolean;
  liveInstalockEnabled: boolean;
  clientStatus: "ok" | "not_running";
}

export interface StateInfo {
  state: GameState;
  stateLabel: string;
  source: string;
  error?: string;
}

export interface SkinInfo {
  name: string;
  icon: string | null;
}

export interface WeaponLoadout {
  weapon: string;
  skin: SkinInfo | null;
}

export interface PartyRef {
  id: string;
  color: string;
  number: number;
}

export interface Party extends PartyRef {
  size: number;
  declaredSize?: number;
  members: string[];
}

export interface PartyDetectionTeam {
  status: "complete" | "partial" | "unavailable";
  expectedPlayers: number;
  presencePlayers: number;
  decodedPlayers: number;
  partyDataPlayers: number;
}

export interface PartyDetection extends PartyDetectionTeam {
  teams: Record<string, PartyDetectionTeam>;
}

export interface EncounterCounts {
  withCount: number;
  againstCount: number;
  winsWith: number;
  lossesWith: number;
  winsAgainst: number;
  lossesAgainst: number;
}

export interface LivePlayer {
  puuid: string;
  name: string;
  nameHidden: boolean;
  team: string;
  isSelf: boolean;
  title: string | null;
  playerCard: string | null;
  agent: string | null;
  agentId: string | null;
  agentPortrait: string | null;
  agentArt: string | null;
  agentColor: string;
  role: string | null;
  selection: string | null;
  rankTier: number;
  rank: string;
  rankColor: string;
  rankGroup: string;
  rankIcon: string | null;
  rr: number;
  rrEarned: number | null;
  leaderboard: number;
  peakRankTier: number;
  peakRank: string;
  peakColor: string;
  peakIcon: string | null;
  peakAct: string | null;
  previousRank: string;
  winRate: number | null;
  games: number;
  kd: number | null;
  hsPct: number | null;
  recentMatches?: number;
  skin: SkinInfo | null;
  weapons: WeaponLoadout[];
  level: number;
  levelHidden: boolean;
  party: PartyRef | null;
  smurf: boolean;
  smurfReasons: string[];
  topAgents: { agent: string; games: number }[];
  form: ("W" | "L")[];
  streak: { type: "W" | "L"; count: number } | null;
  mapWinRate: { winRate: number; games: number } | null;
  encounter?: EncounterCounts | null;
  saved?: boolean;
  savedNote?: string;
}

export interface TeamStats {
  avgRankTier: number;
  avgRank: string;
  rankColor: string;
  rankIcon: string | null;
  avgKd: number | null;
  avgWinRate: number | null;
  smurfCount: number;
  size: number;
}

export interface QueueState {
  available: boolean;
  queueId?: string | null;
  queueName?: string | null;
  eligible?: { id: string; name: string }[];
  state?: string;
  inQueue?: boolean;
  queuedAt?: number | null;
  queueElapsed?: number;
  partySize?: number;
  isOwner?: boolean;
  allReady?: boolean;
  demo?: boolean;
  message?: string;
}

export interface SessionPoint {
  matchId: string;
  ts: number;
  map?: string;
  mode?: string;
  result?: string;
  delta?: number | null;
  tier?: number | null;
  rr?: number | null;
  agent?: string;
  kd?: number;
  acs?: number;
}

export interface SessionSummary {
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  net: number;
  currentTier?: number | null;
  currentRr?: number | null;
}

export interface SessionView {
  id?: string;
  startedAt: number;
  lastAt?: number;
  endedAt?: number;
  goal?: unknown;
  points: SessionPoint[];
  summary?: SessionSummary;
  net?: number;
}

export interface Notice {
  level: "info" | "warn";
  action: string;
  message: string;
}

export interface Recap {
  matchId: string;
  map: string;
  mode: string;
  result: string | null;
  scores: Record<string, number>;
  mvp: DetailPlayer | null;
  teamMvp: DetailPlayer | null;
  you: DetailPlayer | null;
  yourAvgKd: number | null;
  rrDelta: number | null;
  tierAfter: number | null;
  rrAfter: number | null;
  players: DetailPlayer[];
  mapSplash: string | null;
  at: number;
  demo?: boolean;
}

export interface LiveBoard {
  state: GameState;
  stateLabel: string;
  source: string;
  map: string | null;
  mapSplash: string | null;
  mode: string;
  matchId: string;
  selfTeam: string;
  side: "Attacker" | "Defender" | null;
  players: LivePlayer[];
  teams: Record<string, LivePlayer[]>;
  teamStats: Record<string, TeamStats>;
  winProb: number | null;
  parties: Party[];
  partyDetection?: PartyDetection | null;
  score: { ally: number; enemy: number; round: number | null } | null;
  lockProgress: { locked: number; total: number } | null;
  queue?: QueueState;
  session?: SessionView | null;
  sessionArchiveCount?: number;
  recap?: Recap;
  notice?: Notice;
  error?: string;
  selfPuuid?: string;
  sourceDetail?: string;
  appVersion?: string;
}

// ---- career / profile ----

export interface CareerTeammate {
  puuid: string;
  name?: string;
  agent: string;
  agentPortrait?: string | null;
  agentColor?: string;
  level?: number | null;
  kills?: number;
  deaths?: number;
  assists?: number;
  acs?: number;
}

export interface CareerMatch {
  matchId: string;
  map: string;
  mapSplash: string | null;
  mode: string;
  startMillis: number;
  result: "Victory" | "Defeat" | "Draw";
  score: number;
  opponentScore: number | null;
  agent: string;
  agentPortrait: string | null;
  agentColor: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  acs: number;
  hsPct: number | null;
  partySize: number;
  scores?: Record<string, number>;
  teammates: CareerTeammate[];
  rrDelta?: number | null;
  tierAfter?: number | null;
  rrAfter?: number | null;
  rankAfter?: string | null;
  rankColor?: string | null;
  rankIcon?: string | null;
}

export interface Career {
  source: string;
  puuid: string;
  matches: CareerMatch[];
  averages: {
    games: number;
    wins: number;
    winRate: number;
    kills: number;
    deaths: number;
    assists: number;
    kd: number;
    hsPct: number | null;
  };
  coPlayers: { puuid: string; name: string | null; sharedMatches: number; agents: string[]; isParty: boolean }[];
  agentPool: { agent: string; games: number; winRate: number; portrait: string | null; color: string }[];
  mapStats: { map: string; games: number; wins: number; winRate: number }[];
}

// ---- match detail ----

export interface DetailPlayer {
  puuid: string;
  name: string;
  team: string;
  agent: string;
  agentPortrait: string | null;
  agentColor: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  acs: number;
  hsPct: number | null;
  rankTier: number;
  rank: string;
  rankColor: string;
  rankIcon: string | null;
  rr?: number;
  peakRankTier?: number;
  peakRank?: string;
  peakColor?: string;
  peakIcon?: string | null;
  level: number;
  playerCard: string | null;
  isSubject: boolean;
  isMatchMvp?: boolean;
  isTeamMvp?: boolean;
}

export interface MatchDetail {
  matchId: string;
  map: string;
  mapSplash: string | null;
  mode: string;
  scores: Record<string, number>;
  result: string | null;
  players: DetailPlayer[];
  teamStats: Record<string, { avgRankTier: number; avgRank: string; avgRankColor: string; rankIcon: string | null }>;
  error?: string;
}

// ---- performance / insights ----

export interface HistoryPoint {
  matchId: string;
  ts: number;
  map?: string;
  mapSplash?: string | null;
  mode?: string;
  result?: "Victory" | "Defeat" | "Draw" | null;
  resultExact?: boolean;
  delta?: number | null;
  tier?: number | null;
  rr?: number | null;
  seasonId?: string;
  agent?: string;
  agentPortrait?: string | null;
  agentColor?: string;
  partySize?: number;
  scores?: Record<string, number>;
  kills?: number;
  deaths?: number;
  assists?: number;
  kd?: number;
  acs?: number;
  hsPct?: number | null;
  source?: string;
}

export interface RankRef {
  tier: number;
  name: string;
  group: string;
  color: string;
}

export interface PerformanceSummary {
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  net: number;
  avgWin: number | null;
  avgLoss: number | null;
  current: RankRef & { rr: number | null; tier: number | null };
  next: (RankRef & { rrNeeded: number; progress: number }) | null;
  exactResults: number;
}

export interface Insight {
  title: string;
  text: string;
  tone: "pos" | "neg" | "neutral";
  samples: number | null;
  confidence: string;
}

export interface SplitRow {
  name: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  netRr: number;
  avgKd: number | null;
  avgAcs: number | null;
  portrait: string | null;
  color: string | null;
}

export interface ScheduleRow {
  name: string;
  games: number;
  wins: number;
  winRate: number | null;
  netRr: number;
}

export interface RankChange {
  matchId: string;
  ts: number;
  fromTier: number;
  toTier: number;
  type: "promotion" | "demotion";
}

export interface MatchMeta {
  note: string;
  tags: string[];
  bookmarked: boolean;
  updatedAt?: number;
}

export interface EncounterRow extends Partial<EncounterCounts> {
  puuid: string;
  name: string | null;
  rank?: string;
  peakRank?: string;
  rankTier?: number;
  peakTier?: number;
  rankIcon?: string | null;
  rankColor?: string;
  kd?: number | null;
  winRate?: number | null;
  level?: number | null;
  lastSeen?: number;
  agents?: string[];
  withKd?: number;
  withAcs?: number;
  withHsPct?: number | null;
  withStatGames?: number;
  topAgent?: string;
  topAgentGames?: number;
  topAgentPortrait?: string | null;
  topAgentColor?: string | null;
  accountsSeen?: string[];
  timeline?: EncounterTimelineItem[];
}

export interface EncounterTimelineItem {
  matchId: string;
  at: number;
  side: "with" | "against";
  result: "win" | "loss" | null;
  agent?: string | null;
  map?: string | null;
}

export interface SavedPlayer extends EncounterRow {
  saved: true;
  note: string;
  savedAt: number;
  updatedAt: number;
}

export interface SavedPlayersPayload {
  accountPuuid: string | null;
  players: SavedPlayer[];
}

export interface PerformancePayload {
  version: number;
  account: { puuid: string | null; riotId: string | null; timezone: string };
  points: HistoryPoint[];
  summary: PerformanceSummary;
  insights: Insight[];
  insightsMinimum: number;
  timezone: string;
  dataQuality: { exact: number; estimated: number };
  rankIcons: Record<string, string | null>;
  mapSplashes: Record<string, string | null>;
  splits: {
    maps: SplitRow[];
    agents: SplitRow[];
    schedule: { weekdays: ScheduleRow[]; dayparts: ScheduleRow[]; calendar: ScheduleRow[] };
  };
  actComparison: { current: { id: string } & PerformanceSummary; previous: { id: string } & PerformanceSummary } | null;
  rankChanges: RankChange[];
  personalBests: {
    bestRrMatch?: string;
    bestRr?: number;
    bestAcsMatch?: string;
    bestAcs?: number;
    highestTier?: number;
    highestRr?: number;
  };
  enrichment: { rich: number; target: number; updatedAt: number | null; error: boolean };
  backfill: { matches: number; updatedAt: number | null; error: boolean };
  sessions?: { active: SessionView | null; archive: SessionView[] };
  matchMeta?: Record<string, MatchMeta>;
  encounters?: EncounterRow[];
}

// ---- inventory ----

export interface InventoryItem {
  name: string;
  icon: string | null;
  vp: number;
  tier: string;
}

export interface Inventory {
  available: boolean;
  retryable?: boolean;
  error?: string;
  stale?: boolean;
  totalVp?: number;
  usdApprox?: number;
  wallet?: { vp: number; rad: number; kc: number };
  counts?: { skins: number; earned: number; buddies: number | null; cards: number | null; sprays: number | null; agents: number | null };
  tiers?: Record<string, { skins: number; vp: number }>;
  top?: InventoryItem[];
  recent?: InventoryItem[];
  at?: number;
}

// ---- misc ----

export interface ActionResult {
  ok: boolean;
  status?: string;
  message?: string;
  [key: string]: unknown;
}
