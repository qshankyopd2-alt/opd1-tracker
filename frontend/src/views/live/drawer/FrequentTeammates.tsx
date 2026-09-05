import type { Career } from "../../../api/types";
import { Truncate } from "../../../components/ui/Truncate";

type Teammate = Career["coPlayers"][number];

function teammateName(teammate: Teammate): string {
  return teammate.name?.trim() || `Player ${teammate.puuid.slice(0, 8)}`;
}

export function FrequentTeammates({ teammates, embedded = false }: { teammates: Teammate[]; embedded?: boolean }) {
  if (teammates.length === 0) return null;

  return (
    <div className={embedded ? "" : "mt-3"} data-testid="drawer-frequent-teammates">
      {!embedded && <h4 className="mb-1.5 text-[12px] font-semibold text-zinc-300">Frequent teammates</h4>}
      <ul className="grid grid-cols-2 gap-px overflow-hidden bg-[var(--border-subtle)] max-[560px]:grid-cols-1">
        {teammates.map((teammate) => (
          <li key={teammate.puuid} className="min-w-0 bg-panel px-2.5 py-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="min-w-0 flex-1"><Truncate text={teammateName(teammate)} maxWidth={180} className="text-[14px] font-semibold text-zinc-100" /></span>
              <span className="shrink-0 text-[12px] text-zinc-400 tabular-nums">{teammate.sharedMatches} {teammate.sharedMatches === 1 ? "match" : "matches"}</span>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              {teammate.isParty && <span className="shrink-0 rounded-sm border border-edge bg-card px-1.5 py-0.5 text-[11px] font-semibold text-zinc-300">Party</span>}
              <span className="min-w-0 truncate text-[12px] text-zinc-400">{teammate.agents.length > 0 ? teammate.agents.join(" · ") : "Agents unavailable"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
