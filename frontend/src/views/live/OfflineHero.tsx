import { Monitor, Power, Crosshair } from "lucide-react";
import { useApp } from "../../state/AppContext";
import type { Notice } from "../../api/types";

export function OfflineHero({ notice }: { notice?: Notice }) {
  const { healthError } = useApp();
  const backendDown = Boolean(healthError);

  return (
    <div data-testid="offline-hero" className="h-full min-h-[480px] flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-ink to-ink">
      <div className="max-w-lg w-full text-center rise relative">
        <div className="absolute inset-0 bg-zinc-800/10 [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10 bg-[length:16px_16px] [background-position:-1px_-1px] bg-[radial-gradient(circle_at_1px_1px,theme(colors.zinc.800)_1px,transparent_0)] opacity-50 rounded-md"></div>
        <div className="border border-zinc-800 bg-card/80 backdrop-blur-sm rounded-md p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent"></div>

          <div className="inline-flex items-center gap-3 mb-8">
            <span className="flex items-center justify-center w-10 h-10 bg-brand border border-brand_hover rounded-[2px] shadow-[0_0_12px_rgba(249,115,22,0.4)]">
              <Crosshair size={22} className="text-white" />
            </span>
            <span className="font-display italic font-black text-[42px] leading-none tracking-tight text-zinc-100 drop-shadow-sm">
              OPD<span className="text-brand">1</span>
            </span>
          </div>

          <h1 className="font-display font-black italic uppercase tracking-wide text-[28px] text-zinc-100">
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
              <div className="border border-zinc-700/60 rounded-sm p-4 bg-zinc-900/80 hover:border-zinc-600 hover:bg-zinc-800/80 transition-colors group">
                <Power size={16} className="text-brand mb-2.5 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="text-[12px] font-bold uppercase tracking-wider text-zinc-200">1 · Launch VALORANT</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-medium leading-snug">OPD1 reads the local Riot client on this PC.</div>
              </div>
              <div className="border border-zinc-700/60 rounded-sm p-4 bg-zinc-900/80 hover:border-zinc-600 hover:bg-zinc-800/80 transition-colors group">
                <Monitor size={16} className="text-brand mb-2.5 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="text-[12px] font-bold uppercase tracking-wider text-zinc-200">2 · Keep OPD1 open</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-medium leading-snug">Lobby, agent select and matches are tracked live.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
