import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  message,
  children,
  testId,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
  children?: ReactNode;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className="flex flex-col items-center justify-center py-16 px-6 text-center rise">
      <div className="relative mb-4 flex h-12 w-12 items-center justify-center border border-edge rounded-sm bg-inset">
        <Icon size={22} className="text-text-muted" />
        <span className="absolute -left-px -top-px h-2 w-2 border-l border-t border-accent" aria-hidden="true" />
      </div>
      <h3 className="font-display text-[16px] font-bold uppercase tracking-[0.06em] text-text-primary">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-text-secondary">{message}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
