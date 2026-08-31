import { Flame, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

export function StreakBadge({ type, count, className }: { type: "W" | "L"; count: number; className?: string }) {
  const win = type === "W";
  const Icon = win ? Flame : TrendingDown;
  return (
    <span className={clsx("inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[9px] font-bold uppercase tracking-wider tabular-nums", win ? "border-win-ring bg-win-subtle text-win" : "border-loss-ring bg-loss-subtle text-loss", className)} data-testid={`streak-${type.toLowerCase()}`}>
      <Icon size={10} fill={win ? "currentColor" : "none"} aria-hidden="true" />
      {count}{type}
    </span>
  );
}
