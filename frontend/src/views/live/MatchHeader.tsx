import type { LiveBoard } from "../../api/types";

export function probabilityTone(value: number): string {
  if (value >= 55) return "var(--accent-team-a)";
  if (value <= 45) return "var(--accent-team-b)";
  return "var(--text-secondary)";
}

export function MatchHeader({ board }: { board: LiveBoard }) {
  if (board.state === "INGAME") {
    if (board.winProb === null) return null;
    const probability = Math.max(0, Math.min(100, board.winProb));

    return (
      <section data-testid="match-header" className="live-match-header flex h-10 min-h-[40px] shrink-0 items-center gap-3 rounded-[var(--radius-md)] border border-edge px-3">
        <span className="shrink-0 text-[12px] font-medium text-[var(--text-secondary)]">Win chance</span>
        <div
          role="meter"
          aria-label="Your team win chance"
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
      </section>
    );
  }

  if (board.state === "PREGAME" && board.lockProgress) {
    return (
      <section data-testid="match-header" className="live-match-header flex h-9 min-h-[36px] shrink-0 items-center rounded-lg border border-edge bg-panel px-3">
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">Agents locked</span>
        <span className="num ml-auto text-[14px] font-semibold text-[var(--text-primary)]" data-testid="lock-progress">
          {board.lockProgress.locked}/{board.lockProgress.total}
        </span>
      </section>
    );
  }

  if (board.state === "MENUS" && board.queue?.available) {
    return (
      <section data-testid="match-header" className="live-match-header flex h-9 min-h-[36px] shrink-0 items-center rounded-lg border border-edge bg-panel px-3">
        <span className="text-[12px] font-medium text-[var(--text-primary)]" data-testid="queue-info">
          {board.queue.queueName ?? "No queue selected"}
        </span>
        <span className="ml-auto text-[12px] text-[var(--text-secondary)]">
          {board.queue.inQueue ? "In queue" : `Party of ${board.queue.partySize ?? 1}`}
        </span>
      </section>
    );
  }

  return null;
}
