import { AlertTriangle, RotateCw } from "lucide-react";

export function ErrorBanner({ message, onRetry, testId }: { message: string; onRetry?: () => void; testId?: string }) {
  return (
    <div
      data-testid={testId ?? "error-banner"}
      className="flex items-center gap-3 border border-defeat/40 bg-defeat-subtle text-defeat rounded-md px-3 py-2 text-[13px]"
    >
      <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          aria-label="Retry operation"
          data-testid="error-retry-button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 border border-defeat/50 rounded-sm px-2 py-1 text-[11px] uppercase tracking-wider font-semibold hover:bg-defeat/20 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          <RotateCw size={11} aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  );
}
