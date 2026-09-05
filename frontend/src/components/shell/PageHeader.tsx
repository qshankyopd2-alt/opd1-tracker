import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  icon: Icon,
  children,
  testId,
}: {
  title: string;
  icon?: LucideIcon;
  children?: ReactNode;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <Icon size={22} className="shrink-0 text-[var(--text-secondary)]" />}
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.025em] text-[var(--text-primary)]">
          {title}
        </h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
