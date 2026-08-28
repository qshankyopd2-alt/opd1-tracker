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
    <section data-testid={testId} className="flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-edge bg-card">
      <header className="flex min-h-[42px] items-center gap-3 border-b border-edge bg-panel px-3 py-1.5">
        <span className="w-1.5 h-4 rounded-[2px]" style={{ backgroundColor: accent }} />
        <h3 className="font-display font-bold uppercase tracking-wide text-[15px]" style={{ color: accent }}>
          {label}
        </h3>
        {stats && players.length > 1 && (
          <div
            className="ml-auto flex items-center gap-4 text-[11px] text-zinc-400 num"
            title="Team averages: current rank, Act win rate, and the recent-match K/D available for each player."
          >
            <span className="text-[8px] font-semibold uppercase tracking-wider text-zinc-600">Team avg</span>
            <span className="inline-flex items-center gap-1">
              {stats.rankIcon && <img src={stats.rankIcon} alt="" className="w-4 h-4" loading="lazy" />}
              <span style={{ color: stats.rankColor }}>{stats.avgRank}</span>
            </span>
            <span>
              KD <span className="text-zinc-200 font-semibold">{stats.avgKd !== null ? fmtNum(stats.avgKd, 2) : "—"}</span>
            </span>
            <span>
              WR <span className="text-zinc-200 font-semibold">{fmtPct(stats.avgWinRate)}</span>
            </span>
            {stats.smurfCount > 0 && (
              <span className="text-amber-300 font-semibold" data-testid={`${testId}-smurf-count`}>
                {stats.smurfCount} smurf{stats.smurfCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </header>
      <div
        className="flex min-h-[32px] flex-wrap items-center gap-2 border-b border-edge bg-ink/30 px-3 py-1"
        data-testid={`${testId}-parties`}
      >
        <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Detected parties</span>
        {visibleParties.length > 0 ? visibleParties.map((party) => (
          <span
            key={party.id}
            title={`${party.size} players share this Riot party`}
            className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-panel px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-300"
          >
            <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: party.color }} />
            Party {party.number} · {party.declaredSize && party.declaredSize > party.size
              ? `${party.size}/${party.declaredSize} detected`
              : `${party.size} players`}
          </span>
        )) : (
          <span className="text-[9px] text-zinc-600">
            {partyDetection?.status === "complete"
              ? "No party detected"
              : partyDetection
                ? `Party data incomplete · ${partyDetection.partyDataPlayers}/${partyDetection.expectedPlayers} checked`
                : "Party data unavailable"}
          </span>
        )}
      </div>
      <div
        className="stagger grid min-h-0 flex-1 gap-1.5 p-1.5 overflow-y-auto"
        style={{ gridTemplateRows: `repeat(${Math.max(players.length, 1)}, minmax(min-content, 1fr))` }}
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
