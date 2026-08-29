export function Chip({ label, value, variant = "default" }: { label: string; value: string; variant?: "default" | "ally" | "enemy" }) {
  const containerClass = variant === "ally"
    ? "border-victory/30 bg-victory/5"
    : variant === "enemy"
      ? "border-defeat/30 bg-defeat/5"
      : "border-edge bg-panel";

  const textClass = variant === "ally"
    ? "text-victory"
    : variant === "enemy"
      ? "text-defeat"
      : "text-zinc-100";

  return (
    <div className={`border rounded-sm px-2.5 py-1.5 ${containerClass}`}>
      <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className={`text-[13px] font-semibold num ${textClass}`}>
        {value}
      </div>
    </div>
  );
}
