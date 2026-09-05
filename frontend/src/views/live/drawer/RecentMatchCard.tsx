import type { CareerMatch } from "../../../api/types";
import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import { fmtDelta, matchAgeLabel, resultColor } from "../../../lib/format";
import { OutcomeBadge, normalizeOutcome } from "../../../components/ui/OutcomeBadge";

export function RecentMatchCard({ match, onOpen }: { match: CareerMatch; onOpen: (opener: HTMLElement) => void }) {
  const endingRankLabel = `${match.rankAfter ?? "Unrated"}${match.rrAfter !== null && match.rrAfter !== undefined ? ` · ${match.rrAfter} RR` : ""}`;

  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      className="group relative grid h-[68px] w-full grid-cols-[3px_28px_minmax(0,1fr)_minmax(145px,auto)] items-center gap-2 overflow-hidden border-b border-edge bg-card px-3 py-1.5 text-left transition-colors hover:bg-card-hover"
      data-testid={`drawer-match-${match.matchId}`}
    >
      {match.mapSplash && <img src={match.mapSplash} alt="" className="pointer-events-none absolute inset-y-0 right-0 h-full w-[34%] object-cover opacity-20" loading="lazy" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
      <span className="pointer-events-none absolute inset-y-0 right-0 w-[40%] bg-gradient-to-r from-card via-card/70 to-card/20" aria-hidden="true" />
      <span className="relative z-10 h-9 w-[3px] rounded-full" style={{ backgroundColor: resultColor(match.result) }} aria-hidden="true" />
      <span className="relative z-10"><AgentAvatar portrait={match.agentPortrait} name={match.agent} color={match.agentColor} size={28} /></span>
      <span className="relative z-10 min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-display text-[14px] font-semibold text-zinc-100">{match.map}</span>
          <OutcomeBadge size="xs" outcome={normalizeOutcome(match.result)} />
        </span>
        <span className="mt-1 block truncate text-[12px] text-zinc-400">{match.agent} · {match.mode} · {matchAgeLabel(match.startMillis)}</span>
      </span>
      <span className="relative z-10 flex min-w-0 flex-col items-end gap-1">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] text-zinc-300 tabular-nums">
          <span className="font-semibold text-zinc-100">{match.kills}/{match.deaths}/{match.assists}</span>
          <span className="text-zinc-600">·</span>
          <span><span className="text-[12px] text-zinc-400">ACS</span> {match.acs}</span>
        </span>
        <span className="flex min-w-0 items-center justify-end gap-1.5">
          <span className={`whitespace-nowrap text-[12px] font-semibold tabular-nums ${match.rrDelta !== null && match.rrDelta !== undefined && match.rrDelta >= 0 ? "text-victory" : "text-defeat"}`}>
            {match.rrDelta !== null && match.rrDelta !== undefined ? `${fmtDelta(match.rrDelta)} RR` : "RR —"}
          </span>
          <span className="text-zinc-600">·</span>
          {match.rankIcon && <img src={match.rankIcon} alt="" className="h-4 w-4 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          <span className="max-w-[120px] truncate text-right text-[12px] font-semibold" title={endingRankLabel} aria-label={`Ending rank ${endingRankLabel}`} style={{ color: match.rankColor ?? "#A1A1AA" }}>
            {endingRankLabel}
          </span>
        </span>
      </span>
    </button>
  );
}
