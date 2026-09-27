import type { LiveBoard } from "../../api/types";

export function probabilityTone(value: number): string {
  if (value >= 55) return "var(--ally)";
  if (value <= 45) return "var(--enemy)";
  return "var(--text-secondary)";
}

export function MatchHeader({ board }: { board: LiveBoard }) {
  if (board.state === "INGAME") {
    if (board.winProb === null) return null;
    const probability = Math.max(0, Math.min(100, board.winProb));
    const enemyChance = 100 - probability;
    const round = board.score?.round;

    return (
      <section data-testid="match-header" className="live-match-header flex h-[52px] min-h-[52px] shrink-0 items-stretch overflow-hidden">
        {board.mapSplash && (
          <img src={board.mapSplash} alt="" className="live-match-header-splash" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />
        )}
        <span className="live-match-header-matte" aria-hidden="true" />

        {/* Map & mode — the live score stays in the game itself, not the tracker */}
        <div className="relative flex min-w-0 flex-1 items-center gap-2.5 px-4">
          <span className="section-tick" aria-hidden="true" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-[16px] font-bold uppercase tracking-[0.04em] text-text-primary">{board.map}</div>
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-text-secondary">
              <span className="truncate">{board.mode} · Live</span>
              {round !== null && round !== undefined && (
                <span className="shrink-0 font-semibold tabular-nums" title="Round" data-testid="match-round">
                  R{round}
                </span>
              )}
              {board.side && (
                <span className="inline-flex w-max shrink-0 rounded-sm border border-ally/40 bg-ally-subtle px-1.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ally" title={`${board.side === "Attacker" ? "Your team attacks" : "Your team defends"}`} data-testid="match-side">
                  {board.side === "Attacker" ? "ATT" : "DEF"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Win probability — explicitly an estimate */}
        <div className="relative flex w-[280px] shrink-0 items-center gap-3 border-l border-edge/70 bg-panel/60 px-4">
          <div className="leading-none">
            <div className="micro-label mb-1.5 text-warn">Win chance · Estimate</div>
            <div
              role="meter"
              aria-label="Your team win chance (estimate)"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={probability}
              aria-valuetext={`${probability} percent estimate`}
              className="win-chance-track flex h-[7px] w-[150px]"
              data-testid="win-probability"
            >
              <span className="block h-full" style={{ width: `${probability}%`, backgroundColor: "var(--ally)" }} />
              <span className="block h-full" style={{ width: `${enemyChance}%`, backgroundColor: "var(--enemy)", opacity: 0.55 }} />
            </div>
          </div>
          <div className="text-right leading-none">
            <div className="font-display text-[20px] font-bold tabular-nums" style={{ color: probabilityTone(probability) }}>
              {probability}%
            </div>
            <div className="micro-label mt-0.5">For you</div>
          </div>
        </div>
      </section>
    );
  }

  if (board.state === "PREGAME" && board.lockProgress) {
    const { locked, total } = board.lockProgress;
    return (
      <section data-testid="match-header" className="live-match-header flex h-[46px] min-h-[46px] shrink-0 items-center gap-4 px-4">
        <div className="flex shrink-0 items-center gap-2">
          <span className="section-tick" aria-hidden="true" />
          <span className="font-display text-[14px] font-bold uppercase tracking-[0.06em] text-text-primary">Agent select</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="micro-label shrink-0">Your locks</span>
          <div className="flex shrink-0 gap-1" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-[7px] w-7 rounded-sm ${i < locked ? "bg-ally" : "bg-inset border border-edge"}`}
              />
            ))}
          </div>
          <span className="num shrink-0 font-display text-[14px] font-bold text-ally" data-testid="lock-progress">
            {locked}/{total} locked
          </span>
        </div>
        <div className="hidden shrink-0 items-center gap-2 text-[11.5px] text-text-secondary sm:flex">
          <span className="micro-label">Enemy</span>
          <span>Hidden until the match starts</span>
        </div>
      </section>
    );
  }

  if (board.state === "MENUS" && board.queue?.available) {
    const queue = board.queue;
    return (
      <section data-testid="match-header" className="live-match-header flex h-[46px] min-h-[46px] shrink-0 items-center gap-4 px-4">
        <div className="flex shrink-0 items-center gap-2">
          <span className="section-tick" aria-hidden="true" />
          <span className="font-display text-[14px] font-bold uppercase tracking-[0.06em] text-text-primary">Lobby</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 text-[12px] text-text-secondary">
          <span className="truncate font-semibold text-text-primary" data-testid="queue-info">
            {queue.queueName ?? "No queue selected"}
          </span>
          <span className="micro-label shrink-0">Party</span>
          <span className="num shrink-0 font-display font-bold text-text-primary">
            {queue.inQueue ? "In queue" : `×${queue.partySize ?? 1}`}
          </span>
          {queue.allReady !== undefined && (
            <span className={`shrink-0 font-semibold ${queue.allReady ? "text-victory" : "text-text-muted"}`}>
              {queue.allReady ? "All ready" : "Waiting for ready"}
            </span>
          )}
          {queue.message && <span className="truncate text-text-muted">{queue.message}</span>}
        </div>
      </section>
    );
  }

  return null;
}
