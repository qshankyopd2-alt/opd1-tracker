import { useMemo, useRef, useState } from "react";
import type { HistoryPoint } from "../../api/types";
import { rankFromTier } from "../../lib/ranks";
import { fmtDelta } from "../../lib/format";

interface ChartPoint {
  point: HistoryPoint;
  rating: number;
}

const W = 640;
const H = 170;
const PAD = { top: 12, bottom: 18, left: 8, right: 8 };

export function RRChart({ points }: { points: HistoryPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const data = useMemo<ChartPoint[]>(
    () =>
      points
        .filter((p) => typeof p.tier === "number" && typeof p.rr === "number")
        .slice(-60)
        .map((p) => ({ point: p, rating: (p.tier as number) * 100 + (p.rr as number) })),
    [points],
  );

  if (data.length < 2) {
    return (
      <div className="h-[170px] flex items-center justify-center text-[12px] text-zinc-500" data-testid="rr-chart-empty">
        Not enough rated matches for a chart yet.
      </div>
    );
  }

  const ratings = data.map((d) => d.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const span = Math.max(max - min, 40);
  const lo = min - span * 0.1;
  const hi = max + span * 0.1;

  const x = (i: number) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
  const y = (r: number) => PAD.top + (1 - (r - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.rating).toFixed(1)}`).join(" ");
  const area = `${path} L${x(data.length - 1).toFixed(1)},${H - PAD.bottom} L${PAD.left},${H - PAD.bottom} Z`;

  const onMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(rel * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const h = hover !== null ? data[hover] : null;
  const hRank = h ? rankFromTier(h.point.tier) : null;

  return (
    <div ref={containerRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)} data-testid="rr-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[170px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rrfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + f * (H - PAD.top - PAD.bottom)}
            y2={PAD.top + f * (H - PAD.top - PAD.bottom)}
            stroke="#27272A"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#rrfill)" />
        <path d={path} fill="none" stroke="#F97316" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {h && hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="#52525B" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h.rating)} r="4" fill="#F97316" stroke="#09090B" strokeWidth="2" />
          </>
        )}
        <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].rating)} r="3.5" fill="#F97316" />
      </svg>

      <div className="absolute top-1 left-2 text-[10px] text-zinc-500">{rankFromTier(Math.floor(hi / 100)).name}</div>
      <div className="absolute bottom-4 left-2 text-[10px] text-zinc-600">{rankFromTier(Math.floor(lo / 100)).name}</div>

      {h && hRank && (
        <div
          className="absolute -top-1 pointer-events-none bg-panel border border-edge rounded-sm px-2.5 py-1.5 text-[11px] shadow-lg z-10"
          style={{ left: `${((hover ?? 0) / (data.length - 1)) * 82 + 4}%` }}
          data-testid="rr-chart-tooltip"
        >
          <div className="font-semibold" style={{ color: hRank.color }}>
            {hRank.name} · <span className="num">{h.point.rr} RR</span>
          </div>
          <div className="text-zinc-400 num">
            {h.point.map ?? "—"}
            {h.point.result ? ` · ${h.point.result}` : ""}
            {typeof h.point.delta === "number" ? ` · ${fmtDelta(h.point.delta)}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
