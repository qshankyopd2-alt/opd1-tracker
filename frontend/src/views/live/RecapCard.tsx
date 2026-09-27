import { Trophy } from "lucide-react";
import type { Recap } from "../../api/types";
import { fmtDelta, scoreline } from "../../lib/format";
import { OutcomeBadge, normalizeOutcome } from "../../components/ui/OutcomeBadge";

export function RecapCard({ recap }: { recap: Recap }) {
  const you = recap.you;
  return (
    <div data-testid="recap-card" className="relative overflow-hidden rounded-md border border-edge bg-panel rise">
      {recap.mapSplash && (
        <img src={recap.mapSplash} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel/80 to-panel/50" aria-hidden="true" />
      <span className="absolute left-0 top-0 h-full w-[3px] bg-accent" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="micro-label">Last match</span>
          <OutcomeBadge size="sm" outcome={normalizeOutcome(recap.result)} score={scoreline(recap.scores, you?.team)} />
        </div>
        <div className="text-[12.5px] font-medium text-text-secondary">
          <span className="font-display font-bold text-text-primary">{recap.map}</span>
          <span className="text-text-muted"> · {recap.mode}</span>
        </div>
        {you && (
          <div className="num text-[12.5px] font-medium text-text-secondary" title="Your match result">
            You: <span className="font-semibold text-text-primary">{you.kills}/{you.deaths}/{you.assists}</span>
            <span className="text-text-muted"> · </span>{you.acs} ACS
          </div>
        )}
        {recap.rrDelta !== null && recap.rrDelta !== undefined && (
          <div className={`num font-display text-[15px] font-bold ${recap.rrDelta >= 0 ? "text-victory" : "text-defeat"}`} title="Rating change">
            {fmtDelta(recap.rrDelta)} RR
          </div>
        )}
        {recap.mvp && (
          <div className="ml-auto flex items-center gap-1.5 text-[12px] text-text-muted">
            <Trophy size={12} className="text-gold" />
            MVP <span className="font-semibold text-text-primary">{recap.mvp.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
