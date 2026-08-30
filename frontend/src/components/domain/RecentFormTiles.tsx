import { fmtDelta, matchAgeLabel } from "../../lib/format";

const SLOT_COUNT = 5;

export interface RecentFormDetail {
  result?: "W" | "L" | "Victory" | "Defeat";
  rrDelta?: number | null;
  startMillis?: number | null;
}

export function RecentFormTiles({
  form,
  latestRr,
  recentDetails,
  onRequestDetails,
  testId,
}: {
  form: ("W" | "L")[];
  latestRr: number | null | undefined;
  recentDetails?: RecentFormDetail[];
  onRequestDetails?: () => void;
  testId: string;
}) {
  const results = form.slice(0, SLOT_COUNT);
  const slots = Array.from({ length: SLOT_COUNT }, (_, index) => results[index] ?? null);
  const summary = slots
    .map((result) => result === "W" ? "Win" : result === "L" ? "Loss" : "Unavailable")
    .join(", ");
  const newestRr = latestRr === null || latestRr === undefined ? "" : ` Newest match RR ${fmtDelta(latestRr)}.`;

  return (
    <span className="recent-form relative flex h-6 w-[96px] shrink-0 items-center" data-testid={testId} onPointerEnter={onRequestDetails}>
      <span className="sr-only">Recent form, newest to oldest: {summary}.{newestRr}</span>
      <span aria-hidden="true" className="relative z-[1] flex w-full flex-row-reverse items-center justify-between gap-0.5">
        {slots.map((result, index) => {
          const detail = recentDetails?.[index];
          const rr = detail?.rrDelta ?? (index === 0 ? latestRr : null);
          const age = detail?.startMillis ? matchAgeLabel(detail.startMillis) : "Match age unavailable";
          const normalized = detail?.result === "Victory" ? "W" : detail?.result === "Defeat" ? "L" : result;
          const resultClass = normalized === "W"
            ? "border-victory/60 bg-victory/20 text-victory"
            : normalized === "L"
              ? "border-defeat/60 bg-defeat/20 text-defeat"
              : "border-edge bg-ink/70 text-zinc-600";

          return (
            <span
              key={index}
              data-testid={`${testId}-tile-${index}`}
              data-recency={index === 0 ? "current" : "past"}
              data-size={20 - index}
              style={{ width: 20 - index, height: 20 - index }}
              className={`recent-form-tile group/form-tile relative flex shrink-0 items-center justify-center rounded-sm border text-[9px] font-black num ${index === 0 ? "ring-1 ring-zinc-300/80" : ""} ${resultClass}`}
            >
              {normalized ?? "—"}
              {normalized && (
                <span
                  id={`${testId}-tooltip-${index}`}
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-[calc(100%+6px)] right-0 z-30 w-max max-w-[140px] rounded-sm border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-left font-body normal-case tracking-normal text-zinc-100 opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-opacity duration-150 motion-reduce:transition-none group-hover/form-tile:opacity-100 ${index === 0 ? "group-focus-visible/card:opacity-100" : ""}`}
                >
                  <span className={`block text-[11px] font-bold ${normalized === "W" ? "text-victory" : "text-defeat"}`}>
                    {normalized === "W" ? "Victory" : "Defeat"}
                  </span>
                  {rr !== null && rr !== undefined
                    ? <span className={`block text-[10px] font-bold num ${rr >= 0 ? "text-victory" : "text-defeat"}`}>{fmtDelta(rr)} RR</span>
                    : <span className="block text-[10px] text-zinc-500">RR unavailable</span>}
                  <span className="block text-[10px] text-zinc-400">{age}</span>
                </span>
              )}
            </span>
          );
        })}
      </span>
    </span>
  );
}
