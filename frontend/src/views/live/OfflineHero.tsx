import { Monitor, Power, ArrowRight } from "lucide-react";
import { useApp } from "../../state/AppContext";
import type { Notice } from "../../api/types";

export function OfflineHero({ notice }: { notice?: Notice }) {
  const { healthError, setView } = useApp();
  return (
    <section data-testid="offline-hero" className="offline-workspace">
      <div className="offline-intro">
        <p className="text-[12px] tracking-[0.18em] text-brand">OPD1 TRACKER / LIVE MATCH</p>
        <h1 className="font-display text-[42px] leading-tight mt-5">{healthError ? "Connection interrupted." : "Ready when you are."}</h1>
        <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-text-secondary">{healthError
          ? "The OPD1 data service is not responding. Restart the application to reconnect."
          : notice?.message ?? "Launch VALORANT and sign in. Your lobby, agent selections and match roster appear here automatically."}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" data-testid="offline-history" onClick={() => setView("history")} className="inline-flex items-center gap-3 rounded bg-brand px-4 py-2 text-app">Review match history <ArrowRight size={16} /></button>
          <button type="button" data-testid="offline-saved" onClick={() => setView("encounters")} className="border border-edge rounded px-4 py-2">Your saved players</button>
        </div>
      </div>
      <ol className="offline-steps">
        <li><Power size={22} /><div><span>01 / CONNECT</span><h2>Open VALORANT</h2><p>Sign in to the Riot client on this PC.</p></div></li>
        <li><Monitor size={22} /><div><span>02 / PLAY</span><h2>Keep OPD1 nearby</h2><p>Match context follows your game. Enemy information becomes available in game.</p></div></li>
      </ol>
    </section>
  );
}
