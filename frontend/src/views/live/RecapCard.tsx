import type { Recap } from "../../api/types";
import { fmtDelta, scoreline } from "../../lib/format";
import { resultColor } from "../../lib/format";

export function RecapCard({ recap }: { recap: Recap }) {
  const you = recap.you;
  return (
    <div
      data-testid="recap-card"
      className="relative rounded-md border border-edge overflow-hidden rise"
    >
      {recap.mapSplash && (
        <img src={recap.mapSplash} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" draggable={false} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/60" />
      <div className="relative flex items-center gap-5 px-4 py-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Last match</div>
          <div className="font-display font-black text-xl uppercase" style={{ color: resultColor(recap.result) }}>
            {recap.result ?? "Finished"}
          </div>
        </div>
        <div className="text-[13px] text-zinc-300">
          {recap.map} · {recap.mode} · <span className="num">{scoreline(recap.scores, you?.team)}</span>
        </div>
        {you && (
          <div className="text-[13px] text-zinc-300 num">
            You: {you.kills}/{you.deaths}/{you.assists} · {you.acs} ACS
          </div>
        )}
        {recap.rrDelta !== null && recap.rrDelta !== undefined && (
          <div className={`font-display font-black text-xl num ${recap.rrDelta >= 0 ? "text-victory" : "text-defeat"}`}>
            {fmtDelta(recap.rrDelta)} RR
          </div>
        )}
        {recap.mvp && (
          <div className="text-[12px] text-zinc-400 ml-auto">
            MVP <span className="text-zinc-200 font-semibold">{recap.mvp.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
