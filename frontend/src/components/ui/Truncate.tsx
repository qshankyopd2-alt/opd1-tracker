import * as Tooltip from "@radix-ui/react-tooltip";
import { clsx } from "clsx";

export function Truncate({ text, maxWidth, className, tooltip = true }: { text: string; maxWidth: number | string; className?: string; tooltip?: boolean }) {
  const content = <span dir="auto" className={clsx("block min-w-0 truncate", className)} style={{ maxWidth }}>{text}</span>;
  if (!tooltip) return content;
  return (
    <Tooltip.Provider delayDuration={400}><Tooltip.Root delayDuration={400}>
      <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={7} collisionPadding={12} className="z-[100] max-w-xs rounded-lg border border-white/10 bg-surface-popover/95 px-2.5 py-1.5 text-xs text-white/90 shadow-panel backdrop-blur-panel">
          <span dir="auto">{text}</span>
          <Tooltip.Arrow className="fill-surface-popover" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root></Tooltip.Provider>
  );
}
