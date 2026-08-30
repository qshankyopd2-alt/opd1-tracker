import { RankBadge } from "../../../components/domain/RankBadge";

export function RankCard({
  label,
  name,
  icon,
  color,
  rr,
  detail,
  hero,
}: {
  label: string;
  name: string;
  icon?: string | null;
  color: string;
  rr?: number | null;
  detail?: string;
  hero?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-sm border border-edge px-3 py-2.5 ${hero ? "bg-zinc-900" : "bg-card"}`}>
      <div className={`mb-1.5 font-semibold uppercase tracking-[0.2em] text-zinc-500 ${hero ? "text-[11px]" : "text-[9px]"}`}>{label}</div>
      <RankBadge icon={icon} name={name} color={color} rr={rr} size={hero ? "xl" : "lg"} />
      {detail && <div className={`mt-1 truncate ${hero ? "pl-[52px]" : "pl-[42px]"} text-[9px] text-zinc-500`}>{detail}</div>}
    </div>
  );
}
