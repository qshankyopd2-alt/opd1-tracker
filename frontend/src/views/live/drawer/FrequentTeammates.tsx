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
      {!embedded && <h4 className="micro-label mb-1.5">Frequent teammates</h4>}
      <ul className="grid max-[560px]:grid-cols-1 grid-cols-2 gap-px overflow-hidden rounded-sm border border-edge bg-edge">
        {teammates.map((teammate) => (
          <li key={teammate.puuid} className="min-w-0 bg-card px-2.5 py-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="min-w-0 flex-1 text-[14px] font-bold text-text-primary">
                <PlayerIdentity name={teammateName(teammate)} />
              </span>
              <span className="num shrink-0 text-[11.5px] text-text-muted tabular-nums">
                {teammate.sharedMatches} {teammate.sharedMatches === 1 ? "match" : "matches"}
              </span>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-text-muted">
              {teammate.agents.length > 0 && (
                <span className="truncate" title={teammate.agents.join(", ")}>
                  {teammate.agents.slice(0, 2).join(", ")}
                </span>
              )}
              {teammate.isParty && (
                <span className="shrink-0 rounded-sm border border-edge bg-inset px-1 py-px font-display text-[9px] font-bold uppercase tracking-[0.08em] text-text-secondary">
                  Party
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
