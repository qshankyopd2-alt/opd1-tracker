import type { Career } from "../../../api/types";

type Teammate = Career["coPlayers"][number];

function teammateName(teammate: Teammate): string {
  return teammate.name?.trim() || `Player ${teammate.puuid.slice(0, 8)}`;
}

export function FrequentTeammates({ teammates, embedded = false }: { teammates: Teammate[]; embedded?: boolean }) {
  if (teammates.length === 0) return null;

  return (
    <div className={embedded ? "" : "mt-3"} data-testid="drawer-frequent-teammates">
      {!embedded && <h4 className="mb-1.5 text-[11px] font-semibold text-zinc-300">Frequent teammates</h4>}
      <ul className="grid grid-cols-2 border-y border-edge/70 max-[560px]:grid-cols-1">
        {teammates.map((teammate) => (
          <li key={teammate.puuid} className="min-w-0 border-b border-r border-edge/60 px-2.5 py-2.5 even:border-r-0 max-[560px]:border-r-0">
            <div className="flex min-w-0 items-baseline gap-2">
              <span dir="auto" className="min-w-0 flex-1 truncate text-[12px] font-semibold text-zinc-100" title={teammateName(teammate)}>{teammateName(teammate)}</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-400 num">{teammate.sharedMatches} {teammate.sharedMatches === 1 ? "match" : "matches"}</span>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              {teammate.isParty && <span className="shrink-0 rounded-sm border border-brand/30 bg-brand/5 px-1.5 py-0.5 text-[10px] font-semibold text-brand/80">Party</span>}
              <span className="min-w-0 truncate text-[10px] text-zinc-500">{teammate.agents.length > 0 ? teammate.agents.join(" · ") : "Agents unavailable"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
