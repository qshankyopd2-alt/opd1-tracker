export function RankBadge({
  icon,
  name,
  color,
  rr,
  size = "md",
  testId,
}: {
  icon: string | null | undefined;
  name: string;
  color: string;
  rr?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  testId?: string;
}) {
  const img = size === "xl" ? "w-11 h-11" : size === "lg" ? "w-9 h-9" : size === "md" ? "w-6 h-6" : "w-5 h-5";
  const text = size === "xl" ? "text-[16px]" : size === "lg" ? "text-sm" : "text-xs";
  return (
    <span data-testid={testId} className="inline-flex items-center gap-1.5 min-w-0">
      {icon ? (
        <img src={icon} alt="" className={`${img} shrink-0`} loading="lazy" draggable={false} />
      ) : (
        <span className={`${img} shrink-0 rounded-sm border border-edge`} />
      )}
      <span className={`${text} font-semibold truncate`} style={{ color }}>
        {name}
        {rr !== undefined && rr !== null && (
          <span className="text-zinc-500 font-normal num"> · {rr} RR</span>
        )}
      </span>
    </span>
  );
}
