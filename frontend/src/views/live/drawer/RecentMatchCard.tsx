import type { CareerMatch } from "../../../api/types";
import { AgentAvatar } from "../../../components/domain/AgentAvatar";
import { fmtDelta, matchDate, resultColor } from "../../../lib/format";

export function RecentMatchCard({ match, onOpen }: { match: CareerMatch; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid min-h-[66px] w-full grid-cols-[3px_28px_minmax(0,1fr)_90px_46px_54px_116px] items-center gap-2 border-b border-edge/70 bg-card/35 px-3 py-2 text-left transition-colors hover:bg-zinc-800/70"
      data-testid={`drawer-match-${match.matchId}`}
    >
      <span className="h-9 w-[3px] rounded-full" style={{ backgroundColor: resultColor(match.result) }} aria-hidden="true" />
      <AgentAvatar portrait={match.agentPortrait} name={match.agent} color={match.agentColor} size={28} />
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-zinc-100">{match.map}</span>
          <span className="shrink-0 text-[10px] font-semibold" style={{ color: resultColor(match.result) }}>{match.result}</span>
        </span>
        <span className="mt-1 block truncate text-[10px] text-zinc-500">{match.agent} · {match.mode} · {matchDate(match.startMillis)}</span>
      </span>
      <span className="font-mono text-[10px] text-zinc-300 num">{match.kills}/{match.deaths}/{match.assists}</span>
      <span className="font-mono text-[10px] text-zinc-400 num">{match.acs}</span>
      <span className={`font-mono text-[10px] font-semibold num ${match.rrDelta !== null && match.rrDelta !== undefined && match.rrDelta >= 0 ? "text-victory" : "text-defeat"}`}>
        {match.rrDelta !== null && match.rrDelta !== undefined ? fmtDelta(match.rrDelta) : "—"}
      </span>
      <span className="flex min-w-0 items-center justify-end gap-1.5">
        {match.rankIcon && <img src={match.rankIcon} alt="" className="h-5 w-5 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        <span className="min-w-0 truncate text-right text-[10px] font-semibold" style={{ color: match.rankColor ?? "#A1A1AA" }}>
          {match.rankAfter ?? "Unrated"}{match.rrAfter !== null && match.rrAfter !== undefined ? ` · ${match.rrAfter} RR` : ""}
        </span>
      </span>
    </button>
  );
}
