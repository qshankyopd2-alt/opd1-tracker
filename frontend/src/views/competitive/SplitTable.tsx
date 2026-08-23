import type { SplitRow } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { fmtDelta, fmtNum } from "../../lib/format";

export function SplitTable({ rows, kind, testId }: { rows: SplitRow[]; kind: "map" | "agent"; testId: string }) {
  if (rows.length === 0) {
    return <p className="text-[12px] text-zinc-500 px-1 py-2">No rated matches yet.</p>;
  }
  return (
    <table className="w-full text-[12px]" data-testid={testId}>
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-edge">
          <th className="text-left font-medium py-1.5 pl-1">{kind === "map" ? "Map" : "Agent"}</th>
          <th className="text-right font-medium">Games</th>
          <th className="text-right font-medium">W–L</th>
          <th className="text-right font-medium">Win %</th>
          <th className="text-right font-medium">Net RR</th>
          <th className="text-right font-medium">K/D</th>
          <th className="text-right font-medium pr-1">ACS</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 8).map((r) => (
          <tr key={r.name} className="border-b border-edge/50 last:border-b-0 hover:bg-zinc-800/40 transition-colors">
            <td className="py-1.5 pl-1">
              <span className="inline-flex items-center gap-2">
                {kind === "agent" && <AgentAvatar portrait={r.portrait} name={r.name} color={r.color ?? undefined} size={20} />}
                <span className="text-zinc-200">{r.name}</span>
              </span>
            </td>
            <td className="text-right num text-zinc-400">{r.games}</td>
            <td className="text-right num text-zinc-400">
              {r.wins}–{r.losses}
            </td>
            <td className={`text-right num font-semibold ${r.winRate >= 50 ? "text-victory" : "text-defeat"}`}>{r.winRate}%</td>
            <td className={`text-right num ${r.netRr >= 0 ? "text-victory" : "text-defeat"}`}>{fmtDelta(r.netRr)}</td>
            <td className="text-right num text-zinc-300">{r.avgKd !== null ? fmtNum(r.avgKd, 2) : "—"}</td>
            <td className="text-right num text-zinc-300 pr-1">{r.avgAcs ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
