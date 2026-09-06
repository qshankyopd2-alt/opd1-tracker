import type { Career } from "../../../api/types";
import { PlayerIdentity } from "../../../components/domain/PlayerIdentity";

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
          <li key={teammate.puuid} className="min-w-0 bg-card px-2.5 py-2.5">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="min-w-0 flex-1 text-[15px] font-bold text-zinc-100"><PlayerIdentity name={teammateName(teammate)} /></span>
              <span className="shrink-0 text-[12px] text-zinc-400 tabular-nums">{teammate.sharedMatches} {teammate.sharedMatches === 1 ? "match" : "matches"}</span>
            </div>
            {teammate.isParty && <span className="mt-1 inline-block rounded-sm border border-edge bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-zinc-300">Party</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
