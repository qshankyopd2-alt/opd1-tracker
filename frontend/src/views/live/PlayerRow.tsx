import { AlertTriangle, Bookmark, Check, Eye, EyeOff, TrendingUp } from "lucide-react";
import type { LivePlayer } from "../../api/types";
import { WeaponLoadoutStrip } from "../../components/domain/WeaponLoadoutStrip";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { RecentFormTiles, type RecentFormDetail } from "../../components/domain/RecentFormTiles";
import { StreakBadge } from "../../components/ui/StreakBadge";
import { PlayerIdentity } from "../../components/domain/PlayerIdentity";
import { fmtNum, fmtPct } from "../../lib/format";

export function PlayerRow({
  player,
  pregame,
  onSelect,
  recentDetails,
  onRequestRecentDetails,
}: {
  player: LivePlayer;
  pregame: boolean;
  onSelect: (p: LivePlayer, opener: HTMLElement) => void;
  recentDetails?: RecentFormDetail[];
  onRequestRecentDetails?: (puuid: string) => void;
}) {
  const locked = pregame && player.selection === "locked";
  const encounterCount = player.encounter ? player.encounter.withCount + player.encounter.againstCount : 0;
  const boostingReasons = player.smurfReasons.filter((reason) => /boost/i.test(reason));
  const otherSmurfReasons = player.smurfReasons.filter((reason) => !/boost/i.test(reason));

  const openFrom = (element: HTMLElement) => onSelect(player, element);

  return (
    <div
      data-testid={`player-row-${player.puuid}`}
      className={`player-row relative select-none cursor-pointer ${player.isSelf ? "player-row-self" : ""}`}
    >
      {/* Player-card artwork behind the telemetry */}
      <span className="live-player-background pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
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

      {/* Accessible profile opener */}
      <button
        type="button"
        aria-label={`View profile for ${player.name}`}
        title={player.name}
        data-testid={`player-row-open-${player.puuid}`}
        onClick={(event) => openFrom(event.currentTarget)}
        onFocus={() => onRequestRecentDetails?.(player.puuid)}
        className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />

      {/* Agent */}
      <div className="live-player-avatar relative z-[2] pointer-events-none" title={`${player.agent ?? "Agent unknown"} — ${locked ? "agent locked" : pregame ? "agent not locked yet" : player.agent ?? "no agent"}`}>
        <AgentAvatar
          portrait={player.agentPortrait}
          name={player.agent ?? player.name}
          color={player.agentColor}
          size={54}
          rounded={false}
        />
        {player.isSelf && (
          <span
            className="absolute -left-px -top-px flex h-[15px] items-center justify-center bg-accent px-1 font-display text-[8.5px] font-bold uppercase tracking-[0.08em] text-white"
            title="You"
          >
            You
          </span>
        )}
        {locked && (
          <span
            className="absolute -right-px -top-px flex h-[16px] w-[16px] items-center justify-center rounded-bl-sm bg-ally text-[var(--bg-app)]"
            title="Agent locked"
          >
            <Check size={10} strokeWidth={3.5} />
          </span>
        )}
      </div>

      {/* Identity */}
      <div className="live-player-identity relative z-[2] flex min-w-0 flex-col justify-center gap-[3px] pointer-events-none">
        <div className="flex min-w-0 items-center gap-1">
          <span
            className={`min-w-0 truncate font-display text-[14.5px] font-bold leading-tight ${
              player.isSelf ? "text-ally" : "text-[var(--text-primary)]"
            }`}
          >
            <PlayerIdentity name={player.name} />
          </span>
          {player.nameHidden && (
            <span title="Name hidden (streamer mode)">
              <EyeOff size={11} className="shrink-0 text-text-muted" aria-label="streamer mode name" />
            </span>
          )}
          {player.saved && (
            <span title={player.savedNote ? `Saved · ${player.savedNote}` : "Saved player"}>
              <Bookmark size={11} className="shrink-0 text-gold" fill="currentColor" aria-label="Saved player" />
            </span>
          )}
          {player.party && (
            <span
              title={`Party P${player.party.number}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm border px-1 py-px font-display text-[9.5px] font-bold leading-tight"
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

        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11.5px] leading-tight text-[var(--text-secondary)]">
          <span className="shrink-0 font-semibold">{player.agent ?? "Unpicked"}</span>
          <span className="shrink-0 text-text-muted">·</span>
          <span className="live-player-level shrink-0" title={player.levelHidden ? "Level hidden" : `Account level ${player.level}`}>
            {player.levelHidden ? "Level hidden" : `Lv ${player.level || "?"}`}
          </span>
          {encounterCount > 0 && (
            <span className="live-player-seen inline-flex shrink-0 items-center gap-0.5 text-text-muted" title={`Seen in ${encounterCount} matches`}>
              <Eye size={10} /> {encounterCount}×
            </span>
          )}
          {player.streak && player.streak.count >= 3 && (
            <span className="shrink-0">
              <StreakBadge type={player.streak.type} count={player.streak.count} />
            </span>
          )}
          {player.smurf && (
            <span
              data-testid={`smurf-flag-${player.puuid}`}
              title={`Possible smurf (heuristic): ${otherSmurfReasons.join(" · ") || "suspicious account profile"}`}
              aria-label="Possible smurf — hover for indicators"
              className="live-alert-badge live-alert-smurf inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-sm"
            >
              <AlertTriangle size={9} />
            </span>
          )}
          {boostingReasons.length > 0 && (
            <span
              data-testid={`boosting-flag-${player.puuid}`}
              title={`Possible boosting (heuristic): ${boostingReasons.join(" · ")}`}
              aria-label="Possible boosting — hover for indicators"
              className="live-alert-badge live-alert-boosting inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-sm"
            >
              <TrendingUp size={9} />
            </span>
          )}
          {pregame && !locked && (
            <span className="shrink-0 rounded-sm border border-edge px-1 py-px font-display text-[9px] font-bold uppercase tracking-[0.08em] text-text-muted">
              Picking
            </span>
          )}
        </div>

        <div className="live-player-form-line">
          <RecentFormTiles
            form={player.form}
            latestRr={player.rrEarned}
            recentDetails={recentDetails}
            onRequestDetails={() => onRequestRecentDetails?.(player.puuid)}
            testId={`player-${player.puuid}-recent-form`}
          />
        </div>
      </div>

      {/* Ranks */}
      <div className="live-player-rank relative z-[2] flex min-w-0 flex-col justify-center gap-1 shrink-0 pointer-events-none">
        <div className="flex min-w-0 items-center gap-2">
          {player.rankIcon && (
            <img
              src={player.rankIcon}
              alt=""
              draggable={false}
              className="live-current-rank-icon h-[30px] w-[30px] shrink-0 object-contain"
              loading="lazy"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
          )}
          <div className="min-w-0 leading-tight">
            <span
              className="live-current-rank-name block truncate font-display text-[13.5px] font-bold"
              style={{ color: player.rankColor }}
              title={player.rank}
            >
              {player.rank}
            </span>
            {player.rankTier > 2 ? (
              <span className="block text-[11px] font-semibold text-[var(--text-secondary)] tabular-nums" title="Current rating">
                {player.rr} RR
              </span>
            ) : (
              <span className="block text-[10px] text-text-muted">No RR</span>
            )}
          </div>
        </div>
        <div className="live-player-peak flex min-w-0 items-center gap-1.5 text-[11px]" title={`Peak rank: ${player.peakRank}${player.peakAct ? ` (${player.peakAct})` : ""}`}>
          <span className="micro-label shrink-0">Peak</span>
          {player.peakIcon && (
            <img
              src={player.peakIcon}
              alt=""
              draggable={false}
              className="h-[13px] w-[13px] shrink-0 object-contain"
              loading="lazy"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
          )}
          <span className="live-player-peak-name truncate font-semibold" style={{ color: player.peakColor }}>
            {player.peakRank}
          </span>
        </div>
      </div>

      {/* Telemetry */}
      <div className="live-player-stats relative z-[2] shrink-0 pointer-events-none">
        <div className="flex flex-col items-end leading-none" data-testid="player-row-wr" title="Current-act win rate">
          <span className="text-[16px] font-bold text-[var(--text-primary)] tabular-nums">
            {fmtPct(player.winRate)}
          </span>
          <span className="micro-label mt-[3px]">WR · Act</span>
        </div>
        <div className="flex flex-col items-end leading-none" data-testid="player-row-kd" title="K/D across the recent sample">
          <span
            className={`text-[16px] font-bold tabular-nums ${
              player.kd !== null && player.kd >= 1.2
                ? "text-victory"
                : player.kd !== null && player.kd <= 0.85
                  ? "text-defeat"
                  : "text-[var(--text-secondary)]"
            }`}
          >
            {player.kd !== null ? fmtNum(player.kd, 2) : "—"}
          </span>
          <span className="micro-label mt-[3px]">K/D</span>
        </div>
        <div className="flex flex-col items-end leading-none" data-testid="player-row-hs" title="Headshot % across the recent sample">
          <span className="text-[16px] font-bold text-[var(--text-secondary)] tabular-nums">
            {fmtPct(player.hsPct)}
          </span>
          <span className="micro-label mt-[3px]">HS%</span>
        </div>
      </div>

      {/* Loadout */}
      <div className="live-player-loadout">
        <WeaponLoadoutStrip weapons={player.weapons} compact />
      </div>
    </div>
  );
}
