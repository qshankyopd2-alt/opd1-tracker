import { Flame, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

export function StreakBadge({ type, count, className }: { type: "W" | "L"; count: number; className?: string }) {
  const Icon = type === "W" ? Flame : TrendingDown;
  return (
    <span className={clsx("inline-flex h-5 shrink-0 items-center gap-1 rounded-sm border border-edge bg-panel px-1.5 text-[11px] font-semibold text-text-secondary tabular-nums", className)} data-testid={`streak-${type.toLowerCase()}`}>
      <Icon size={10} fill={type === "W" ? "currentColor" : "none"} aria-hidden="true" />
      {count}{type}
    </span>
  );
}
