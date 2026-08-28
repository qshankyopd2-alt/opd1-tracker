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
    <div className="relative min-h-[52px] overflow-hidden rounded-sm border border-edge bg-card px-2.5 py-2">
      {splash && <img src={splash} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" loading="lazy" draggable={false} />}
      <span className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/55" />
      <span className="relative flex items-center justify-between gap-3">
        <span className="truncate text-[12px] font-semibold text-zinc-100">{map}</span>
        <span className="shrink-0 text-[11px] num text-zinc-400">
          <span className={winRate >= 50 ? "text-victory" : "text-defeat"}>{winRate}%</span> · {games}g
        </span>
      </span>
    </div>
  );
}
