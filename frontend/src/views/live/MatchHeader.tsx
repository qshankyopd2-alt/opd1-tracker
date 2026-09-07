import type { LiveBoard } from "../../api/types";

export function probabilityTone(value: number): string {
  if (value >= 55) return "var(--accent-team-a)";
  if (value <= 45) return "var(--accent-team-b)";
  return "var(--text-secondary)";
}

export function MatchHeader({ board }: { board: LiveBoard }) {
  if (board.state === "OFFLINE") return null;
  const context = (
    <div className="flex min-w-0 items-center gap-3" data-testid="match-context">
      <div className="min-w-0">
        <h1 className="truncate font-display text-[20px] font-semibold leading-tight">{board.map ?? (board.state === "MENUS" ? "Your lobby" : "Live match")}</h1>
        <p className="text-[12px] text-text-secondary">{board.stateLabel}{board.map && ` · ${board.mode}`}</p>
      </div>
      {board.score && <span data-testid="match-score" className="border-l border-edge pl-3 font-display text-[22px] tabular-nums" aria-label={`Your team ${board.score.ally}, enemy team ${board.score.enemy}`}>{board.score.ally}–{board.score.enemy}</span>}
    </div>
  );
  if (board.state === "INGAME") {
    const probability = typeof board.winProb === "number" && Number.isFinite(board.winProb) ? Math.max(0, Math.min(100, board.winProb)) : null;

    return (
      <section data-testid="match-header" className="live-match-header flex min-h-[56px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-edge px-3 py-2">
        {context}
        {probability !== null && <div className="ml-auto flex w-[340px] max-w-full items-center gap-3">
        <span className="shrink-0 text-[12px] font-medium text-[var(--text-secondary)]" title="Estimate based on team ranks and recent K/D, not a guaranteed outcome.">Estimated win chance</span>
        <div
          role="meter"
          aria-label="Your team estimated win chance"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={probability}
          aria-valuetext={`${probability} percent`}
          className="win-chance-track relative h-2 flex-1 overflow-hidden border"
          data-testid="win-probability"
        >
          <span className="absolute inset-y-0 left-1/2 z-10 w-px bg-[var(--text-secondary)]" aria-hidden="true" />
          <span
            className="block h-full transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${probability}%`, backgroundColor: probabilityTone(probability) }}
          />
        </div>
        <span className="num w-12 shrink-0 text-right text-[18px] font-semibold text-[var(--text-primary)]">{probability}%</span>
        </div>}
      </section>
    );
  }

  if (board.state === "PREGAME" && board.lockProgress) {
    return (
      <section data-testid="match-header" className="live-match-header flex h-9 min-h-[36px] shrink-0 items-center rounded-lg border border-edge bg-panel px-3">
        {context}
        <span className="ml-auto mr-3 text-[12px] font-medium text-[var(--text-secondary)]">Agents locked</span>
        <span className="num text-[14px] font-semibold text-[var(--text-primary)]" data-testid="lock-progress">
          {board.lockProgress.locked}/{board.lockProgress.total}
        </span>
      </section>
    );
  }

  if (board.state === "MENUS" && board.queue?.available) {
    return (
      <section data-testid="match-header" className="live-match-header flex h-9 min-h-[36px] shrink-0 items-center rounded-lg border border-edge bg-panel px-3">
        {context}
        <span className="ml-auto mr-3 text-[12px] font-medium text-[var(--text-primary)]" data-testid="queue-info">
          {board.queue.queueName ?? "No queue selected"}
        </span>
        <span className="ml-auto text-[12px] text-[var(--text-secondary)]">
          {board.queue.inQueue ? "In queue" : `Party of ${board.queue.partySize ?? 1}`}
        </span>
      </section>
    );
  }

  return <section className="live-match-header shrink-0 px-3 py-2" data-testid="match-header">{context}</section>;
}
