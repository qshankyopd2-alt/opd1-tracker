import type { LiveBoard } from "../../api/types";
import { Badge } from "../../components/ui/Badge";
import { PageHeader } from "../../components/shell/PageHeader";

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

      <div className="relative p-5">
        <PageHeader
          title={board.state === "MENUS" ? "Party Lobby" : board.map ?? "Unknown"}
          testId="match-page-header"
        >
          <div className="flex items-center gap-8">
          {score && (
            <div className="text-center" data-testid="match-score">
              <div className="font-display font-black text-[34px] leading-none num">
                <span className="text-victory">{score.ally}</span>
                <span className="text-zinc-600 mx-2">–</span>
                <span className="text-defeat">{score.enemy}</span>
              </div>
              {score.round && <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-1">Round {score.round}</div>}
            </div>
          )}

          {lock && (
            <div className="text-center" data-testid="lock-progress">
              <div className="font-display font-black text-[30px] leading-none num text-amber-300">
                {lock.locked}<span className="text-zinc-500 text-xl">/{lock.total}</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-1">Locked in</div>
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
            <div className="w-44" data-testid="win-probability">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                <span>Win chance</span>
                <span className="text-zinc-200 font-bold num">{board.winProb}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${board.winProb}%`,
                    backgroundColor: board.winProb >= 55 ? "#10B981" : board.winProb <= 45 ? "#EF4444" : "#F59E0B",
                  }}
                />
              </div>
            </div>
          )}
          </div>
        </PageHeader>
        <div className="flex items-center gap-2 -mt-4">
          <Badge color={STATE_COLOR[board.state] ?? "#71717A"} filled testId="match-state-badge">
            {board.stateLabel}
          </Badge>
          {board.state !== "MENUS" && (
            <span className="text-[11px] uppercase tracking-wider text-zinc-400">{board.mode}</span>
          )}
          {board.side && (
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">· {board.side} side</span>
          )}
          {board.sourceDetail && <span className="text-[11px] text-zinc-500 ml-2">{board.sourceDetail}</span>}
        </div>
      </div>
    </div>
  );
}
