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
    <div className="flex min-w-0 flex-col items-center gap-1.5 bg-panel px-2 py-2 text-center">
      <div className="flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-card">
        {splash && (
          <img
            src={splash}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        )}
      </div>
      <span className="max-w-full truncate font-display text-[14px] font-semibold text-zinc-100">
        {map}
      </span>
      <span className="shrink-0 text-[12px] font-medium text-zinc-400 num">
        {games} {games === 1 ? "match" : "matches"} · <span className="text-victory font-semibold">{winRate}%<span className="sr-only"> win rate</span></span>
      </span>
    </div>
  );
}
