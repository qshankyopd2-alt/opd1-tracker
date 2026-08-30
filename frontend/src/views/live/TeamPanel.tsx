import type { LivePlayer, Party, PartyDetectionTeam, TeamStats } from "../../api/types";
import { fmtNum, fmtPct } from "../../lib/format";
import { PlayerRow } from "./PlayerRow";

export function TeamPanel({
  label,
  accent,
  players,
  stats,
  parties,
  partyDetection,
  savedOverrides,
  pregame,
  onSelect,
  testId,
}: {
  label: string;
  accent: string;
  players: LivePlayer[];
  stats: TeamStats | undefined;
  parties: Party[];
  partyDetection?: PartyDetectionTeam;
  savedOverrides: Record<string, { saved: boolean; note: string }>;
  pregame: boolean;
  onSelect: (p: LivePlayer) => void;
  testId: string;
}) {
  const playerIds = new Set(players.map((player) => player.puuid));
  const visibleParties = parties.filter((party) => party.members.some((member) => playerIds.has(member)));
  const orderedPlayers: LivePlayer[] = [];
  const emittedParties = new Set<string>();
  for (const player of players) {
    if (!player.party) {
      orderedPlayers.push(player);
      continue;
    }
    if (emittedParties.has(player.party.id)) continue;
    emittedParties.add(player.party.id);
    orderedPlayers.push(...players.filter((member) => member.party?.id === player.party?.id));
  }

  return (
    <section data-testid={testId} className="live-team-panel flex h-full min-h-0 min-w-0 flex-col rounded-md border border-edge bg-card">
      <header className="live-team-header flex min-h-[30px] shrink-0 items-center gap-2 border-b border-edge bg-panel px-2.5 py-1">
        <span className="h-4 w-1.5 rounded-[2px]" style={{ backgroundColor: accent }} />
        <h3 className="shrink-0 whitespace-nowrap font-display text-[14px] font-black uppercase tracking-wider xl:text-[16px]" style={{ color: accent }}>
          {label}
        </h3>
        {stats && players.length > 1 && (
          <div
            className="ml-auto flex items-center gap-1.5 text-[11px] text-zinc-400 num"
            title="Team averages: current rank, Act win rate, and the recent-match K/D available for each player."
          >
            <div className="flex items-center gap-1 rounded-sm border border-edge bg-zinc-900/50 px-1.5 py-0.5">
              <span className="mr-0.5 text-[8px] font-bold uppercase tracking-widest text-zinc-500">Avg</span>
              {stats.rankIcon && <img src={stats.rankIcon} alt="" className="h-4 w-4" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
              <span className="font-bold" style={{ color: stats.rankColor }}>{stats.avgRank}</span>
            </div>
            <div className="team-stat-secondary flex items-center gap-1 rounded-sm border border-edge bg-zinc-900/50 px-1.5 py-0.5">
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">KD</span>
              <span className="text-zinc-100 font-bold">{stats.avgKd !== null ? fmtNum(stats.avgKd, 2) : "—"}</span>
            </div>
            <div className="team-stat-secondary flex items-center gap-1 rounded-sm border border-edge bg-zinc-900/50 px-1.5 py-0.5">
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">WR</span>
              <span className="text-zinc-100 font-bold">{fmtPct(stats.avgWinRate)}</span>
            </div>
            {stats.smurfCount > 0 && (
              <div className="flex items-center gap-1 rounded-sm border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-bold text-amber-400" data-testid={`${testId}-smurf-count`}>
                {stats.smurfCount} smurf{stats.smurfCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </header>
      <div
        className="live-party-rail flex min-h-[22px] shrink-0 flex-wrap items-center gap-2 border-b border-edge bg-ink/60 px-2.5 py-0.5"
        data-testid={`${testId}-parties`}
      >
        <span className="party-heading text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Parties</span>
        {visibleParties.length > 0 ? visibleParties.map((party) => (
          <span
            key={party.id}
            title={`${party.size} players share this Riot party`}
            className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-panel px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300"
          >
            <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: party.color }} />
            <span className="party-label-full">Party {party.number} <span className="mx-0.5 text-zinc-500">·</span></span>
            <span className="party-label-compact">P{party.number} </span>
            {party.declaredSize && party.declaredSize > party.size
              ? `${party.size}/${party.declaredSize}`
              : `${party.size}`}
          </span>
        )) : (
          <span className="text-[10px] font-medium text-zinc-500">
            {partyDetection?.status === "complete"
              ? "None detected"
              : partyDetection
                ? `Incomplete · ${partyDetection.partyDataPlayers}/${partyDetection.expectedPlayers} checked`
                : "Unavailable"}
          </span>
        )}
      </div>
      <div
        className="live-roster stagger grid min-h-0 flex-1 gap-1 p-1"
        style={{ gridTemplateRows: `repeat(${Math.max(players.length, 1)}, minmax(0, 1fr))` }}
      >
        {orderedPlayers.map((p) => (
          <PlayerRow
            key={p.puuid}
            player={savedOverrides[p.puuid] ? {
              ...p,
              saved: savedOverrides[p.puuid].saved,
              savedNote: savedOverrides[p.puuid].note,
            } : p}
            pregame={pregame}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
