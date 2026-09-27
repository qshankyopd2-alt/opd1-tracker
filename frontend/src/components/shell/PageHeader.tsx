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
    <div data-testid={testId} className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-edge pb-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="section-tick h-5" aria-hidden="true" />
        <h1 className="font-display text-[22px] font-bold uppercase leading-tight tracking-[0.04em] text-text-primary">
          {title}
        </h1>
        {Icon && <Icon size={18} className="shrink-0 text-text-muted" />}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
