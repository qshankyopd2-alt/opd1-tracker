import type { CSSProperties } from "react";
import { AlertTriangle } from "lucide-react";
import type { LivePlayer, Party, PartyDetectionTeam, TeamStats } from "../../api/types";
import { fmtNum, fmtPct } from "../../lib/format";
import { PlayerRow } from "./PlayerRow";
import type { RecentDetailsByPlayer } from "../../hooks/useRecentFormDetails";

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
  onBookmark,
  recentDetailsByPlayer,
  onRequestRecentDetails,
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
  onSelect: (p: LivePlayer, opener: HTMLElement) => void;
  onBookmark?: (p: LivePlayer) => void;
  recentDetailsByPlayer: RecentDetailsByPlayer;
  onRequestRecentDetails: (puuid: string) => void;
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
    <section
      data-testid={testId}
      data-team-tone={accent}
      className="live-team-panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-panel)]"
      style={{ "--team-accent": accent === "victory" ? "var(--accent-team-a)" : "var(--accent-team-b)" } as CSSProperties}
    >
      <header className="live-team-header flex min-h-12 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--border-subtle)] px-3 py-2">
        <div className="live-team-heading flex shrink-0 items-center gap-2">
          <span
            className={`h-5 w-1 rounded-full ${accent === "victory" ? "bg-victory" : "bg-defeat"}`}
            style={{ backgroundColor: "var(--team-accent)" }}
          />
          <h3 className="whitespace-nowrap font-display text-[18px] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
            {label}
          </h3>
        </div>

        {stats && players.length > 1 && (
          <div
            className="live-team-stats ml-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--text-secondary)] num"
            title="Team averages: current rank, Act win rate, and the recent-match K/D available for each player."
          >
            <div className="team-stat-rank flex shrink-0 items-center gap-1 whitespace-nowrap">
              <span className="font-medium text-[var(--text-secondary)]">Avg</span>
              {stats.rankIcon && <img src={stats.rankIcon} alt="" className="h-4 w-4" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
              <span className="font-semibold text-[var(--text-primary)]">{stats.avgRank}</span>
            </div>
            <div className="team-stat-secondary flex shrink-0 items-center gap-1 whitespace-nowrap">
              <span className="font-medium text-[var(--text-secondary)]">K/D</span>
              <span className="font-semibold text-[var(--text-primary)]">{stats.avgKd !== null ? fmtNum(stats.avgKd, 2) : "—"}</span>
            </div>
            <div className="team-stat-secondary flex shrink-0 items-center gap-1 whitespace-nowrap">
              <span className="font-medium text-[var(--text-secondary)]">WR</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtPct(stats.avgWinRate)}</span>
            </div>
            <div className="team-stats-compact hidden items-center gap-1 text-[12px] font-medium text-[var(--text-secondary)]" title={`Team average K/D ${stats.avgKd !== null ? fmtNum(stats.avgKd, 2) : "unavailable"}; win rate ${fmtPct(stats.avgWinRate)}.`}>
              <span>K/D</span><span className="text-[var(--text-primary)]">{stats.avgKd !== null ? fmtNum(stats.avgKd, 2) : "—"}</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span>WR</span><span className="text-[var(--text-primary)]">{fmtPct(stats.avgWinRate)}</span>
            </div>
            {stats.smurfCount > 0 && (
              <div className="team-stat-alert flex shrink-0 items-center gap-1 whitespace-nowrap font-medium text-flag" data-testid={`${testId}-smurf-count`}>
                <AlertTriangle size={13} /> {stats.smurfCount} smurf{stats.smurfCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </header>
      <div
        data-testid={`${testId}-parties`}
        className="live-party-rail flex min-h-7 shrink-0 flex-wrap items-center gap-2 border-b border-edge px-3 py-1"
      >
        <span className="party-heading text-[12px] font-medium text-[var(--text-secondary)]">Parties</span>
        {visibleParties.length > 0 ? visibleParties.map((party) => {
          const teamPartySize = party.members.filter((member) => playerIds.has(member)).length;
          return (
            <span
              key={party.id}
              title={`${teamPartySize} players on this team detected in party P${party.number}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-[var(--text-secondary)]"
            >
              <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: party.color }} />
              <span className="font-semibold text-[var(--text-primary)]">P{party.number}</span>
              <span>· party of {teamPartySize}</span>
            </span>
          );
        }) : (
          <span className="text-[12px] font-medium text-[var(--text-secondary)]">
            {partyDetection?.status === "complete"
              ? "None detected"
              : partyDetection
                ? `Checking ${partyDetection.partyDataPlayers}/${partyDetection.expectedPlayers}`
                : "Unavailable"}
          </span>
        )}
      </div>
      <div
        className="live-roster grid min-h-0 flex-1 gap-1 overflow-hidden p-1"
        style={{ "--live-player-count": Math.max(players.length, 1) } as CSSProperties}
      >
        {orderedPlayers.map((p) => (
          <div className="live-player-slot min-h-0 min-w-0" key={p.puuid}>
            <PlayerRow
              player={savedOverrides[p.puuid] ? {
                ...p,
                saved: savedOverrides[p.puuid].saved,
                savedNote: savedOverrides[p.puuid].note,
              } : p}
              pregame={pregame}
              onSelect={onSelect}
              onBookmark={onBookmark}
              recentDetails={recentDetailsByPlayer[p.puuid]}
              onRequestRecentDetails={onRequestRecentDetails}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
