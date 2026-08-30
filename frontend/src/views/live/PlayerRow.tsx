import { useEffect, useState } from "react";
import { AlertTriangle, Bookmark, EyeOff } from "lucide-react";
import type { LivePlayer, WeaponLoadout } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { RecentFormTiles } from "../../components/domain/RecentFormTiles";
import type { RecentFormDetail } from "../../components/domain/RecentFormTiles";
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
      <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </span>
      <span className="block text-[13px] font-bold leading-tight num" style={{ color }}>
        {children}
      </span>
    </span>
  );
}

function WeaponArtwork({ icon, name, fallback }: { icon: string | null | undefined; name: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [icon]);
  if (!icon || failed) return <span className="text-[10px] font-bold text-zinc-500">{fallback}</span>;
  return <img src={icon} alt={name} className="h-6 w-[82%] object-contain opacity-75 transition-opacity duration-200 group-hover/card:opacity-90" loading="lazy" onError={() => setFailed(true)} />;
}

function FeaturedLoadout({ weapons }: { weapons: WeaponLoadout[] }) {
  const byWeapon = new Map(weapons.map((item) => [item.weapon, item]));

  return (
    <span className="live-player-loadout grid min-w-0 flex-1 grid-cols-4 gap-1">
      {FEATURED_WEAPONS.map(({ weapon, label }) => {
        const item = byWeapon.get(weapon);
        const skinName = item?.skin?.name;

        return (
          <span
            key={weapon}
            title={skinName ? `${weapon === "Melee" ? "Knife" : weapon}: ${skinName}` : `${weapon}: unavailable`}
            className="live-weapon-slot flex h-6 min-w-0 items-center justify-center overflow-hidden rounded-sm border border-edge/60 bg-ink/70"
          >
            <WeaponArtwork icon={item?.skin?.icon} name={skinName ?? weapon} fallback={label} />
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
  recentDetails,
  onRequestRecentDetails,
}: {
  player: LivePlayer;
  pregame: boolean;
  onSelect: (p: LivePlayer) => void;
  recentDetails?: RecentFormDetail[];
  onRequestRecentDetails?: (puuid: string) => void;
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
      onFocus={() => onRequestRecentDetails?.(player.puuid)}
      className={`live-player-row group/card relative flex h-full min-h-0 w-full flex-col rounded-md border border-edge bg-card/95 px-2 py-0.5 text-left transition-colors hover:z-20 hover:border-zinc-500 hover:bg-zinc-800/90 focus-visible:z-20 ${
        player.isSelf ? "border-brand/50 bg-brand/5" : ""
      }`}
    >
      <span className="live-player-background pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        {player.playerCard && (
          <img
            src={player.playerCard}
            alt=""
            className="live-player-art absolute inset-0 h-full w-full object-cover object-center opacity-[0.12] saturate-50 transition-opacity duration-200 group-hover/card:opacity-[0.18]"
            draggable={false}
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/90 to-card/85" />
      </span>

      {/* Top Row: Identity & Rank */}
      <span className="live-player-top relative mb-1 grid min-w-0 grid-cols-[minmax(0,1fr)_126px] items-start gap-2">
        <span className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-0.5 h-10 w-[3px] shrink-0 rounded-full"
            title={player.party ? `Party ${player.party.number}` : undefined}
            style={{ backgroundColor: player.party?.color ?? "transparent" }}
          />

          <span className="live-agent-avatar relative mt-0.5 shrink-0">
            <AgentAvatar portrait={player.agentPortrait} name={player.agent ?? player.name} color={player.agentColor} size={40} />
            {locked && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-ink bg-victory" />}
          </span>

          <span className="min-w-0 flex-1 flex flex-col justify-center">
            <span className="flex min-w-0 items-center gap-1.5">
              <span dir="auto" className={`min-w-0 truncate font-display text-[17px] font-black tracking-wide leading-none ${player.isSelf ? "text-brand" : "text-zinc-100"}`}>
                {player.name}
              </span>
              {player.streak && player.streak.count >= 3 && <span data-testid={`player-streak-${player.puuid}`} className={`shrink-0 rounded-sm border px-1 py-px text-[9px] font-black leading-none num ${player.streak.type === "W" ? "border-victory/50 text-victory" : "border-defeat/50 text-defeat"}`}>{player.streak.count}{player.streak.type}</span>}
              {player.party && (
                <span
                  title={`Party ${player.party.number}`}
                  className="live-party-badge inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest"
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
            <span className="live-player-subtitle mt-1 block truncate text-[11px] font-medium leading-none text-zinc-400">
              <span>{player.agent ?? "Unpicked"}</span>
              <span>{player.levelHidden ? " · Lvl hidden" : ` · Lvl ${player.level || "?"}`}</span>
              {encTotal > 0 && <span className="live-player-seen"> · seen {encTotal}x</span>}
            </span>
            {player.savedNote && <span className="live-saved-note mt-1 block truncate text-[11px] font-medium leading-none text-amber-300" title={player.savedNote}>{player.savedNote}</span>}
          </span>
        </span>

        <span className="live-player-rank flex w-[126px] min-w-0 flex-col items-end justify-center text-right">
          <span className="flex items-center justify-end gap-1.5">
            <span className="flex flex-col items-end justify-center">
              <span className="live-current-rank-name block max-w-[112px] whitespace-nowrap font-display text-[14px] font-black leading-none tracking-wide" style={{ color: player.rankColor }} title={player.rank}>{player.rank}</span>
              {player.rankTier > 2 && <span className="mt-1 inline-flex rounded-sm border border-edge/80 bg-panel/80 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-zinc-200 num">{player.rr} RR</span>}
            </span>
            {player.rankIcon && <img src={player.rankIcon} alt="" className="h-9 w-9 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          </span>
          <span className="live-player-peak mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-bold leading-none text-zinc-500">
            <span className="text-[9px] uppercase tracking-widest">Peak</span>
            {player.peakIcon && <img src={player.peakIcon} alt="" className="h-4 w-4 shrink-0 opacity-80" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            <span className="truncate" style={{ color: player.peakColor }}>{player.peakRank}</span>
          </span>
        </span>
      </span>

      {/* Middle Row: Metrics Grid */}
      <span className="live-player-metrics relative mb-1 grid grid-cols-4 divide-x divide-edge/70 border-y border-edge/50 py-0.5">
        <span className="flex flex-col justify-center px-1">
          <Metric label="Act games">{player.games || "—"}</Metric>
        </span>
        <span className="flex flex-col justify-center px-1">
          <Metric label="Act WR">{fmtPct(player.winRate)}</Metric>
        </span>
        <span className="flex flex-col justify-center px-1">
          <Metric label={`${recentLabel} K/D`} color={kdColor(player.kd)}>
            {player.kd === null ? <span className="animate-pulse text-zinc-600">...</span> : fmtNum(player.kd, 2)}
          </Metric>
        </span>
        <span className="flex flex-col justify-center px-1">
          <Metric label={`${recentLabel} HS`}>{fmtPct(player.hsPct)}</Metric>
        </span>
      </span>

      {/* Bottom Row: Weapons & Form */}
      <span className="live-player-bottom relative mt-auto flex min-w-0 items-center justify-between gap-1">
        <FeaturedLoadout weapons={player.weapons} />
        <span className="live-compact-metrics hidden shrink-0 items-center gap-2 text-[10px] font-semibold text-zinc-400 num">
          <span>WR <strong className="font-bold text-zinc-100">{fmtPct(player.winRate)}</strong></span>
          <span>K/D <strong className="font-bold" style={{ color: kdColor(player.kd) }}>{player.kd === null ? "—" : fmtNum(player.kd, 2)}</strong></span>
        </span>
        <RecentFormTiles form={player.form} latestRr={player.rrEarned} recentDetails={recentDetails} onRequestDetails={() => onRequestRecentDetails?.(player.puuid)} testId={`recent-form-${player.puuid}`} />
      </span>
    </button>
  );
}
