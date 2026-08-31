import { useEffect, useState } from "react";
import { AlertTriangle, Bookmark, Eye, EyeOff } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { LivePlayer, WeaponLoadout } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { RecentFormTiles } from "../../components/domain/RecentFormTiles";
import type { RecentFormDetail } from "../../components/domain/RecentFormTiles";
import { fmtNum, fmtPct } from "../../lib/format";
import { PlayerPreviewPopover } from "../../components/ui/PlayerPreviewPopover";
import { RowActionMenu } from "../../components/ui/RowActionMenu";
import { StreakBadge } from "../../components/ui/StreakBadge";
import { Truncate } from "../../components/ui/Truncate";

const FEATURED_WEAPONS = [
  { weapon: "Vandal", label: "V" },
  { weapon: "Phantom", label: "P" },
  { weapon: "Operator", label: "O" },
  { weapon: "Melee", label: "K" },
] as const;

function Metric({ label, children, headline = false, className = "" }: { label: string; children: React.ReactNode; headline?: boolean; className?: string }) {
  return (
    <span className={`live-stat-cell flex min-w-0 flex-col items-center justify-center whitespace-nowrap ${className}`}>
      <span className={`${headline ? "text-[15px] font-black text-zinc-100" : "text-[10px] font-medium text-zinc-500"} leading-none num`}>
        {children}
      </span>
      <span className={`mt-1 truncate font-semibold uppercase tracking-[0.08em] ${headline ? "text-[9px] text-zinc-400" : "text-[8px] text-zinc-600"}`}>
        {label}
      </span>
    </span>
  );
}

function WeaponArtwork({ icon, name, fallback, melee }: { icon: string | null | undefined; name: string; fallback: string; melee: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [icon]);
  if (!icon || failed) return <span className="text-[10px] font-bold text-zinc-500">{fallback}</span>;
  return <img src={icon} alt={name} draggable={false} className={`h-6 max-h-6 w-full object-contain opacity-70 transition-opacity duration-200 group-hover/card:opacity-85 ${melee ? "scale-[1.12]" : ""}`} loading="lazy" onError={() => setFailed(true)} />;
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
            className="live-weapon-slot flex h-8 min-w-0 items-center justify-center overflow-hidden rounded-sm border border-edge/60 bg-ink/90 p-1"
          >
            <WeaponArtwork icon={item?.skin?.icon} name={skinName ?? weapon} fallback={label} melee={weapon === "Melee"} />
          </span>
        );
      })}
    </span>
  );
}

