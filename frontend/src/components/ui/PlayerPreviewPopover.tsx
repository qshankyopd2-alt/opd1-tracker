import { cloneElement, useEffect, useRef, useState, type ReactElement } from "react";
import * as Popover from "@radix-ui/react-popover";
import type { LivePlayer } from "../../api/types";
import { AgentAvatar } from "../domain/AgentAvatar";
import { fmtNum, fmtPct } from "../../lib/format";

export function PlayerPreviewPopover({ player, children }: { player: LivePlayer; children: ReactElement }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number>();
  const clear = () => window.clearTimeout(timer.current);
  const scheduleOpen = () => { clear(); timer.current = window.setTimeout(() => setOpen(true), 400); };
  const scheduleClose = () => { clear(); timer.current = window.setTimeout(() => setOpen(false), 120); };
  useEffect(() => clear, []);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{cloneElement(children, { onPointerEnter: scheduleOpen, onPointerLeave: scheduleClose } as object)}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" align="start" sideOffset={8} collisionPadding={14} onPointerEnter={clear} onPointerLeave={scheduleClose} className="z-[90] w-72 rounded-xl border border-white/10 bg-surface-popover/95 p-3 text-white/90 shadow-panel backdrop-blur-panel" data-testid={`player-preview-${player.puuid}`}>
          <div className="flex min-w-0 items-center gap-3">
            <AgentAvatar portrait={player.agentPortrait} name={player.agent ?? player.name} color={player.agentColor} size={42} />
            <div className="min-w-0"><div dir="auto" className="break-words text-sm font-bold">{player.name}</div><div className="mt-0.5 text-xs text-white/60">{player.rank} · {player.agent ?? "Unpicked"}</div></div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-white/10 pt-2 text-center tabular-nums">
            {[['WR', fmtPct(player.winRate)], ['K/D', player.kd == null ? '—' : fmtNum(player.kd, 2)], ['HS', fmtPct(player.hsPct)], ['Matches', String(player.recentMatches ?? '—')]].map(([label, value]) => <div key={label}><div className="text-xs font-semibold">{value}</div><div className="text-[9px] uppercase tracking-wider text-white/40">{label}</div></div>)}
          </div>
          <Popover.Arrow className="fill-surface-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
