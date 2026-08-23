import type { ScheduleRow } from "../../api/types";

function Bars({ rows, testId }: { rows: ScheduleRow[]; testId: string }) {
  const maxGames = Math.max(1, ...rows.map((r) => r.games));
  return (
    <div className="space-y-1.5" data-testid={testId}>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2 text-[11px]">
          <span className="w-16 text-zinc-400 shrink-0">{r.name}</span>
          <div className="flex-1 h-3.5 bg-zinc-800/70 rounded-[2px] overflow-hidden flex">
            {r.games > 0 && r.winRate !== null && (
              <>
                <div
                  className="h-full bg-victory/70"
                  style={{ width: `${(r.games / maxGames) * (r.winRate / 100) * 100}%` }}
                />
                <div
                  className="h-full bg-defeat/60"
                  style={{ width: `${(r.games / maxGames) * (1 - r.winRate / 100) * 100}%` }}
                />
              </>
            )}
          </div>
          <span className="w-20 text-right num text-zinc-500 shrink-0">
            {r.games > 0 && r.winRate !== null ? `${r.winRate}% · ${r.games}g` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScheduleBars({ weekdays, dayparts }: { weekdays: ScheduleRow[]; dayparts: ScheduleRow[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
      <div>
        <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2">By weekday</h4>
        <Bars rows={weekdays} testId="schedule-weekdays" />
      </div>
      <div>
        <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2">By time of day</h4>
        <Bars rows={dayparts} testId="schedule-dayparts" />
      </div>
    </div>
  );
}
