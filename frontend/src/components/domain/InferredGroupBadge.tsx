import { useId } from "react";
import type { InferredGroup, LivePlayer } from "../../api/types";

export function InferredGroupBadge({ groups, players }: { groups: InferredGroup[]; players: LivePlayer[] }) {
  const tooltip = useId();
  if (!groups.length) return null;
  const first = groups[0];
  const describe = (group: InferredGroup) => {
    const names = group.members.map((id) => players.find((p) => p.puuid === id)?.name ?? "Player").join(", ");
    const latest = group.latestMillis ? new Date(group.latestMillis).toLocaleDateString() : "date unavailable";
    return `${group.id}: Possible group — ${names}. Same team in ${group.sharedMatches} of ${group.examinedMatches} examined matches. ${group.partyMatches} with the same historical party. Latest: ${latest}. Current party not confirmed.`;
  };
  return <span className="inferred-group-wrap">
    <button type="button" className="inferred-group-badge" aria-describedby={tooltip}
      aria-label={`${first.id}: Possible group, ${first.sharedMatches} shared matches`}
      data-testid={`inferred-group-${first.id}`}>
      <img src="/assets/inferred-link.png" width="14" height="14" alt="" />
      <span>{first.id} ?</span><span aria-hidden="true" className="inferred-dots">{"●".repeat(Math.min(3, first.sharedMatches))}</span>
      {groups.length > 1 && <span>+{groups.length - 1}</span>}
    </button>
    <span role="tooltip" id={tooltip} className="inferred-group-tooltip">{groups.map((group) => <span key={group.id}>{describe(group)}</span>)}</span>
  </span>;
}
