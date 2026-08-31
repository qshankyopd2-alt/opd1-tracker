import { CheckCircle2, CircleHelp, MinusCircle, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

export type Outcome = "win" | "loss" | "draw" | "unresolved";

export function normalizeOutcome(result: string | null | undefined): Outcome {
  const value = result?.trim().toLowerCase();
  if (value === "win" || value === "victory" || value === "w") return "win";
  if (value === "loss" || value === "defeat" || value === "l") return "loss";
  if (value === "draw" || value === "tie" || value === "d") return "draw";
  return "unresolved";
}

const badge = cva("inline-flex shrink-0 items-center justify-center border font-bold uppercase tracking-[0.12em]", {
  variants: {
    outcome: {
      win: "border-win-ring bg-win-subtle text-win",
      loss: "border-loss-ring bg-loss-subtle text-loss",
      draw: "border-white/15 bg-white/[0.06] text-white/75",
      unresolved: "border-white/10 bg-white/[0.03] text-white/45",
    },
    size: {
      xs: "h-5 gap-1 rounded-md px-1.5 text-[9px]",
      sm: "h-7 gap-1.5 rounded-lg px-2.5 text-[10px]",
      lg: "min-w-[176px] gap-3 rounded-xl px-5 py-3 text-sm",
    },
  },
  defaultVariants: { size: "sm" },
});

const icons = { win: CheckCircle2, loss: XCircle, draw: MinusCircle, unresolved: CircleHelp };
const labels = { win: "Win", loss: "Loss", draw: "Draw", unresolved: "Pending" };
const compactLabels = { win: "W", loss: "L", draw: "D", unresolved: "—" };

export function OutcomeBadge({ outcome, size = "sm", score, className }: VariantProps<typeof badge> & { outcome: Outcome; score?: string; className?: string }) {
  const Icon = icons[outcome];
  return (
    <span className={clsx(badge({ outcome, size }), className)} data-testid={`outcome-${outcome}`}>
      <Icon size={size === "lg" ? 20 : size === "sm" ? 14 : 11} aria-hidden="true" />
      <span>{size === "xs" ? compactLabels[outcome] : labels[outcome]}</span>
      {size === "lg" && score && <span className="font-mono text-xl tabular-nums tracking-normal text-white">{score}</span>}
    </span>
  );
}
