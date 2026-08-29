import { useApp } from "../../state/AppContext";
import { useLiveData } from "../../state/LiveDataContext";
import { timeAgo } from "../../lib/format";
import type { GameState } from "../../api/types";

const STATE_STYLE: Record<GameState, { label: string; bg: string; text: string; border: string }> = {
  INGAME: { label: "In Game", bg: "bg-victory/10", text: "text-victory", border: "border-victory/20" },
  PREGAME: { label: "Agent Select", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  MENUS: { label: "In Lobby", bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  OFFLINE: { label: "Offline", bg: "bg-zinc-800", text: "text-zinc-400", border: "border-zinc-700" },
};

export function StatusBar() {
  const { health, healthError } = useApp();
  const { board, isLive, updatedAt } = useLiveData();

  const effectiveState: GameState = isLive ? (board?.state ?? "OFFLINE") : "OFFLINE";
  const st = STATE_STYLE[effectiveState] ?? STATE_STYLE.OFFLINE;
  const backendDown = Boolean(healthError);

  return (
    <footer
      data-testid="status-bar"
      className="h-10 shrink-0 border-t border-edge bg-panel flex items-center px-4 text-[11px] text-zinc-500 font-mono shadow-[0_-1px_2px_rgba(0,0,0,0.5)] z-10 relative"
    >
      <div className="flex items-center gap-4 flex-1">
        <span
          data-testid="status-state"
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm uppercase tracking-wider text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${effectiveState !== 'OFFLINE' ? 'pulse-dot bg-current' : 'bg-current opacity-50'}`} />
          {st.label}
        </span>

        {isLive && board?.map && (
          <div data-testid="status-match" className="flex items-center gap-2">
            <span className="text-zinc-300 font-semibold">{board.map}</span>
            <span className="text-zinc-600">/</span>
            <span className="uppercase tracking-wider text-[10px]">{board.mode}</span>
            {board.score && board.score.ally !== undefined && (
              <>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-300 num font-semibold">
                  <span className="text-victory">{board.score.ally}</span>
                  <span className="text-zinc-500 mx-0.5">–</span>
                  <span className="text-defeat">{board.score.enemy}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 justify-end">
        {backendDown ? (
          <span data-testid="status-backend" className="text-defeat font-bold uppercase tracking-widest text-[10px] bg-defeat/10 px-2 py-0.5 rounded-sm border border-defeat/20">BACKEND OFFLINE</span>
        ) : (
          <span data-testid="status-backend" className="font-semibold uppercase tracking-widest text-[10px]">
            {isLive ? <span className="text-victory">LIVE DATA</span> : "WAITING FOR CLIENT"}
          </span>
        )}

        {updatedAt && (
          <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
            <span data-testid="status-updated">upd {timeAgo(updatedAt)}</span>
          </div>
        )}

        {health?.appVersion && (
          <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
            <span data-testid="status-version" className="text-zinc-600">v{health.appVersion}</span>
          </div>
        )}
      </div>
    </footer>
  );
}
