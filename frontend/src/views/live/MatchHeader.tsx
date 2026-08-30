import type { LiveBoard } from "../../api/types";

export function probabilityTone(value: number): string {
  if (value >= 55) return "#10B981";
  if (value <= 45) return "#EF4444";
  return "#F59E0B";
}

export function MatchHeader({ board }: { board: LiveBoard }) {
  if (board.state === "INGAME") {
    if (board.winProb === null) return null;
    const probability = Math.max(0, Math.min(100, board.winProb));

    return (
      <section data-testid="match-header" className="live-match-header flex min-h-11 shrink-0 items-center gap-3 rounded-sm border border-edge bg-panel px-3">
        <span className="shrink-0 text-[11px] font-semibold text-zinc-300">Win chance</span>
        <div
          role="meter"
          aria-label="Your team win chance"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={probability}
          aria-valuetext={`${probability} percent`}
          className="relative h-2 flex-1 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900"
          data-testid="win-probability"
        >
          <span className="absolute inset-y-0 left-1/2 z-10 w-px bg-zinc-400/55" aria-hidden="true" />
          <span
            className="block h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${probability}%`, backgroundColor: probabilityTone(probability) }}
          />
        </div>
        <span className="w-11 shrink-0 text-right font-mono text-[14px] font-bold text-zinc-100 num">{probability}%</span>
      </section>
    );
  }

  if (board.state === "PREGAME" && board.lockProgress) {
    return (
      <section data-testid="match-header" className="live-match-header flex min-h-11 shrink-0 items-center rounded-sm border border-edge bg-panel px-3">
        <span className="text-[11px] font-semibold text-zinc-300">Agents locked</span>
        <span className="ml-auto font-mono text-[14px] font-bold text-brand num" data-testid="lock-progress">
          {board.lockProgress.locked}/{board.lockProgress.total}
        </span>
      </section>
    );
  }

  if (board.state === "MENUS" && board.queue?.available) {
    return (
      <section data-testid="match-header" className="live-match-header flex min-h-11 shrink-0 items-center rounded-sm border border-edge bg-panel px-3">
        <span className="text-[11px] font-semibold text-zinc-300" data-testid="queue-info">
          {board.queue.queueName ?? "No queue selected"}
        </span>
        <span className="ml-auto text-[11px] text-zinc-500">
          {board.queue.inQueue ? "In queue" : `Party of ${board.queue.partySize ?? 1}`}
        </span>
      </section>
    );
  }

  return null;
}
