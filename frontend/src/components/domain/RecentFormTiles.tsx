import { fmtDelta, matchAgeLabel } from "../../lib/format";
import { OutcomeBadge } from "../ui/OutcomeBadge";

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
          const detailResult = detail?.result === "Victory" ? "W" : detail?.result === "Defeat" ? "L" : detail?.result;
          const normalized = result ?? detailResult;
          const detailRr = detailResult === normalized ? detail?.rrDelta : null;
          const rr = detailRr ?? (index === 0 ? latestRr : null);
          const age = detail?.startMillis ? matchAgeLabel(detail.startMillis) : "Match age unavailable";
          return (
            <span
              key={index}
              data-testid={`${testId}-tile-${index}`}
              data-recency={index === 0 ? "current" : "past"}
              data-size={20 - index}
              style={{ width: 20 - index, height: 20 - index }}
              className={`recent-form-tile match-chip group/form-tile relative flex shrink-0 items-center justify-center ${index === 0 ? "ring-1 ring-zinc-300/80" : ""}`}
            >
              <OutcomeBadge size="xs" outcome={normalized === "W" ? "win" : normalized === "L" ? "loss" : "unresolved"} className="h-full w-full px-0 [&>svg]:hidden" />
              {normalized && (
                <span
                  id={`${testId}-tooltip-${index}`}
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-[calc(100%+6px)] right-0 z-30 w-max max-w-[140px] rounded-sm border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-left font-body normal-case tracking-normal text-zinc-100 opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-opacity duration-150 motion-reduce:transition-none group-hover/form-tile:opacity-100 ${index === 0 ? "group-focus-within/row:opacity-100" : ""}`}
                >
                  <span className={`block text-[12px] font-bold ${normalized === "W" ? "text-victory" : "text-defeat"}`}>
                    {normalized === "W" ? "Victory" : "Defeat"}
                  </span>
                  {rr !== null && rr !== undefined
                    ? <span className={`block text-[12px] font-bold num ${rr >= 0 ? "text-victory" : "text-defeat"}`}>{fmtDelta(rr)} RR</span>
                    : <span className="block text-[12px] text-zinc-500">RR unavailable</span>}
                  <span className="block text-[12px] text-zinc-400">{age}</span>
                </span>
              )}
            </span>
          );
        })}
      </span>
    </span>
  );
}