export function PlayerRow({
  player,
  pregame,
  onSelect, onBookmark,
  recentDetails,
  onRequestRecentDetails,
}: {
  player: LivePlayer;
  pregame: boolean;
  onSelect: (p: LivePlayer, opener: HTMLElement) => void;
  onBookmark?: (p: LivePlayer) => void;
  recentDetails?: RecentFormDetail[];
  onRequestRecentDetails?: (puuid: string) => void;
}) {
  const enc = player.encounter;
  const encTotal = enc ? enc.withCount + enc.againstCount : 0;
  const locked = pregame && player.selection === "locked";
  const boostingReasons = player.smurfReasons.filter((reason) => /boost/i.test(reason));
  const otherSmurfReasons = player.smurfReasons.filter((reason) => !/boost/i.test(reason));
  const openFrom = (element: HTMLElement) => onSelect(player, element);

  return (
    <Tooltip.Provider delayDuration={400}><div
      data-testid={`player-row-${player.puuid}`}
      className={`live-player-row group/card relative flex h-full min-h-[88px] w-full select-none flex-col rounded-lg border border-white/10 bg-card/80 px-2 py-1 text-left transition-colors hover:z-20 hover:border-white/20 hover:bg-zinc-800/80 ${
        player.isSelf ? "border-brand/50 bg-brand/5" : ""
      }`}
    >
      <button type="button" aria-label={`View profile for ${player.name}`} data-testid={`player-row-open-${player.puuid}`} onClick={(event) => openFrom(event.currentTarget)} onFocus={() => onRequestRecentDetails?.(player.puuid)} className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" />
      <span className="live-player-background pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        {player.playerCard && (
          <img
            src={player.playerCard}
            alt=""
            className="live-player-art absolute inset-y-0 right-0 h-full w-[58%] object-cover object-[center_18%] opacity-20 saturate-[0.65] transition-opacity duration-200 group-hover/card:opacity-[0.26]"
            draggable={false}
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        )}
        <span className="live-player-matte absolute inset-0" />
      </span>

      <span className="live-player-grid pointer-events-none relative z-[2] grid min-h-0 flex-1 min-w-0">
        <span className="live-player-identity flex min-w-0 items-start gap-2.5">
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
              <PlayerPreviewPopover player={player}><button type="button" onClick={(event) => { event.stopPropagation(); openFrom(event.currentTarget); }} className={`pointer-events-auto min-w-0 text-left font-display text-[17px] font-bold leading-none tracking-wide ${player.isSelf ? "text-brand" : "text-zinc-100"}`}><Truncate text={player.name} maxWidth={160} tooltip={false} /></button></PlayerPreviewPopover>
              {player.party && (
                <span
                  title={`Party ${player.party.number}`}
                  className="live-party-badge inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest opacity-75"
                  style={{ borderColor: player.party.color, color: player.party.color, backgroundColor: `${player.party.color}15` }}
                >
                  <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: player.party.color }} />
                  P{player.party.number}
                </span>
              )}
              {player.saved && <Bookmark size={14} className="shrink-0 text-amber-300" fill="currentColor" aria-label="Saved player" />}
              {player.nameHidden && <EyeOff size={13} className="shrink-0 text-zinc-500" aria-label="streamer mode name" />}
            </span>
            <span className="live-player-subtitle mt-1 block truncate text-[11px] font-medium leading-none text-zinc-400">
              <span>{player.agent ?? "Unpicked"}</span>
              <span>{player.levelHidden ? " · Lvl hidden" : ` · Lvl ${player.level || "?"}`}</span>
              {encTotal > 0 && <span className="live-player-seen inline-flex items-center gap-1"> · <Eye size={10} /> {encTotal}x</span>}
            </span>
            <span className="live-player-alerts mt-1 flex min-w-0 items-center gap-1">
              {player.smurf && <Tooltip.Root><Tooltip.Trigger asChild><span data-testid={`smurf-flag-${player.puuid}`} className="live-alert-badge live-alert-smurf pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"><AlertTriangle size={10} /> SMURF</span></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content collisionPadding={12} className="z-[100] max-w-xs rounded-lg border border-white/10 bg-surface-popover/95 px-2.5 py-1.5 text-xs text-white/80 shadow-panel backdrop-blur-panel">{otherSmurfReasons.join(" · ") || "Smurf indicators detected"}</Tooltip.Content></Tooltip.Portal></Tooltip.Root>}
              {boostingReasons.length > 0 && (
                <Tooltip.Root><Tooltip.Trigger asChild><span data-testid={`boosting-flag-${player.puuid}`} className="live-alert-badge live-alert-boosting pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"><AlertTriangle size={10} /> BOOSTING</span></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content collisionPadding={12} className="z-[100] max-w-xs rounded-lg border border-white/10 bg-surface-popover/95 px-2.5 py-1.5 text-xs text-white/80 shadow-panel backdrop-blur-panel">{boostingReasons.join(" · ")}</Tooltip.Content></Tooltip.Portal></Tooltip.Root>
              )}
              {player.streak && player.streak.count >= 3 && (
                <StreakBadge type={player.streak.type} count={player.streak.count} />
              )}
            </span>
          </span>
        </span>

        <span className="live-player-stats min-w-0">
          <span className="live-primary-stats grid min-w-0 items-center divide-x divide-edge/60">
            <span className="live-player-rank flex min-w-0 items-center justify-end gap-1.5 pr-2 text-right">
              <span className="flex min-w-0 flex-col items-end justify-center">
                <span className="live-current-rank-name block max-w-full truncate font-display text-[16px] font-black leading-none tracking-wide" style={{ color: player.rankColor }} title={player.rank}>{player.rank}</span>
                {player.rankTier > 2 && <span className="live-current-rank-rr mt-1 inline-flex rounded-sm border border-edge/80 bg-panel/80 px-1.5 py-0.5 text-[11px] font-bold leading-none text-zinc-200 tabular-nums">{player.rr} RR</span>}
              </span>
              {player.rankIcon && <img src={player.rankIcon} alt="" draggable={false} className="live-current-rank-icon h-8 w-8 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            </span>
            <Metric label="WR" headline>{fmtPct(player.winRate)}</Metric>
            <Metric label="K/D" className="live-expanded-stat">{player.kd === null ? "—" : fmtNum(player.kd, 2)}</Metric>
            <Metric label="HS" className="live-expanded-stat">{fmtPct(player.hsPct)}</Metric>
          </span>
          <span className="live-secondary-stats mt-1 grid min-w-0 items-center gap-1">
            <span className="live-player-peak flex min-w-0 items-center gap-1.5 text-[11px] font-bold leading-none">
              <span className="live-player-peak-label shrink-0 text-[9px] uppercase tracking-[0.1em] text-zinc-500">Peak</span>
              {player.peakIcon && <img src={player.peakIcon} alt="" draggable={false} className="live-player-peak-icon h-4 w-4 shrink-0 opacity-60 saturate-50" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
              <span className="live-peak-rank-name whitespace-nowrap text-zinc-400" title={player.peakRank}>{player.peakRank}</span>
            </span>
            <FeaturedLoadout weapons={player.weapons} />
            <span className="pointer-events-auto"><RecentFormTiles form={player.form} latestRr={player.rrEarned} recentDetails={recentDetails} onRequestDetails={() => onRequestRecentDetails?.(player.puuid)} testId={`recent-form-${player.puuid}`} /></span>
          </span>
        </span>
      </span>
      <span className="pointer-events-auto absolute right-2 top-2 z-[3]"><RowActionMenu name={player.name} saved={Boolean(player.saved)} onViewProfile={() => { const opener = document.querySelector(`[data-testid="player-row-open-${player.puuid}"]`); if (opener instanceof HTMLElement) openFrom(opener); }} onBookmark={() => onBookmark?.(player)} /></span>
    </div></Tooltip.Provider>
  );
}
