import { useApp } from "../../state/AppContext";
import { useLiveData } from "../../state/LiveDataContext";
import { timeAgo } from "../../lib/format";
import type { GameState } from "../../api/types";

const STATE_STYLE: Record<GameState, { label: string; color: string }> = {
  INGAME: { label: "In Game", color: "#10B981" },
  PREGAME: { label: "Agent Select", color: "#F59E0B" },
  MENUS: { label: "In Lobby", color: "#3B82F6" },
  OFFLINE: { label: "Offline", color: "#71717A" },
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
      className="h-9 shrink-0 border-t border-edge bg-panel flex items-center gap-4 px-4 text-[11px] text-zinc-500 font-mono"
    >
      <span data-testid="status-state" className="inline-flex items-center gap-1.5 font-semibold" style={{ color: st.color }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
        {st.label.toUpperCase()}
      </span>

      {isLive && board?.map && (
        <span data-testid="status-match">
          {board.map} · {board.mode}
          {board.score && board.score.ally !== undefined && (
            <span className="text-zinc-300"> · {board.score.ally}–{board.score.enemy}</span>
          )}
        </span>
      )}

      <span className="flex-1" />

      {backendDown ? (
        <span data-testid="status-backend" className="text-red-400 font-semibold">BACKEND OFFLINE</span>
      ) : (
        <span data-testid="status-backend">
          {isLive ? "LIVE DATA" : "WAITING FOR CLIENT"}
        </span>
      )}
      {updatedAt && <span data-testid="status-updated">upd {timeAgo(updatedAt)}</span>}
      {health?.appVersion && <span data-testid="status-version">v{health.appVersion}</span>}
    </footer>
  );
}
