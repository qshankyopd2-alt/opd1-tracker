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
    <div className="relative min-h-11 overflow-hidden border-b border-r border-edge/60 bg-card/55 px-2.5 py-2 even:border-r-0">
      {splash && <img src={splash} alt="" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-[0.16]" loading="lazy" draggable={false} />}
      <span className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-transparent" />
      <span className="relative flex items-center justify-between gap-3">
        <span className="truncate text-[12px] font-semibold text-zinc-100">{map}</span>
        <span className="shrink-0 text-[11px] num text-zinc-400">
          <span className={winRate >= 50 ? "text-victory" : "text-defeat"}>{winRate}%</span> · {games}g
        </span>
      </span>
    </div>
  );
}
