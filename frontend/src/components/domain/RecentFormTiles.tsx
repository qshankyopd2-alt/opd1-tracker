import { ChevronRight } from "lucide-react";
import { fmtDelta, matchAgeLabel } from "../../lib/format";

const SLOT_COUNT = 5;

export interface RecentFormDetail {
  result?: "W" | "L" | "Victory" | "Defeat";
  rrDelta?: number | null;
  startMillis?: number | null;
}

function normalizeResult(value: RecentFormDetail["result"] | "W" | "L" | null | undefined): "W" | "L" | null {
  if (value === "W" || value === "Victory") return "W";
  if (value === "L" || value === "Defeat") return "L";
  return null;
}

/**
 * Last-five form strip. Data is newest-first (form[0] = most recent); the
 * strip renders oldest → newest left to right, so time flows toward the
 * highlighted "now" tile on the right.
 */
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
  const newest = form.slice(0, SLOT_COUNT);
  // Display slots: position 0 (left) is the oldest of the available results.
  const slots = Array.from({ length: SLOT_COUNT }, (_, position) => {
    const dataIndex = SLOT_COUNT - 1 - position;
    const result = dataIndex < newest.length ? newest[dataIndex] : null;
    const detail = recentDetails?.[dataIndex];
    const detailResult = normalizeResult(detail?.result);
    const normalized = result ?? (detailResult ? detailResult : null);
    const rr = normalized === detailResult ? (detail?.rrDelta ?? null) : (dataIndex === 0 ? (latestRr ?? null) : null);
    const age = detail?.startMillis ? matchAgeLabel(detail.startMillis) : "Match age unavailable";
    return { position, dataIndex, result: normalized, rr, age, isKnown: result !== null };
  });
  const summary = slots
    .map((slot) => (slot.result === "W" ? "Win" : slot.result === "L" ? "Loss" : "Unavailable"))
    .join(", ");
  const newestNote =
    latestRr === null || latestRr === undefined
      ? "Newest-match rating change unavailable."
      : `Newest match RR ${fmtDelta(latestRr)}.`;

  return (
    <span
      className="recent-form relative flex h-[18px] w-full min-w-0 items-center gap-1"
      data-testid={testId}
      onPointerEnter={onRequestDetails}
      title="Last 5 matches — oldest to newest; the highlighted tile is the most recent."
    >
      <span className="sr-only">
        Recent form, oldest to newest: {summary}. {newestNote}
      </span>
      <span aria-hidden="true" className="relative z-[1] flex min-w-0 flex-1 items-center justify-end gap-[3px]">
        {slots.map((slot) => {
          const size = 9 + slot.position;
          if (!slot.isKnown) {
            return (
              <span
                key={slot.dataIndex}
                data-testid={`${testId}-tile-${slot.dataIndex}`}
                data-recency={slot.dataIndex === 0 ? "current" : "past"}
                data-size={size}
                style={{ width: size, height: size }}
                className="recent-form-tile match-chip unresolved group/form-tile relative shrink-0"
              />
            );
          }
          return (
            <span
              key={slot.dataIndex}
              data-testid={`${testId}-tile-${slot.dataIndex}`}
              data-recency={slot.dataIndex === 0 ? "current" : "past"}
              data-size={size}
              style={{ width: size, height: size }}
              className={`recent-form-tile match-chip ${slot.result === "W" ? "win" : "loss"} group/form-tile relative flex shrink-0 items-center justify-center ${
                slot.dataIndex === 0 ? "recent-form-tile-newest" : ""
              }`}
            >
              <span
                role="tooltip"
                className={`pointer-events-none absolute right-0 bottom-[calc(100%+6px)] z-30 w-max max-w-[150px] rounded-sm border border-border-strong bg-inset px-2 py-1.5 text-left font-body normal-case tracking-normal text-text-primary opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.5)] transition-opacity duration-150 motion-reduce:transition-none group-hover/form-tile:opacity-100 group-focus-within/form-tile:opacity-100`}
              >
                <span className={`block font-display text-[11px] font-bold uppercase ${slot.result === "W" ? "text-victory" : "text-defeat"}`}>
                  {slot.result === "W" ? "Victory" : "Defeat"}
                </span>
                {slot.rr !== null && slot.rr !== undefined ? (
                  <span className={`block text-[11px] font-semibold tabular-nums ${slot.rr >= 0 ? "text-victory" : "text-defeat"}`}>
                    {fmtDelta(slot.rr)} RR
                  </span>
                ) : (
                  <span className="block text-[11px] text-text-muted">RR unavailable</span>
                )}
                <span className="block text-[11px] text-text-secondary">{slot.age}</span>
              </span>
            </span>
          );
        })}
        <ChevronRight size={9} className="shrink-0 text-text-muted" aria-hidden="true" />
      </span>
    </span>
  );
}
