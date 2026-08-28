import type { CareerMatch } from "../../../api/types";
import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import { fmtDelta, matchDate, resultColor } from "../../../lib/format";

export function RecentMatchCard({ match, onOpen }: { match: CareerMatch; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative min-h-[78px] w-full overflow-hidden rounded-sm border border-edge bg-card px-2.5 py-2 text-left transition-colors hover:border-zinc-600"
      data-testid={`drawer-match-${match.matchId}`}
    >
      {match.mapSplash && (
        <img
          src={match.mapSplash}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-200 group-hover:opacity-35"
          loading="lazy"
          draggable={false}
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/55" />

      <span className="relative flex min-w-0 items-center gap-2">
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: resultColor(match.result) }} />
        <AgentAvatar portrait={match.agentPortrait} name={match.agent} color={match.agentColor} size={32} />
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-zinc-100">{match.map}</span>
            <span className="shrink-0 text-[10px] text-zinc-400">{match.mode}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span style={{ color: resultColor(match.result) }}>{match.result}</span>
            <span>·</span>
            <span>{matchDate(match.startMillis)}</span>
          </span>
        </span>
        {match.rrDelta !== null && match.rrDelta !== undefined && (
          <span className={`shrink-0 text-right text-[11px] font-semibold num ${match.rrDelta >= 0 ? "text-victory" : "text-defeat"}`}>
            {fmtDelta(match.rrDelta)} RR
          </span>
        )}
      </span>

      <span className="relative mt-2 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-edge/70 pt-1.5">
        <span className="text-[11px] text-zinc-200 num">
          {match.kills}/{match.deaths}/{match.assists}
          <span className="ml-1 text-[9px] uppercase tracking-wider text-zinc-500">K/D/A</span>
        </span>
        <span className="text-[10px] text-zinc-400 num">{match.acs} ACS</span>
        <span className="flex min-w-0 items-center justify-end gap-1.5">
          {match.rankIcon && <img src={match.rankIcon} alt={match.rankAfter ?? "Rank"} className="h-5 w-5 shrink-0" loading="lazy" />}
          <span className="max-w-[96px] truncate text-right text-[10px] font-semibold" style={{ color: match.rankColor ?? "#A1A1AA" }}>
            {match.rankAfter ?? "Unrated"}
            {match.rrAfter !== null && match.rrAfter !== undefined ? ` · ${match.rrAfter} RR` : ""}
          </span>
        </span>
      </span>
    </button>
  );
}
