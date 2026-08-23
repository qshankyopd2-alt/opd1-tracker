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
    <span className="min-w-0 px-1.5 py-0.5 first:pl-0">
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
      className={`group relative h-full min-h-0 w-full overflow-hidden rounded-sm border border-edge bg-card/95 px-2.5 py-1 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/85 ${
        player.isSelf ? "border-brand/45" : ""
      }`}
    >
      {player.playerCard && (
        <img
          src={player.playerCard}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.32] saturate-75 transition-opacity duration-200 group-hover:opacity-[0.42]"
          draggable={false}
        />
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card/90 via-card/75 to-card/35" />

      <span className="relative flex min-w-0 items-start gap-2">
        <span
          className="mt-0.5 h-10 w-[3px] shrink-0 rounded-full"
          title={player.party ? `Party ${player.party.number}` : undefined}
          style={{ backgroundColor: player.party?.color ?? "transparent" }}
        />

        <span className="relative shrink-0">
          <AgentAvatar portrait={player.agentPortrait} name={player.agent ?? player.name} color={player.agentColor} size={38} />
          {locked && <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-ink bg-victory" />}
        </span>

        <span className="min-w-0 flex-1 pt-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span dir="auto" className={`truncate font-display text-[16px] font-bold leading-tight ${player.isSelf ? "text-brand" : "text-zinc-100"}`}>
              {player.name}
            </span>
            {player.party && (
              <span
                title={`Party ${player.party.number}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-sm border px-1 py-px text-[8px] font-black uppercase tracking-wider"
                style={{ borderColor: player.party.color, color: player.party.color }}
              >
                <span className="h-1.5 w-1.5 rounded-[1px]" style={{ backgroundColor: player.party.color }} />
                P{player.party.number}
              </span>
            )}
            {player.saved && <Bookmark size={12} className="shrink-0 text-amber-300" fill="currentColor" aria-label="Saved player" />}
            {player.nameHidden && <EyeOff size={11} className="shrink-0 text-zinc-500" aria-label="streamer mode name" />}
            {player.smurf && (
              <span
                data-testid={`smurf-flag-${player.puuid}`}
                title={player.smurfReasons.join(" · ")}
                className="inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-amber-400 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-ink"
              >
                <AlertTriangle size={9} /> Smurf
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[10px] leading-tight text-zinc-400">
            {player.agent ?? "Unpicked"}{player.role ? ` · ${player.role}` : ""}
            {player.levelHidden ? " · Lvl hidden" : ` · Lvl ${player.level || "?"}`}
            {encTotal > 0 ? ` · seen ${encTotal}x` : ""}
          </span>
          {player.savedNote && <span className="mt-0.5 block truncate text-[10px] leading-tight text-amber-200" title={player.savedNote}>{player.savedNote}</span>}
        </span>

        <span className="min-w-[126px] shrink-0 text-right">
          <span className="flex items-center justify-end gap-2">
            {player.rankIcon && <img src={player.rankIcon} alt="" className="h-9 w-9 shrink-0" loading="lazy" />}
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-bold leading-tight" style={{ color: player.rankColor }}>{player.rank}</span>
              {player.rankTier > 2 && <span className="block text-[10px] font-semibold leading-tight text-zinc-300 num">{player.rr} RR</span>}
            </span>
          </span>
          <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold leading-tight text-zinc-500">
            <span className="text-[8px] uppercase tracking-wider">Peak</span>
            {player.peakIcon && <img src={player.peakIcon} alt="" className="h-4 w-4 shrink-0" loading="lazy" />}
            <span className="truncate" style={{ color: player.peakColor }}>{player.peakRank}</span>
          </span>
        </span>
      </span>

      <span className="relative mt-1 grid grid-cols-4 divide-x divide-edge/70 border-y border-edge/70 bg-ink/35">
        <Metric label="Act games">{player.games || "—"}</Metric>
        <Metric label="Act WR">{fmtPct(player.winRate)}</Metric>
        <Metric label={`${recentLabel} K/D`} color={kdColor(player.kd)}>
          {player.kd === null ? <span className="animate-pulse text-zinc-600">...</span> : fmtNum(player.kd, 2)}
        </Metric>
        <Metric label={`${recentLabel} HS`}>{fmtPct(player.hsPct)}</Metric>
      </span>

      <span className="relative mt-0.5 flex min-w-0 items-end gap-2">
        <FeaturedLoadout weapons={player.weapons} />
        <span className="flex shrink-0 items-center justify-end gap-2 pb-1">
          {player.streak && player.streak.count >= 3 && (
            <span className={`text-[10px] font-bold num ${player.streak.type === "W" ? "text-victory" : "text-defeat"}`}>
              {player.streak.count}{player.streak.type}
            </span>
          )}
          {player.rrEarned !== null && player.rrEarned !== undefined && (
            <span className={`text-[10px] font-semibold uppercase tracking-wider num ${player.rrEarned >= 0 ? "text-victory" : "text-defeat"}`}>
              {player.rrEarned >= 0 ? `+${player.rrEarned}` : player.rrEarned} RR
            </span>
          )}
          <FormDots form={player.form} />
        </span>
      </span>
    </button>
  );
}
