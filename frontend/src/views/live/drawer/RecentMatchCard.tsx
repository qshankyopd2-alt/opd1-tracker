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
      className="recent-match-row group relative h-[90px] w-full overflow-hidden border-b border-edge bg-card px-3 py-2 text-left transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-info)]"
      data-testid={`drawer-match-${match.matchId}`}
    >
      <span className="recent-map-art" style={{ borderBottom: `3px solid ${resultColor(match.result)}` }}>
        {match.mapSplash && <img src={match.mapSplash} alt="" loading="lazy" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        <span><AgentAvatar portrait={match.agentPortrait} name={match.agent} color={match.agentColor} size={24} /></span>
      </span>

      <span className="relative z-10 min-w-0 pr-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-display text-[20px] font-semibold text-zinc-100">{match.map}</span>
          <OutcomeBadge size="xs" outcome={normalizeOutcome(match.result)} />
        </span>
        <span
          className="mt-1 block truncate text-[12px] text-zinc-400"
          title={fullMetaLabel}
          aria-label={fullMetaLabel}
        >
          {fullMetaLabel}
        </span>
      </span>

      <span className="relative z-10 text-[18px] font-semibold tabular-nums text-zinc-100">
        {match.kills}/{match.deaths}/{match.assists}
      </span>

      <span className="relative z-10 text-[18px] font-semibold tabular-nums text-zinc-300">
        {match.acs}
      </span>

      <span className="relative z-10 flex min-w-0 flex-col gap-0.5">
        <span className={`text-[12px] font-semibold tabular-nums ${match.rrDelta !== null && match.rrDelta !== undefined && match.rrDelta >= 0 ? "text-victory" : "text-defeat"}`}>
          {match.rrDelta !== null && match.rrDelta !== undefined ? `${fmtDelta(match.rrDelta)} RR` : "RR —"}
        </span>
        <span className="flex items-center gap-1.5 min-w-0">
          {match.rankIcon && <img src={match.rankIcon} alt="" className="h-3.5 w-3.5 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          <span
            className="truncate text-[14px] font-semibold text-text-primary"
            title={endingRankLabel}
            aria-label={`Ending rank ${endingRankLabel}`}
          >
            {endingRankLabel}
          </span>
        </span>
      </span>
    </button>
  );
}
