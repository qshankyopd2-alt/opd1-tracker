import { fmtDelta } from "../../lib/format";

const SLOT_COUNT = 5;

function chronologyLabel(index: number): string {
  if (index === 0) return "Newest match";
  return `${index} match${index === 1 ? "" : "es"} ago`;
}

export function RecentFormTiles({
  form,
  latestRr,
  testId,
}: {
  form: ("W" | "L")[];
  latestRr: number | null | undefined;
  testId: string;
}) {
  const results = form.slice(0, SLOT_COUNT);
  const slots = Array.from({ length: SLOT_COUNT }, (_, index) => results[index] ?? null);
  const summary = slots
    .map((result) => result === "W" ? "Win" : result === "L" ? "Loss" : "Unavailable")
    .join(", ");
  const newestRr = latestRr === null || latestRr === undefined ? "" : ` Newest match RR ${fmtDelta(latestRr)}.`;

  return (
    <span className="flex h-10 w-[156px] shrink-0 flex-col justify-between" data-testid={testId}>
      <span className="sr-only">Recent form, newest to oldest: {summary}.{newestRr}</span>
      <span aria-hidden="true" className="flex items-center justify-between px-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        <span>Newest</span>
        <span className="text-zinc-600">→</span>
        <span>Oldest</span>
      </span>
      <span aria-hidden="true" className="flex items-center gap-1">
        {slots.map((result, index) => {
          const tooltipPosition = index === 0
            ? "left-0"
            : index === SLOT_COUNT - 1
              ? "right-0"
              : "left-1/2 -translate-x-1/2";
          const resultClass = result === "W"
            ? "border-victory/60 bg-victory/20 text-victory"
            : result === "L"
              ? "border-defeat/60 bg-defeat/20 text-defeat"
              : "border-edge bg-ink/70 text-zinc-600";

          return (
            <span
              key={index}
              data-testid={`${testId}-tile-${index}`}
              className={`group/form-tile relative flex h-7 w-7 items-center justify-center rounded-sm border text-[11px] font-black num ${resultClass}`}
            >
              {result ?? "—"}
              {result && (
                <span
                  id={`${testId}-tooltip-${index}`}
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-[calc(100%+6px)] z-30 w-max max-w-[124px] rounded-sm border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-left font-body normal-case tracking-normal text-zinc-100 opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-opacity duration-150 group-hover/form-tile:opacity-100 ${index === 0 ? "group-focus-visible/card:opacity-100" : ""} ${tooltipPosition}`}
                >
                  <span className={`block text-[11px] font-bold ${result === "W" ? "text-victory" : "text-defeat"}`}>
                    {result === "W" ? "Victory" : "Defeat"}
                  </span>
                  {index === 0 && latestRr !== null && latestRr !== undefined && (
                    <span className={`block text-[10px] font-bold num ${latestRr >= 0 ? "text-victory" : "text-defeat"}`}>
                      {fmtDelta(latestRr)} RR
                    </span>
                  )}
                  <span className="block text-[9px] text-zinc-500">{chronologyLabel(index)}</span>
                </span>
              )}
            </span>
          );
        })}
      </span>
    </span>
  );
}
