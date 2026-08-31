import * as Popover from "@radix-ui/react-popover";
import { Bookmark, Copy, MoreHorizontal, UserRound } from "lucide-react";

export function RowActionMenu({ name, saved, onViewProfile, onBookmark }: { name: string; saved: boolean; onViewProfile: () => void; onBookmark: () => void }) {
  const copyName = async () => { await navigator.clipboard.writeText(name); };
  const actions = [
    { label: "View Profile", icon: UserRound, run: onViewProfile },
    { label: saved ? "Saved" : "Bookmark", icon: Bookmark, run: onBookmark },
    { label: "Copy Name", icon: Copy, run: () => void copyName() },
  ];
  return (
    <Popover.Root>
      <Popover.Trigger asChild><button type="button" aria-label={`Actions for ${name}`} data-testid="row-action-trigger" className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-surface-panel/90 text-white/60 opacity-0 transition-colors hover:text-white group-hover/card:opacity-100 group-focus-within/card:opacity-100"><MoreHorizontal size={15} /></button></Popover.Trigger>
      <Popover.Portal><Popover.Content align="end" sideOffset={6} collisionPadding={12} className="z-[95] w-40 rounded-lg border border-white/10 bg-surface-popover/95 p-1 shadow-panel backdrop-blur-panel" data-testid="row-action-menu">
        {actions.map(({ label, icon: Icon, run }) => <Popover.Close asChild key={label}><button type="button" onClick={run} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"><Icon size={13} />{label}</button></Popover.Close>)}
      </Popover.Content></Popover.Portal>
    </Popover.Root>
  );
}
