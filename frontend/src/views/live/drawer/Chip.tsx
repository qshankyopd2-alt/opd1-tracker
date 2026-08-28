export function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border border-edge rounded-sm px-2.5 py-1.5 bg-panel">
      <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="text-[13px] font-semibold num" style={{ color: color ?? "#E4E4E7" }}>
        {value}
      </div>
    </div>
  );
}
