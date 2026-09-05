import { Maximize2, Minimize2 } from "lucide-react";
import { useApp } from "../../state/AppContext";
import { useLiveData } from "../../state/LiveDataContext";
import { useWindowMode } from "../../hooks/useWindowMode";
import { timeAgo } from "../../lib/format";
import type { GameState } from "../../api/types";

const STATE_STYLE: Record<GameState, { label: string; bg: string; text: string; border: string }> = {
  INGAME: { label: "In game", bg: "bg-victory/10", text: "text-victory", border: "border-victory/20" },
  PREGAME: { label: "Agent select", bg: "bg-card", text: "text-[var(--text-primary)]", border: "border-edge" },
  MENUS: { label: "In lobby", bg: "bg-card", text: "text-[var(--text-secondary)]", border: "border-edge" },
  OFFLINE: { label: "Offline", bg: "bg-card", text: "text-[var(--text-secondary)]", border: "border-edge" },
};

export function StatusBar() {
  const { health, healthError } = useApp();
  const { board, isLive, updatedAt } = useLiveData();
  const { isMaximized, toggleMode } = useWindowMode();

  const effectiveState: GameState = isLive ? (board?.state ?? "OFFLINE") : "OFFLINE";
  const st = STATE_STYLE[effectiveState] ?? STATE_STYLE.OFFLINE;
  const backendDown = Boolean(healthError);

  return (
    <footer
      data-testid="status-bar"
      className="relative z-10 flex h-10 shrink-0 items-center gap-3 border-t border-edge bg-panel px-4 text-[12px] text-[var(--text-secondary)]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          data-testid="status-state"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[12px] font-medium ${st.bg} ${st.text} ${st.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${effectiveState !== 'OFFLINE' ? 'pulse-dot bg-current' : 'bg-current opacity-50'}`} />
          {st.label}
        </span>

        {isLive && board?.map && (
          <div data-testid="status-match" className="flex min-w-0 items-center gap-2 whitespace-nowrap">
            <span className="font-medium text-[var(--text-primary)]">{board.map}</span>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="truncate">{board.mode}</span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3">
        {backendDown ? (
          <span data-testid="status-backend" className="rounded-sm border border-defeat/20 bg-defeat/10 px-2 py-0.5 font-medium text-defeat">Backend offline</span>
        ) : (
          <span data-testid="status-backend" className="font-medium">
            {isLive ? <span className="text-victory">Live data</span> : "Waiting for client"}
          </span>
        )}

        {updatedAt && (
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap border-l border-edge pl-3">
            <span data-testid="status-updated">Updated {timeAgo(updatedAt)}</span>
          </div>
        )}

        {health?.appVersion && (
          <div className="flex items-center gap-2 border-l border-edge pl-3">
            <span data-testid="status-version">v{health.appVersion}</span>
          </div>
        )}

        <div className="flex items-center gap-2 border-l border-edge pl-3">
          <button
            type="button"
            onClick={toggleMode}
            data-testid="window-mode-toggle"
            title={isMaximized ? "Switch to fixed window (1200×700)" : "Maximize window"}
            className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-card px-2 py-1 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-brand"
          >
            {isMaximized ? (
              <>
                <Minimize2 size={14} />
                <span>Fixed 1200×700</span>
              </>
            ) : (
              <>
                <Maximize2 size={14} />
                <span>Maximize</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
