import type { CSSProperties } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import type { LivePlayer, Party, PartyDetectionTeam, TeamStats } from "../../api/types";
import { fmtNum, fmtPct } from "../../lib/format";
import { PlayerRow } from "./PlayerRow";
import type { RecentDetailsByPlayer } from "../../hooks/useRecentFormDetails";

function partyCoverageLabel(detection: PartyDetectionTeam | undefined): { text: string; limited: boolean } {
  if (!detection) return { text: "Unavailable", limited: true };
  if (detection.status === "complete") return { text: "Complete", limited: false };
  if (detection.status === "unavailable") return { text: "Unavailable", limited: true };
  return { text: `Partial · ${detection.partyDataPlayers}/${detection.expectedPlayers} read`, limited: true };
}

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
  recentDetailsByPlayer,
  onRequestRecentDetails,
  testId,
  lobby = false,
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
  recentDetailsByPlayer: RecentDetailsByPlayer;
  onRequestRecentDetails: (puuid: string) => void;
  testId: string;
  lobby?: boolean;
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
  const coverage = partyCoverageLabel(partyDetection);

  return (
    <section
      data-testid={testId}
      data-team-tone={accent}
      className={`live-team-panel flex h-full min-h-0 min-w-0 flex-col border border-[var(--border-subtle)] bg-[var(--bg-panel)] ${lobby ? "" : ""}`}
      style={{ "--team-accent": accent === "victory" ? "var(--ally)" : "var(--enemy)" } as CSSProperties}
    >
      {/* Team accent spine */}
      <span aria-hidden="true" className="h-[3px] w-full shrink-0" style={{ backgroundColor: "var(--team-accent)" }} />

      <header className="live-team-header flex min-h-[38px] shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--border-subtle)] px-3 py-1.5">
        <div className="live-team-heading flex shrink-0 items-center gap-2">
          <h3 className="whitespace-nowrap font-display text-[14px] font-bold uppercase tracking-[0.1em] text-[var(--text-primary)]">
            {label}
          </h3>
          <span className="num rounded-sm border border-edge bg-inset px-1.5 font-mono text-[11px] font-semibold text-text-secondary">
            {players.length}
          </span>
        </div>

        {stats && players.length > 1 && (
          <div
            className="live-team-stats ml-auto flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] num"
            title="Team averages across the players available: rank, recent-match K/D and current-act win rate."
          >
            <div className="team-stat-rank flex shrink-0 items-center gap-1.5" title="Average rank">
              <span className="micro-label">Avg rank</span>
              {stats.rankIcon && <img src={stats.rankIcon} alt="" className="h-[15px] w-[15px]" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
              <span className="font-display font-semibold text-[var(--text-primary)]">{stats.avgRank}</span>
            </div>
            <div className="team-stat-secondary flex shrink-0 items-center gap-1.5" title="Average recent-match K/D">
              <span className="micro-label">K/D</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">{stats.avgKd !== null ? fmtNum(stats.avgKd, 2) : "—"}</span>
            </div>
            <div className="team-stat-secondary flex shrink-0 items-center gap-1.5" title="Average current-act win rate">
              <span className="micro-label">Act WR</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">{fmtPct(stats.avgWinRate)}</span>
            </div>
            {stats.smurfCount > 0 && (
              <div
                className="team-stat-alert flex shrink-0 items-center gap-1 whitespace-nowrap font-display text-[11px] font-bold uppercase tracking-[0.05em] text-accent"
                data-testid={`${testId}-smurf-count`}
                title="Flagged players are heuristic indicators, not confirmations."
              >
                <AlertTriangle size={12} /> {stats.smurfCount} smurf{stats.smurfCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Party rail */}
      <div
        data-testid={`${testId}-parties`}
        className="live-party-rail flex min-h-[24px] shrink-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 border-b border-edge bg-inset/40 px-3 py-0.5"
      >
        <span className="micro-label">Parties</span>
        {visibleParties.length > 0 ? (
          visibleParties.map((party) => {
            const teamPartySize = party.members.filter((member) => playerIds.has(member)).length;
            return (
              <span
                key={party.id}
                title={`${teamPartySize} players on this team detected in party P${party.number}`}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11.5px] font-medium text-[var(--text-secondary)]"
              >
                <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: party.color }} />
                <span className="font-display font-bold" style={{ color: party.color }}>
                  P{party.number}
                </span>
                <span>×{teamPartySize}</span>
              </span>
            );
          })
        ) : (
          <span className="text-[11.5px] font-medium text-[var(--text-secondary)]">
            {partyDetection?.status === "complete"
              ? "None detected"
              : partyDetection && partyDetection.status !== "unavailable"
                ? `Checking ${partyDetection.partyDataPlayers}/${partyDetection.expectedPlayers}`
                : "Unavailable"}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[10.5px] text-text-muted" title="Party detection is best-effort; hidden presences keep enemy parties unknown.">
          {coverage.limited && <HelpCircle size={11} />}
          {coverage.text}
        </span>
      </div>

      {/* Roster: five vertically stacked rectangular cards */}
      <div
        className={`live-roster ${lobby ? "live-roster-lobby" : ""} min-h-0 flex-1 overflow-hidden`}
        style={{ "--live-player-count": Math.max(players.length, 1) } as CSSProperties}
      >
        {orderedPlayers.map((p) => (
          <div className="live-player-slot min-h-0 min-w-0" key={p.puuid}>
            <PlayerRow
              player={
                savedOverrides[p.puuid]
                  ? {
                      ...p,
                      saved: savedOverrides[p.puuid].saved,
                      savedNote: savedOverrides[p.puuid].note,
                    }
                  : p
              }
              pregame={pregame}
              onSelect={onSelect}
              recentDetails={recentDetailsByPlayer[p.puuid]}
              onRequestRecentDetails={onRequestRecentDetails}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
