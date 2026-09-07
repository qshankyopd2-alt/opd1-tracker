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
    <div data-testid={testId} className="page-header mb-5 flex flex-wrap items-end justify-between gap-3 pb-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <Icon size={22} className="shrink-0 text-[var(--text-secondary)]" />}
        <div><div className="mb-1 text-[12px] tracking-[0.16em] text-brand">OPD1 / {title === "ASCII studio" ? "CREATE" : title === "Settings" ? "APPLICATION" : "YOUR GAME"}</div>
          <h1 className="font-display text-[32px] font-semibold leading-tight tracking-[-0.025em] text-[var(--text-primary)]">{title}</h1>
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
