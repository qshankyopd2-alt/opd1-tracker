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
      <div className="w-12 h-12 border border-edge rounded-md flex items-center justify-center mb-4">
        <Icon size={22} className="text-zinc-500" />
      </div>
      <h3 className="font-display text-lg text-zinc-200 font-semibold">{title}</h3>
      {message && <p className="text-text-secondary mt-1.5 max-w-md text-[13px] leading-relaxed">{message}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
