import { AlertTriangle, Bookmark, Check, Eye, EyeOff } from "lucide-react";
import type { LivePlayer, WeaponLoadout } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { RecentFormTiles, type RecentFormDetail } from "../../components/domain/RecentFormTiles";
import { StreakBadge } from "../../components/ui/StreakBadge";
import { Truncate } from "../../components/ui/Truncate";
import { fmtNum, fmtPct } from "../../lib/format";

const FEATURED_WEAPONS = ["Vandal", "Phantom", "Operator", "Melee"] as const;

function FeaturedLoadout({ weapons }: { weapons: WeaponLoadout[] }) {
  const byWeapon = new Map(weapons.map((item) => [item.weapon, item]));
  return (
    <div className="live-player-loadout grid w-full grid-cols-4 gap-1">
      {FEATURED_WEAPONS.map((weapon) => {
        const item = byWeapon.get(weapon);
        const label = weapon === "Melee" ? "K" : weapon[0];
        return (
          <span
            key={weapon}
            title={`${weapon === "Melee" ? "Knife" : weapon}: ${item?.skin?.name ?? (item ? "Standard" : "Unavailable")}`}
            className="live-weapon-slot flex h-8 min-w-0 items-center justify-center overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-app)] p-1"
          >
            {item?.skin?.icon ? (
              <img
                src={item.skin.icon}
                alt=""
                draggable={false}
                className={`h-6 max-h-6 w-full object-contain ${weapon === "Melee" ? "scale-110" : ""}`}
                loading="lazy"
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
            ) : (
              <span className="font-mono text-[11px] font-bold text-[var(--text-muted)]">{label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function PlayerRow({
  player,
  pregame,
  onSelect,
  onBookmark: _onBookmark,
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
  const locked = pregame && player.selection === "locked";
  const encounterCount = player.encounter ? player.encounter.withCount + player.encounter.againstCount : 0;
  const boostingReasons = player.smurfReasons.filter((reason) => /boost/i.test(reason));
  const otherSmurfReasons = player.smurfReasons.filter((reason) => !/boost/i.test(reason));
  const hasAlerts = player.smurf || boostingReasons.length > 0 || Boolean(player.streak && player.streak.count >= 3);
  const openFrom = (element: HTMLElement) => onSelect(player, element);

  return (
    <div
      data-testid={`player-row-${player.puuid}`}
      className={`player-row relative select-none cursor-pointer group/row ${player.isSelf ? "player-row-self" : ""}`}
    >
      <span className="live-player-background pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {player.playerCard && (
          <img
            src={player.playerCard}
            alt=""
            draggable={false}
            className="live-player-art absolute inset-0 h-full w-full object-cover object-[center_18%]"
            loading="lazy"
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        )}
        <span className="live-player-matte absolute inset-0" />
      </span>

      <button
        type="button"
        aria-label={`View profile for ${player.name}`}
        data-testid={`player-row-open-${player.puuid}`}
        onClick={(event) => openFrom(event.currentTarget)}
        onFocus={() => onRequestRecentDetails?.(player.puuid)}
        className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-info)]"
      />

      <div className="live-player-avatar relative z-[2] flex h-11 w-11 shrink-0 items-center justify-center pointer-events-none">
        <AgentAvatar
          portrait={player.agentPortrait}
          name={player.agent ?? player.name}
          color={player.agentColor}
          size={44}
        />
        {locked && (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-team-a)] text-[var(--bg-app)] shadow-sm"
            title="Agent locked"
          >
            <Check size={9} strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="live-player-identity relative z-[2] flex min-w-0 flex-col justify-center gap-0.5 pointer-events-none">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`min-w-0 font-display text-[17px] font-semibold leading-snug ${
              player.isSelf ? "text-brand" : "text-[var(--text-primary)]"
            }`}
          >
            <Truncate text={player.name} maxWidth="100%" tooltip={true} />
          </span>

          {player.nameHidden && (
            <EyeOff size={12} className="shrink-0 text-[var(--text-muted)]" aria-label="streamer mode name" />
          )}

          {player.saved && (
            <Bookmark size={12} className="shrink-0 text-[var(--accent-gold)] fill-current" aria-label="Saved player" />
          )}

          {player.party && (
            <span
              title={`Party ${player.party.number}`}
              className="live-party-badge inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold tracking-normal"
              style={{
                borderColor: player.party.color,
                color: player.party.color,
                backgroundColor: "var(--bg-panel)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: player.party.color }} />
              P{player.party.number}
            </span>
          )}

        </div>

        <div className="live-player-subtitle flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12px] font-normal leading-relaxed text-[var(--text-secondary)]">
          <span>{player.agent ?? "Unpicked"}</span>
          {player.levelHidden ? <span className="live-player-level">· Level hidden</span> : <span className="live-player-level">· Level {player.level || "?"}</span>}
          {encounterCount > 0 && <span className="live-player-seen inline-flex items-center gap-1"><Eye size={10} /> {encounterCount}x</span>}
        </div>
      </div>

      {hasAlerts && <div className="live-player-alerts relative z-[2] flex min-w-0 items-center gap-1 pointer-events-none">
        {player.smurf && (
          <span
            data-testid={`smurf-flag-${player.puuid}`}
            title={otherSmurfReasons.join(" · ") || "Smurf indicators detected"}
            className="live-alert-badge live-alert-smurf inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold tracking-normal"
          >
            <AlertTriangle size={10} /> SMURF
          </span>
        )}
        {boostingReasons.length > 0 && (
          <span
            data-testid={`boosting-flag-${player.puuid}`}
            title={boostingReasons.join(" · ")}
            className="live-alert-badge live-alert-boosting inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold tracking-normal"
          >
            <AlertTriangle size={10} /> BOOSTING
          </span>
        )}
        {player.streak && player.streak.count >= 3 && (
          <StreakBadge type={player.streak.type} count={player.streak.count} />
        )}
      </div>}

      <div className="live-player-rank relative z-[2] flex min-w-0 items-center justify-between gap-2 shrink-0 pointer-events-none">
        <div className="flex min-w-0 flex-col leading-none">
          <span
            className="live-current-rank-name truncate font-display text-[14px] font-semibold leading-snug"
            title={player.rank}
          >
            {player.rank}
          </span>
          {player.rankTier > 2 && (
            <span className="mt-0.5 text-[12px] font-mono text-[var(--text-secondary)] tabular-nums">
              {player.rr} RR
            </span>
          )}
        </div>
        {player.rankIcon && (
          <img
            src={player.rankIcon}
            alt=""
            draggable={false}
            className="live-current-rank-icon h-8 w-8 shrink-0 object-contain"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>

      <div className="live-player-stats relative z-[2] flex items-center justify-end gap-2 shrink-0 pointer-events-none">
          <div className="flex flex-col items-center leading-none" data-testid="player-row-wr">
            <span className="font-display text-[20px] font-semibold leading-none text-[var(--text-primary)] tabular-nums">
              {fmtPct(player.winRate)}
            </span>
            <span className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">
              WR
            </span>
          </div>

          <div className="flex flex-col items-center leading-none" data-testid="player-row-kd">
            <span
              className={`text-[17px] font-semibold font-mono tabular-nums ${
                player.kd !== null && player.kd >= 1.2
                  ? "text-[var(--accent-team-a)]"
                  : player.kd !== null && player.kd <= 0.85
                    ? "text-[var(--accent-team-b)]"
                    : "text-[var(--text-secondary)]"
              }`}
            >
              {player.kd !== null ? fmtNum(player.kd, 2) : "—"}
            </span>
            <span className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">
              KD
            </span>
          </div>

          <div className="flex flex-col items-center leading-none" data-testid="player-row-hs">
            <span className="text-[17px] font-semibold font-mono text-[var(--text-secondary)] tabular-nums">
              {fmtPct(player.hsPct)}
            </span>
            <span className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">
              HS
            </span>
          </div>
      </div>

      {/* Tier 3: details that remain useful during a quick expanded-window scan. */}
      <div className="tier-3-detail relative z-[2] pointer-events-none">
        <div className="live-player-form-line flex min-w-0 items-center justify-between gap-2">
          {player.peakRank && (
            <div
              className="live-player-peak flex min-w-0 items-center gap-1 text-[12px]"
              title={`Peak Rank: ${player.peakRank}`}
            >
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">Peak</span>
              {player.peakIcon && (
                <img
                  src={player.peakIcon}
                  alt=""
                  draggable={false}
                  className="h-4 w-4 shrink-0 object-contain"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
              <span className="live-player-peak-name truncate font-medium text-[var(--text-secondary)]">{player.peakRank}</span>
            </div>
          )}

          <div className="flex shrink-0 items-center border-l border-[var(--border-subtle)] pl-2">
            <RecentFormTiles
              form={player.form}
              latestRr={player.rrEarned}
              recentDetails={recentDetails}
              onRequestDetails={() => onRequestRecentDetails?.(player.puuid)}
              testId={`player-${player.puuid}-recent-form`}
            />
          </div>
        </div>
        <FeaturedLoadout weapons={player.weapons} />
      </div>
    </div>
  );
}
