export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-zinc-800/70 rounded-sm ${className}`} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1.5 p-3" data-testid="loading-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
