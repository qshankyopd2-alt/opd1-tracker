import { Monitor, Power, Crosshair } from "lucide-react";
import { useApp } from "../../state/AppContext";
import type { Notice } from "../../api/types";

export function OfflineHero({ notice }: { notice?: Notice }) {
  const { healthError } = useApp();
  const backendDown = Boolean(healthError);

  return (
    <div data-testid="offline-hero" className="flex h-full min-h-[480px] items-center justify-center p-8">
      <div className="w-full max-w-lg text-center rise">
        <div className="relative overflow-hidden rounded-md border border-edge bg-card p-10">
          <div className="absolute left-0 top-0 h-1 w-full bg-brand" />

          <div className="inline-flex items-center gap-3 mb-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-brand-hover bg-brand">
              <Crosshair size={22} className="text-app" />
            </span>
            <span className="font-display text-[42px] font-bold leading-none tracking-[-0.03em] text-zinc-100">
              OPD<span className="text-brand">1</span>
            </span>
          </div>

          <h1 className="font-display text-[28px] font-bold tracking-[-0.02em] text-zinc-100">
            {backendDown ? "Backend not reachable" : "VALORANT not detected"}
          </h1>
          <p className="text-zinc-400 mt-3 leading-relaxed text-[13px] max-w-sm mx-auto font-medium">
            {backendDown
              ? "The OPD1 data service isn't responding. Restart OPD1 Tracker; startup details are saved in the app's local logs folder."
              : notice?.message ??
                "Start VALORANT and sign in. Live ranks, parties, K/D intel and loadouts appear automatically the moment your client is running."}
          </p>

          {!backendDown && (
            <div className="mt-8 grid grid-cols-2 gap-4 text-left">
              <div className="group rounded-sm border border-edge bg-panel p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-800">
                <Power size={16} className="text-brand mb-2.5 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="text-[12px] font-semibold text-zinc-200">1 · Launch VALORANT</div>
                <div className="text-[12px] text-text-secondary mt-1 font-medium leading-snug">OPD1 reads the local Riot client on this PC.</div>
              </div>
              <div className="group rounded-sm border border-edge bg-panel p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-800">
                <Monitor size={16} className="text-brand mb-2.5 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="text-[12px] font-semibold text-zinc-200">2 · Keep OPD1 open</div>
                <div className="text-[12px] text-text-secondary mt-1 font-medium leading-snug">Lobby, agent select and matches are tracked live.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
