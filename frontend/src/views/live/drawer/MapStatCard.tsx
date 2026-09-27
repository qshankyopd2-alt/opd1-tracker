export function MapStatCard({
  map,
  games,
  winRate,
  splash,
}: {
  map: string;
  games: number;
  winRate: number;
  splash: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 border border-edge bg-inset px-2 py-2 text-center">
      <div className="flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-card">
        {splash && (
          <img
            src={splash}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        )}
      </div>
      <span className="max-w-full truncate font-display text-[13px] font-bold text-text-primary">{map}</span>
      <span className="num shrink-0 text-[11.5px] font-medium text-text-muted">
        {games} {games === 1 ? "match" : "matches"} · <span className="font-semibold text-victory">{winRate}%<span className="sr-only"> win rate</span></span>
      </span>
    </div>
  );
}
