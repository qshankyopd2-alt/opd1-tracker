export function Chip({ label, value, variant = "default" }: { label: string; value: string; variant?: "default" | "ally" | "enemy" }) {
  const textClass = variant === "ally"
    ? "text-victory"
    : variant === "enemy"
      ? "text-defeat"
      : "text-zinc-100";

  return (
    <div className="min-w-0 px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className={`truncate text-[13px] font-semibold num ${textClass}`}>
        {value}
      </div>
    </div>
  );
}
