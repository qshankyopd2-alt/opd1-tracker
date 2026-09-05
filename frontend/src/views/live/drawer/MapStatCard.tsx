export function MapStatCard({
  map,
  games,
  winRate,
  splash: _splash,
}: {
  map: string;
  games: number;
  winRate: number;
  splash: string | null;
}) {
  return (
    <div className="min-h-12 bg-card px-3 py-2.5">
      <span className="flex items-center justify-between gap-3">
        <span className="truncate text-[14px] font-semibold text-zinc-100">{map}</span>
        <span className="shrink-0 text-[12px] font-medium text-zinc-400 num">{games} matches · {winRate}% win rate</span>
      </span>
    </div>
  );
}
