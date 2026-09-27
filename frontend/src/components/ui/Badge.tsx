import type { CSSProperties, ReactNode } from "react";

export function Badge({
  children,
  color = "#A1A1AA",
  filled = false,
  testId,
  className = "",
}: {
  children: ReactNode;
  color?: string;
  filled?: boolean;
  testId?: string;
  className?: string;
}) {
  const style: CSSProperties = filled
    ? { backgroundColor: color, color: "#0c0e12", borderColor: color }
    : { color, borderColor: `${color}59` };
  return (
    <span
      data-testid={testId}
      style={style}
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-px text-[11.5px] font-semibold whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}
