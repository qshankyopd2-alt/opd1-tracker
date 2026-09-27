import type { CareerMatch } from "../../../api/types";
import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import { fmtDelta, matchAgeLabel, resultColor } from "../../../lib/format";
import { OutcomeBadge, normalizeOutcome } from "../../../components/ui/OutcomeBadge";

export function RecentMatchCard({ match, onOpen }: { match: CareerMatch; onOpen: (opener: HTMLElement) => void }) {
  const endingRank = match.rankAfter || "Unavailable";
  const endingRankLabel = `${endingRank}${match.rrAfter !== null && match.rrAfter !== undefined ? ` · ${match.rrAfter} RR` : ""}`;
  const fullMetaLabel = `${match.agent} · ${match.mode} · ${matchAgeLabel(match.startMillis)}`;

  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      className="recent-match-row group relative h-[88px] w-full overflow-hidden rounded-sm border border-edge bg-card px-3 py-2 text-left transition-colors hover:border-border-strong hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      data-testid={`drawer-match-${match.matchId}`}
    >
      <span className="recent-map-art" style={{ borderBottom: `3px solid ${resultColor(match.result)}` }}>
        {match.mapSplash && (
          <img src={match.mapSplash} alt="" loading="lazy" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />
        )}
        <span>
          <AgentAvatar portrait={match.agentPortrait} name={match.agent} color={match.agentColor} size={24} />
        </span>
      </span>

      <span className="relative z-10 min-w-0 pr-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-display text-[17px] font-bold text-text-primary">{match.map}</span>
          <OutcomeBadge size="xs" outcome={normalizeOutcome(match.result)} />
        </span>
        <span
          className="mt-1 block truncate text-[11.5px] text-text-muted"
          title={fullMetaLabel}
          aria-label={fullMetaLabel}
        >
          {fullMetaLabel}
        </span>
      </span>

      <span className="relative z-10 font-display text-[16px] font-bold tabular-nums text-text-primary" title="Kills / deaths / assists">
        {match.kills}/{match.deaths}/{match.assists}
      </span>

      <span className="relative z-10 font-display text-[16px] font-bold tabular-nums text-text-secondary" title="Average combat score">
        {match.acs}
      </span>

      <span className="relative z-10 flex min-w-0 flex-col gap-0.5">
        <span
          className={`font-mono text-[12px] font-semibold tabular-nums ${
            match.rrDelta !== null && match.rrDelta !== undefined && match.rrDelta >= 0 ? "text-victory" : "text-defeat"
          }`}
        >
          {match.rrDelta !== null && match.rrDelta !== undefined ? `${fmtDelta(match.rrDelta)} RR` : "RR —"}
        </span>
        <span className="flex min-w-0 items-center gap-1.5" title={`Ending rank ${endingRankLabel}`}>
          {match.rankIcon && (
            <img src={match.rankIcon} alt="" className="h-3.5 w-3.5 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          )}
          <span className="truncate font-display text-[12.5px] font-bold text-text-primary" title={endingRankLabel}>
            {endingRankLabel}
          </span>
        </span>
      </span>
    </button>
  );
}
