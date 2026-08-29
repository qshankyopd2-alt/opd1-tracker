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
    <div data-testid={testId} className="flex items-center justify-between pb-4 border-b border-edge mb-6">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={24} className="text-zinc-500" />}
        <h1 className="font-display font-black italic uppercase text-[30px] leading-tight tracking-tight text-zinc-100">
          {title}
        </h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
