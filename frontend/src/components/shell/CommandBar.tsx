import { useApp } from "../../state/AppContext";
import { useLiveData } from "../../state/LiveDataContext";
import { timeAgo } from "../../lib/format";

const designModeEnabled = import.meta.env.DEV && import.meta.env.VITE_DESIGN_MODE === "true";

function StatusModule({
  testId,
  children,
  className = "",
}: {
  testId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`flex h-7 items-center gap-1.5 rounded-sm border border-edge bg-inset px-2 text-[11.5px] font-semibold text-text-secondary ${className}`}
    >
      {children}
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${className}`} />;
}

export function CommandBar() {
  const { health } = useApp();
  const { board, isLive, updatedAt, loading } = useLiveData();

  const clientOk = health?.clientStatus === "ok";
  const backendOk = health ? health.ok : false;

  const inMatch = board?.state === "INGAME";
  const pregame = board?.state === "PREGAME";
  const menus = board?.state === "MENUS";

  const stateChip = !board
    ? { label: "Offline", cls: "text-text-muted", dot: "bg-text-muted", pulse: false }
    : inMatch
      ? { label: "In match", cls: "text-victory", dot: "bg-victory", pulse: true }
      : pregame
        ? { label: "Pre-match", cls: "text-ally", dot: "bg-ally", pulse: true }
        : menus
          ? { label: "In lobby", cls: "text-text-secondary", dot: "bg-text-secondary", pulse: false }
          : { label: "Offline", cls: "text-text-muted", dot: "bg-text-muted", pulse: false };

  // Match context only — the running score stays in the game the user is
  // already playing, so the tracker does not repeat it.
  const matchLabel =
    board && (board.map || board.mode)
      ? [board.map, board.mode].filter(Boolean).join(" · ")
      : null;

  const updatedLabel = loading
    ? "Syncing…"
    : designModeEnabled
      ? "Preview"
      : isLive
        ? "Live"
        : board
          ? "Saved"
          : "—";

  return (
    <header
      data-testid="command-bar"
      className="relative z-40 flex h-12 shrink-0 items-center gap-2 border-b border-edge bg-panel pl-[76px] pr-2"
    >
      {/* Game state */}
      <StatusModule testId="status-state" className={stateChip.cls}>
        <Dot className={`${stateChip.dot} ${stateChip.pulse ? "pulse-dot" : ""}`} />
        <span className="font-display uppercase tracking-[0.08em]">{stateChip.label}</span>
      </StatusModule>

      {/* Current match context */}
      {matchLabel && (
        <StatusModule testId="status-match">
          <span className="max-w-[360px] truncate" title={matchLabel}>
            {matchLabel}
          </span>
        </StatusModule>
      )}

      <div className="flex-1" />

      {/* Live / saved + last update */}
      <StatusModule testId="status-updated" className={isLive && !loading ? "text-victory" : undefined}>
        <Dot className={isLive && !loading ? "bg-victory pulse-dot" : "bg-text-muted"} />
        {updatedLabel}
        {updatedAt !== null && !loading && (
          <span className="num text-text-muted">· {timeAgo(updatedAt)}</span>
        )}
      </StatusModule>

      {/* Riot client */}
      <StatusModule testId="status-client" className={clientOk ? "text-victory" : "text-text-muted"}>
        <Dot className={clientOk ? "bg-victory" : "bg-text-muted"} />
        Client
      </StatusModule>

      {/* Backend */}
      <StatusModule testId="status-backend" className={backendOk ? "text-ally" : "text-defeat"}>
        <Dot className={backendOk ? "bg-ally" : "bg-defeat"} />
        API
      </StatusModule>

      {/* Version */}
      <StatusModule testId="status-version" className="text-text-muted">
        {health?.appVersion ? `v${health.appVersion}` : "—"}
      </StatusModule>
    </header>
  );
}
