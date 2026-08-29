import type { LiveBoard } from "../../api/types";

const STATE_COLOR: Record<string, string> = {
  INGAME: "#10B981",
  PREGAME: "#F59E0B",
  MENUS: "#3B82F6",
};

export function MatchHeader({ board }: { board: LiveBoard }) {
  const score = board.score;
  const lock = board.lockProgress;
  const queue = board.queue;

  return (
    <div data-testid="match-header" className="relative rounded-md border border-edge overflow-hidden">
      {board.mapSplash && (
        <img src={board.mapSplash} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" draggable={false} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/40" />

      <div className="relative flex items-center gap-6 px-4 py-3 min-h-[86px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-sm px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-ink" style={{ backgroundColor: STATE_COLOR[board.state] ?? "#71717A" }} data-testid="match-state-badge">
              {board.stateLabel}
            </div>
            {board.state !== "MENUS" && (
              <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-300">{board.mode}</span>
            )}
            {board.side && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <span className="h-1 w-1 rounded-full bg-zinc-500" />
                {board.side} SIDE
              </span>
            )}
          </div>
          <h1 className="mt-1 font-display font-black italic text-[36px] leading-none uppercase tracking-tight text-white">
            {board.state === "MENUS" ? "Party Lobby" : board.map ?? "Unknown"}
          </h1>
          {board.sourceDetail && <p className="mt-1 text-[11px] font-medium text-zinc-400">{board.sourceDetail}</p>}
        </div>

        <div className="ml-auto flex items-center gap-8">
          {score && (
            <div className="text-center" data-testid="match-score">
              <div className="flex items-center justify-center gap-3 font-display text-[42px] font-black leading-none num">
                <span className="text-victory">{score.ally}</span>
                <span className="text-zinc-500 text-[28px] font-bold opacity-60">—</span>
                <span className="text-defeat">{score.enemy}</span>
              </div>
              {score.round && <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1.5">Round {score.round}</div>}
            </div>
          )}

          {lock && (
            <div className="rounded-sm border border-edge bg-panel/80 px-4 py-2 text-center" data-testid="lock-progress">
              <div className="font-display text-[36px] font-black leading-none text-brand num">
                {lock.locked}<span className="text-zinc-500 text-[24px]">/{lock.total}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mt-1">Locked in</div>
            </div>
          )}

          {board.state === "MENUS" && queue?.available && (
            <div className="text-right" data-testid="queue-info">
              <div className="text-[13px] font-semibold text-zinc-200">{queue.queueName ?? "No queue selected"}</div>
              <div className="text-[11px] text-zinc-500">
                {queue.inQueue
                  ? `In queue${queue.queueElapsed ? ` · ${Math.round(queue.queueElapsed)}s` : ""}`
                  : `Party of ${queue.partySize ?? 1}`}
              </div>
            </div>
          )}

          {board.winProb !== null && board.state === "INGAME" && (
            <div className="w-48 rounded-sm border border-edge bg-panel/80 p-2.5" data-testid="win-probability">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Win chance</span>
                <span className="text-[14px] text-zinc-100 font-black num">{board.winProb}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-zinc-900 bg-zinc-800/80">
                <div
                  className="h-full rounded-full transition-[width] duration-200"
                  style={{
                    width: `${board.winProb}%`,
                    backgroundColor: board.winProb >= 55 ? "#10B981" : board.winProb <= 45 ? "#EF4444" : "#F59E0B",
                  }}
                />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
