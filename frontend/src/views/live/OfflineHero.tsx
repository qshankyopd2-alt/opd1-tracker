import { Monitor, Power, Crosshair } from "lucide-react";
import { useApp } from "../../state/AppContext";
import type { Notice } from "../../api/types";

export function OfflineHero({ notice }: { notice?: Notice }) {
  const { healthError, health } = useApp();
  const backendDown = Boolean(healthError);

  return (
    <div data-testid="offline-hero" className="flex h-full min-h-[480px] items-center justify-center p-8">
      <div className="w-full max-w-lg text-center rise">
        <div className="relative overflow-hidden rounded-md border border-edge bg-panel">
          <span className="absolute left-0 top-0 h-[3px] w-full bg-accent" aria-hidden="true" />
          <div className="p-10">
            <div className="mb-8 flex items-center justify-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent text-white">
                <Crosshair size={22} strokeWidth={2.5} />
              </span>
              <span className="font-display text-[40px] font-bold leading-none tracking-[0.02em] text-text-primary">
                OPD<span className="text-accent">1</span>
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Tracker</span>
            </div>

            <h1 className="font-display text-[24px] font-bold uppercase tracking-[0.06em] text-text-primary">
              {backendDown ? "Backend not reachable" : "VALORANT not detected"}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[12.5px] font-medium leading-relaxed text-text-secondary">
              {backendDown
                ? "The OPD1 data service isn't responding. Restart OPD1 Tracker; startup details are saved in the app's local logs folder."
                : notice?.message ??
                  "Start VALORANT and sign in. Live ranks, parties, K/D intel and loadouts appear automatically the moment your client is running."}
            </p>

            <div
              data-testid="offline-client-chip"
              className={`mx-auto mt-5 flex w-max items-center gap-2 rounded-sm border px-3 py-1.5 text-[11.5px] font-semibold ${
                health?.clientStatus === "ok"
                  ? "border-victory/30 bg-victory-subtle text-victory"
                  : "border-edge bg-card text-text-secondary"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${health?.clientStatus === "ok" ? "bg-victory" : "bg-text-muted"}`} />
              {health?.clientStatus === "ok" ? "Client detected" : "Client status: offline"}
            </div>

            {!backendDown && (
              <div className="mt-8 grid grid-cols-2 gap-3 text-left">
                <div className="group rounded-sm border border-edge bg-card p-4 transition-colors hover:border-border-strong">
                  <Power size={16} className="mb-2.5 text-accent opacity-80 transition-opacity group-hover:opacity-100" />
                  <div className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-text-primary">
                    1 · Launch VALORANT
                  </div>
                  <div className="mt-1 text-[12px] font-medium leading-snug text-text-secondary">
                    OPD1 reads the local Riot client on this PC.
                  </div>
                </div>
                <div className="group rounded-sm border border-edge bg-card p-4 transition-colors hover:border-border-strong">
                  <Monitor size={16} className="mb-2.5 text-accent opacity-80 transition-opacity group-hover:opacity-100" />
                  <div className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-text-primary">
                    2 · Keep OPD1 open
                  </div>
                  <div className="mt-1 text-[12px] font-medium leading-snug text-text-secondary">
                    Lobby, agent select and matches are tracked live.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
