import type { ReactNode } from "react";

export function MetaLabel({
  children,
  className = "",
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`text-[10px] uppercase tracking-meta text-zinc-500 font-semibold ${className}`}
    >
      {children}
    </div>
  );
}
