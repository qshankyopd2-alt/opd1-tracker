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
  win: "border-victory/45 bg-victory-subtle text-victory",
  loss: "border-defeat/45 bg-defeat-subtle text-defeat",
  draw: "border-draw/40 bg-draw-subtle text-draw",
  unresolved: "border-dashed border-edge bg-inset text-text-muted",
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "h-[18px] gap-1 rounded-sm px-1.5 text-[10.5px]",
  sm: "h-7 gap-1.5 rounded-sm px-2.5 text-[11.5px]",
  lg: "min-w-[172px] gap-3 rounded-sm px-5 py-3 text-[14px]",
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
        "inline-flex shrink-0 items-center justify-center border font-display font-semibold uppercase tracking-[0.06em]",
        outcomeClasses[outcome],
        sizeClasses[size],
        className
      )}
      data-testid={`outcome-${outcome}`}
    >
      <Icon size={size === "lg" ? 18 : size === "sm" ? 13 : 10} aria-hidden="true" />
      <span>{size === "xs" ? compactLabels[outcome] : labels[outcome]}</span>
      {size === "lg" && score && <span className="font-mono text-xl tabular-nums tracking-normal text-text-primary">{score}</span>}
    </span>
  );
}
