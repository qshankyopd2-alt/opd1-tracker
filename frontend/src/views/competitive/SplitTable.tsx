import type { SplitRow } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { fmtDelta, fmtNum } from "../../lib/format";

export function SplitTable({ rows, kind, testId }: { rows: SplitRow[]; kind: "map" | "agent"; testId: string }) {
  if (rows.length === 0) {
    return <p className="text-[12px] text-text-muted px-1 py-2">No rated matches yet.</p>;
  }
  return (
    <table className="w-full text-[12px]" data-testid={testId}>
      <thead>
        <tr className="text-[10px] uppercase tracking-[0.1em] text-text-muted border-b border-edge">
          <th className="text-left font-bold py-2 pl-1">{kind === "map" ? "Map" : "Agent"}</th>
          <th className="text-right font-bold">Games</th>
          <th className="text-right font-bold">W–L</th>
          <th className="text-right font-bold">Win %</th>
          <th className="text-right font-bold">Net RR</th>
          <th className="text-right font-bold">K/D</th>
          <th className="text-right font-bold pr-1">ACS</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 8).map((r) => (
          <tr key={r.name} className="border-b border-edge/50 last:border-b-0 hover:bg-card/60 transition-colors">
            <td className="py-2 pl-1">
              <span className="inline-flex items-center gap-2 min-w-0">
                {kind === "agent" && <AgentAvatar portrait={r.portrait} name={r.name} color={r.color ?? undefined} size={20} />}
                <span className="text-text-primary font-medium truncate">{r.name}</span>
              </span>
            </td>
            <td className="text-right num text-text-secondary">{r.games}</td>
            <td className="text-right num text-text-secondary">
              {r.wins}–{r.losses}
            </td>
            <td className={`text-right num font-bold ${r.winRate >= 50 ? "text-victory" : "text-defeat"}`}>{r.winRate}%</td>
            <td className={`text-right num font-medium ${r.netRr >= 0 ? "text-victory" : "text-defeat"}`}>{fmtDelta(r.netRr)}</td>
            <td className="text-right num text-text-primary">{r.avgKd !== null ? fmtNum(r.avgKd, 2) : "—"}</td>
            <td className="text-right num text-text-primary pr-1">{r.avgAcs ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
