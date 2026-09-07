import { fmtDelta, matchAgeLabel } from "../../lib/format";
import { normalizeOutcome, type Outcome } from "../ui/OutcomeBadge";

export interface RecentFormDetail {
  result?: "W" | "L" | "D" | "?" | "Victory" | "Defeat" | "Draw";
  rrDelta?: number | null;
  startMillis?: number | null;
}
const LABEL: Record<Outcome, string> = { win: "Victory", loss: "Defeat", draw: "Draw", unresolved: "Unavailable" };
const SHORT: Record<Outcome, string> = { win: "W", loss: "L", draw: "D", unresolved: "—" };

export function RecentFormTiles({ form, latestRr, recentDetails, onRequestDetails, testId }: {
  form: ("W" | "L" | "D" | "?")[];
  latestRr: number | null | undefined;
  recentDetails?: RecentFormDetail[];
  onRequestDetails?: () => void;
  testId: string;
}) {
  // Career is all modes; live form may be competitive-only. Never join their rows by index.
  const detailed = Boolean(recentDetails?.length);
  const slots = Array.from({ length: 5 }, (_, index) => {
    const detail = detailed ? recentDetails?.[index] : undefined;
    const outcome = normalizeOutcome(detailed ? detail?.result : form[index]);
    const rr = detailed ? detail?.rrDelta : index === 0 ? latestRr : null;
    const age = detail?.startMillis ? matchAgeLabel(detail.startMillis) : "Match age unavailable";
    const description = `${index === 0 ? "Newest match" : `Match ${index + 1}`} · ${LABEL[outcome]} · ${rr == null ? "RR unavailable" : `${fmtDelta(rr)} RR`} · ${age}`;
    return { outcome, description };
  });
  return (
    <span className="recent-form" data-testid={testId} onPointerEnter={onRequestDetails}>
      <span className="recent-form-label" aria-hidden="true">Latest</span>
      <span className="sr-only">{detailed ? "Recent matches, all modes" : "Sampled recent form"}, newest to oldest: {slots.map(({ outcome }) => LABEL[outcome]).join(", ")}.</span>
      {slots.map(({ outcome, description }, index) => (
        <span key={index} tabIndex={0} role="img" aria-label={description} title={description}
          onFocus={onRequestDetails} data-testid={`${testId}-tile-${index}`} data-outcome={outcome} data-recency={index === 0 ? "current" : "past"}
          className="recent-result"><span aria-hidden="true">{SHORT[outcome]}</span></span>
      ))}
    </span>
  );
}
