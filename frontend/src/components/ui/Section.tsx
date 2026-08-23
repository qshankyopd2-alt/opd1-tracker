import type { ReactNode } from "react";

export function Section({
  title,
  actions,
  children,
  testId,
  className = "",
  pad = true,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  testId?: string;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section data-testid={testId} className={`bg-card border border-edge rounded-md ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-edge">
          {title && (
            <h2 className="font-display font-bold uppercase tracking-wide text-[15px] text-zinc-200">{title}</h2>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={pad ? "p-3.5" : ""}>{children}</div>
    </section>
  );
}
