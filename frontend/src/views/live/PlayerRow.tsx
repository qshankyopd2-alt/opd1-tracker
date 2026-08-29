import { AlertTriangle, Bookmark, EyeOff } from "lucide-react";
import type { LivePlayer, WeaponLoadout } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { FormDots } from "../../components/domain/FormDots";
import { fmtNum, fmtPct } from "../../lib/format";

const FEATURED_WEAPONS = [
  { weapon: "Vandal", label: "V" },
  { weapon: "Phantom", label: "P" },
  { weapon: "Operator", label: "O" },
  { weapon: "Melee", label: "K" },
] as const;

function kdColor(kd: number | null): string {
  if (kd === null) return "#A1A1AA";
  if (kd >= 1.2) return "#10B981";
  if (kd < 0.9) return "#EF4444";
  return "#E4E4E7";
}

function Metric({ label, children, color }: { label: string; children: React.ReactNode; color?: string }) {
  return (
    <span className="min-w-0 px-1.5 py-0.5">
      <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <span className="block text-[13px] font-bold leading-tight num" style={{ color }}>
        {children}
      </span>
    </span>
  );
}

function FeaturedLoadout({ weapons }: { weapons: WeaponLoadout[] }) {
  const byWeapon = new Map(weapons.map((item) => [item.weapon, item]));

  return (
    <span className="grid min-w-0 flex-1 grid-cols-4 gap-1.5">
      {FEATURED_WEAPONS.map(({ weapon, label }) => {
        const item = byWeapon.get(weapon);
        const skinName = item?.skin?.name;

        return (
          <span
            key={weapon}
            title={skinName ? `${weapon === "Melee" ? "Knife" : weapon}: ${skinName}` : `${weapon}: unavailable`}
            className="flex h-10 min-w-0 items-center justify-center overflow-hidden rounded-sm border border-edge bg-panel/90"
          >
            {item?.skin?.icon ? (
              <img src={item.skin.icon} alt={skinName ?? weapon} className="h-7 w-[86%] object-contain" loading="lazy" />
            ) : (
              <span className="text-[10px] font-bold text-zinc-500">{label}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function PlayerRow({
  player,
  pregame,
  onSelect,
}: {
  player: LivePlayer;
  pregame: boolean;
  onSelect: (p: LivePlayer) => void;
}) {
  const enc = player.encounter;
  const encTotal = enc ? enc.withCount + enc.againstCount : 0;
  const locked = pregame && player.selection === "locked";
  const recentCount = player.recentMatches || 0;
  const recentLabel = recentCount > 0 ? `Last ${recentCount}` : "Recent";

  return (
    <button
      type="button"
      data-testid={`player-row-${player.puuid}`}
      onClick={() => onSelect(player)}
      className={`group relative flex w-full flex-col overflow-hidden rounded-md border border-edge bg-card/95 px-2.5 py-1.5 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800/90 ${
        player.isSelf ? "border-brand/50 bg-brand/5" : ""
      }`}
    >
      {player.playerCard && (
        <img
          src={player.playerCard}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.25] saturate-50 transition-opacity duration-200 group-hover:opacity-[0.35]"
          draggable={false}
        />
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card/95 via-card/85 to-card/40" />

      {/* Top Row: Identity & Rank */}
      <span className="relative flex min-w-0 items-start justify-between gap-3 mb-1.5">
        <span className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-0.5 h-10 w-[3px] shrink-0 rounded-full"
            title={player.party ? `Party ${player.party.number}` : undefined}
            style={{ backgroundColor: player.party?.color ?? "transparent" }}
          />

          <span className="relative shrink-0 mt-0.5">
            <AgentAvatar portrait={player.agentPortrait} name={player.agent ?? player.name} color={player.agentColor} size={40} />
            {locked && <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-ink bg-victory" />}
          </span>

          <span className="min-w-0 flex-1 flex flex-col justify-center">
            <span className="flex min-w-0 items-center gap-1.5">
              <span dir="auto" className={`truncate font-display text-[17px] font-black tracking-wide leading-none ${player.isSelf ? "text-brand" : "text-zinc-100"}`}>
                {player.name}
              </span>
              {player.party && (
                <span
                  title={`Party ${player.party.number}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest"
                  style={{ borderColor: player.party.color, color: player.party.color, backgroundColor: `${player.party.color}15` }}
                >
                  <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: player.party.color }} />
                  P{player.party.number}
                </span>
              )}
              {player.saved && <Bookmark size={14} className="shrink-0 text-amber-300" fill="currentColor" aria-label="Saved player" />}
              {player.nameHidden && <EyeOff size={13} className="shrink-0 text-zinc-500" aria-label="streamer mode name" />}
              {player.smurf && (
                <span
                  data-testid={`smurf-flag-${player.puuid}`}
                  title={player.smurfReasons.join(" · ")}
                  className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-defeat bg-defeat px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white"
                >
                  <AlertTriangle size={10} strokeWidth={3} /> SMURF
                </span>
              )}
            </span>
            <span className="mt-1 block truncate text-[11px] font-medium leading-none text-zinc-400">
              {player.agent ?? "Unpicked"}{player.role ? ` · ${player.role}` : ""}
              {player.levelHidden ? " · Lvl hidden" : ` · Lvl ${player.level || "?"}`}
              {encTotal > 0 ? ` · seen ${encTotal}x` : ""}
            </span>
            {player.savedNote && <span className="mt-1 block truncate text-[11px] font-medium leading-none text-amber-300" title={player.savedNote}>{player.savedNote}</span>}
          </span>
        </span>

        <span className="min-w-[130px] shrink-0 text-right flex flex-col items-end justify-center">
          <span className="flex items-center justify-end gap-2.5">
            <span className="flex flex-col items-end justify-center">
              <span className="block text-[15px] font-black leading-none tracking-wide" style={{ color: player.rankColor }}>{player.rank}</span>
              {player.rankTier > 2 && <span className="block mt-1 text-[11px] font-bold leading-none text-zinc-400 num">{player.rr} RR</span>}
            </span>
            {player.rankIcon && <img src={player.rankIcon} alt="" className="h-10 w-10 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          </span>
          <span className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-bold leading-none text-zinc-500">
            <span className="text-[9px] uppercase tracking-widest">Peak</span>
            {player.peakIcon && <img src={player.peakIcon} alt="" className="h-4 w-4 shrink-0 opacity-80" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            <span className="truncate" style={{ color: player.peakColor }}>{player.peakRank}</span>
          </span>
        </span>
      </span>

      {/* Middle Row: Metrics Grid */}
      <span className="relative mb-1.5 grid grid-cols-4 gap-px overflow-hidden rounded-sm border border-edge/60 bg-edge/40">
        <span className="bg-ink/80 px-2 py-1.5 flex flex-col justify-center">
          <Metric label="Act games">{player.games || "—"}</Metric>
        </span>
        <span className="bg-ink/80 px-2 py-1.5 flex flex-col justify-center">
          <Metric label="Act WR">{fmtPct(player.winRate)}</Metric>
        </span>
        <span className="bg-ink/80 px-2 py-1.5 flex flex-col justify-center">
          <Metric label={`${recentLabel} K/D`} color={kdColor(player.kd)}>
            {player.kd === null ? <span className="animate-pulse text-zinc-600">...</span> : fmtNum(player.kd, 2)}
          </Metric>
        </span>
        <span className="bg-ink/80 px-2 py-1.5 flex flex-col justify-center">
          <Metric label={`${recentLabel} HS`}>{fmtPct(player.hsPct)}</Metric>
        </span>
      </span>

      {/* Bottom Row: Weapons & Form */}
      <span className="relative flex min-w-0 items-center justify-between gap-3">
        <FeaturedLoadout weapons={player.weapons} />
        <span className="flex shrink-0 items-center justify-end gap-3">
          {player.streak && player.streak.count >= 3 && (
            <span className={`rounded-sm border px-1.5 py-0.5 text-[11px] font-black num ${player.streak.type === "W" ? "border-victory/30 bg-victory/20 text-victory" : "border-defeat/30 bg-defeat/20 text-defeat"}`}>
              {player.streak.count}{player.streak.type}
            </span>
          )}
          {player.rrEarned !== null && player.rrEarned !== undefined && (
            <span className={`text-[11px] font-black uppercase tracking-wider num ${player.rrEarned >= 0 ? "text-victory" : "text-defeat"}`}>
              {player.rrEarned >= 0 ? `+${player.rrEarned}` : player.rrEarned} RR
            </span>
          )}
          <span className="scale-95 origin-right">
            <FormDots form={player.form} />
          </span>
        </span>
      </span>
    </button>
  );
}
