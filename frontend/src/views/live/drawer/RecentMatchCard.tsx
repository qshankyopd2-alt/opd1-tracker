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
      className="group relative grid min-h-[88px] w-full grid-cols-[3px_28px_minmax(0,1fr)_auto_auto_auto_minmax(96px,116px)] items-center gap-2 overflow-hidden border-b border-white/10 bg-card/35 px-3 py-2 text-left transition-colors hover:bg-zinc-800/70"
      data-testid={`drawer-match-${match.matchId}`}
    >
      {match.mapSplash && <img src={match.mapSplash} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.28]" loading="lazy" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card/95 via-card/90 to-card/78" aria-hidden="true" />
      <span className="relative z-10 h-9 w-[3px] rounded-full" style={{ backgroundColor: resultColor(match.result) }} aria-hidden="true" />
      <span className="relative z-10"><AgentAvatar portrait={match.agentPortrait} name={match.agent} color={match.agentColor} size={28} /></span>
      <span className="relative z-10 min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-display text-[14px] font-bold text-zinc-100">{match.map}</span>
          <OutcomeBadge size="sm" outcome={normalizeOutcome(match.result)} />
        </span>
        <span className="mt-1 block truncate text-[11px] text-zinc-400">{match.agent} · {match.mode} · {matchAgeLabel(match.startMillis)}</span>
      </span>
      <span className="relative z-10 whitespace-nowrap text-[12px] text-zinc-200 tabular-nums">{match.kills}/{match.deaths}/{match.assists}</span>
      <span className="relative z-10 text-[12px] text-zinc-300 tabular-nums">{match.acs}</span>
      <span className={`relative z-10 whitespace-nowrap text-[12px] font-semibold tabular-nums ${match.rrDelta !== null && match.rrDelta !== undefined && match.rrDelta >= 0 ? "text-victory" : "text-defeat"}`}>
        {match.rrDelta !== null && match.rrDelta !== undefined ? fmtDelta(match.rrDelta) : "—"}
      </span>
      <span className="relative z-10 flex min-w-0 items-center justify-end gap-1.5">
        {match.rankIcon && <img src={match.rankIcon} alt="" className="h-5 w-5 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        <span className="min-w-0 truncate text-right text-[10px] font-semibold" title={endingRankLabel} aria-label={`Ending rank ${endingRankLabel}`} style={{ color: match.rankColor ?? "#A1A1AA" }}>
          {endingRankLabel}
        </span>
      </span>
    </button>
  );
}
