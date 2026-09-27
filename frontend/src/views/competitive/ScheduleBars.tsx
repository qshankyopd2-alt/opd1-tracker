import type { ScheduleRow } from "../../api/types";

function Bars({ rows, testId }: { rows: ScheduleRow[]; testId: string }) {
  const maxGames = Math.max(1, ...rows.map((r) => r.games));
  return (
    <div className="space-y-2" data-testid={testId}>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2.5 text-[12px]">
          <span className="w-16 text-text-secondary shrink-0 font-medium">{r.name}</span>
          <div className="flex-1 h-3 bg-inset rounded-sm overflow-hidden ring-1 ring-inset ring-edge flex">
            {r.games > 0 && r.winRate !== null && (
              <>
                <div className="h-full bg-victory/75" style={{ width: `${(r.games / maxGames) * (r.winRate / 100) * 100}%` }} />
                <div className="h-full bg-defeat/60" style={{ width: `${(r.games / maxGames) * (1 - r.winRate / 100) * 100}%` }} />
              </>
            )}
          </div>
          <span className="w-20 text-right num text-text-secondary shrink-0">
            {r.games > 0 && r.winRate !== null ? `${r.winRate}% · ${r.games}g` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScheduleBars({ weekdays, dayparts }: { weekdays: ScheduleRow[]; dayparts: ScheduleRow[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
      <div>
        <h4 className="micro-label flex items-center gap-2 mb-2.5">
          <span className="section-tick" aria-hidden="true" /> By weekday
        </h4>
        <Bars rows={weekdays} testId="schedule-weekdays" />
      </div>
      <div>
        <h4 className="micro-label flex items-center gap-2 mb-2.5">
          <span className="section-tick" aria-hidden="true" /> By time of day
        </h4>
        <Bars rows={dayparts} testId="schedule-dayparts" />
      </div>
    </div>
  );
}
