import { RankBadge } from "../../../components/domain/RankBadge";

export function RankCard({
  label,
  name,
  icon,
  color,
  rr,
  detail,
}: {
  label: string;
  name: string;
  icon?: string | null;
  color: string;
  rr?: number | null;
  detail?: string;
}) {
  return (
    <div className="min-w-0 rounded-sm border border-edge bg-card px-3 py-2.5">
      <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <RankBadge icon={icon} name={name} color={color} rr={rr} size="lg" />
      {detail && <div className="mt-1 truncate pl-[42px] text-[9px] text-zinc-500">{detail}</div>}
    </div>
  );
}
