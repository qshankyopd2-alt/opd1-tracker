import { Monitor, Power } from "lucide-react";
import { useApp } from "../../state/AppContext";
import type { Notice } from "../../api/types";

export function OfflineHero({ notice }: { notice?: Notice }) {
  const { healthError } = useApp();
  const backendDown = Boolean(healthError);

  return (
    <div data-testid="offline-hero" className="h-full min-h-[480px] flex items-center justify-center p-8">
      <div className="max-w-lg text-center rise">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="w-4 h-9 bg-brand rounded-[2px]" />
          <span className="font-display italic font-black text-5xl tracking-tight">
            OPD<span className="text-brand">1</span>
          </span>
        </div>

        <h1 className="font-display font-bold uppercase tracking-wide text-2xl text-zinc-100">
          {backendDown ? "Backend not reachable" : "VALORANT not detected"}
        </h1>
        <p className="text-zinc-400 mt-3 leading-relaxed text-[13px]">
          {backendDown
            ? "The OPD1 data service isn't responding. Restart OPD1 Tracker; startup details are saved in the app's local logs folder."
            : notice?.message ??
              "Start VALORANT and sign in. Live ranks, parties, K/D intel and loadouts appear automatically the moment your client is running."}
        </p>

        {!backendDown && (
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="border border-edge rounded-md p-3 bg-card">
              <Power size={15} className="text-brand mb-2" />
              <div className="text-[12px] font-semibold text-zinc-200">1 · Launch VALORANT</div>
              <div className="text-[11px] text-zinc-500 mt-1">OPD1 reads the local Riot client on this PC.</div>
            </div>
            <div className="border border-edge rounded-md p-3 bg-card">
              <Monitor size={15} className="text-brand mb-2" />
              <div className="text-[12px] font-semibold text-zinc-200">2 · Keep OPD1 open</div>
              <div className="text-[11px] text-zinc-500 mt-1">Lobby, agent select and matches are tracked live.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
