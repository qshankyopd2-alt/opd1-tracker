import { CheckCircle2, CircleHelp, MinusCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";

export type Outcome = "win" | "loss" | "draw" | "unresolved";
export type BadgeSize = "xs" | "sm" | "lg";

export function normalizeOutcome(result: string | null | undefined): Outcome {
  const value = result?.trim().toLowerCase();
  if (value === "win" || value === "victory" || value === "w") return "win";
  if (value === "loss" || value === "defeat" || value === "l") return "loss";
  if (value === "draw" || value === "tie" || value === "d") return "draw";
  return "unresolved";
}

const outcomeClasses: Record<Outcome, string> = {
  win: "border-win-ring bg-win-subtle text-win",
  loss: "border-loss-ring bg-loss-subtle text-loss",
  draw: "border-white/15 bg-white/[0.06] text-white/75",
  unresolved: "border-white/10 bg-white/[0.03] text-white/45",
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "h-5 gap-1 rounded-md px-1.5 text-[11px]",
  sm: "h-8 gap-1.5 rounded-md px-3 text-[12px]",
  lg: "min-w-[176px] gap-3 rounded-md px-5 py-3 text-[15px]",
};

const icons = { win: CheckCircle2, loss: XCircle, draw: MinusCircle, unresolved: CircleHelp };
const labels = { win: "Win", loss: "Loss", draw: "Draw", unresolved: "Pending" };
const compactLabels = { win: "W", loss: "L", draw: "D", unresolved: "—" };

export function OutcomeBadge({
  outcome,
  size = "sm",
  score,
  className,
}: {
  outcome: Outcome;
  size?: BadgeSize;
  score?: string;
  className?: string;
}) {
  const Icon = icons[outcome];
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center border font-semibold",
        outcomeClasses[outcome],
        sizeClasses[size],
        className
      )}
      data-testid={`outcome-${outcome}`}
    >
      <Icon size={size === "lg" ? 20 : size === "sm" ? 14 : 11} aria-hidden="true" />
      <span>{size === "xs" ? compactLabels[outcome] : labels[outcome]}</span>
      {size === "lg" && score && <span className="font-mono text-xl tabular-nums tracking-normal text-white">{score}</span>}
    </span>
  );
}
