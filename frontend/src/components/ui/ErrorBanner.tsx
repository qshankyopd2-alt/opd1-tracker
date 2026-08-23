import { AlertTriangle, RotateCw } from "lucide-react";

export function ErrorBanner({ message, onRetry, testId }: { message: string; onRetry?: () => void; testId?: string }) {
  return (
    <div
      data-testid={testId ?? "error-banner"}
      className="flex items-center gap-3 border border-red-900/60 bg-red-950/30 text-red-300 rounded-md px-3 py-2 text-[13px]"
    >
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          data-testid="error-retry-button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 border border-red-800 rounded-sm px-2 py-1 text-[11px] uppercase tracking-wider font-semibold hover:bg-red-900/40 transition-colors"
        >
          <RotateCw size={11} /> Retry
        </button>
      )}
    </div>
  );
}
