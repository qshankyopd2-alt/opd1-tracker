import { AlertTriangle, Bookmark, Check, Eye, EyeOff } from "lucide-react";
import type { LivePlayer } from "../../api/types";
import { WeaponLoadoutStrip } from "../../components/domain/WeaponLoadoutStrip";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { RecentFormTiles, type RecentFormDetail } from "../../components/domain/RecentFormTiles";
import { PlayerIdentity } from "../../components/domain/PlayerIdentity";
import { fmtNum, fmtPct } from "../../lib/format";

export function PlayerRow({ player, pregame, onSelect, recentDetails, onRequestRecentDetails, showLoadouts = false }: {
  player: LivePlayer;
  pregame: boolean;
  showLoadouts?: boolean;
  onSelect: (p: LivePlayer, opener: HTMLElement) => void;
  recentDetails?: RecentFormDetail[];
  onRequestRecentDetails?: (puuid: string) => void;
}) {
  const encounters = player.encounter ? player.encounter.withCount + player.encounter.againstCount : 0;
  const boosting = player.smurfReasons.some((reason) => /boost/i.test(reason));
  return (
    <article data-testid={`player-row-${player.puuid}`} data-show-loadouts={showLoadouts} className={`player-row relative group/row ${player.isSelf ? "player-row-self" : ""}`}>
      <span className="live-player-background absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {player.playerCard && <img src={player.playerCard} alt="" draggable={false} loading="lazy" className="live-player-art absolute inset-0 h-full object-cover object-[center_18%]" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        <span className="live-player-matte absolute inset-0" />
      </span>
      <button type="button" aria-label={`View profile for ${player.name}`} title={`${player.name}${player.smurfReasons.length ? ` · Possible indicators: ${player.smurfReasons.join(" · ")}` : ""}`}
        data-testid={`player-row-open-${player.puuid}`} onClick={(event) => onSelect(player, event.currentTarget)}
        onFocus={() => onRequestRecentDetails?.(player.puuid)} className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:ring-2 focus-visible:ring-brand" />
      <div className="live-player-avatar">
        <AgentAvatar portrait={player.agentPortrait} name={player.agent ?? player.name} color={player.agentColor} size={36} />
        {pregame && player.selection === "locked" && <Check size={12} className="absolute -right-1 -top-1 bg-victory text-app rounded" aria-label="Agent locked" />}
      </div>
      <div className="live-player-identity">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 font-display text-[17px] font-semibold"><PlayerIdentity name={player.name} /></span>
          {player.isSelf && <span className="text-[12px] text-brand">You</span>}
          {player.nameHidden && <EyeOff size={12} className="shrink-0" aria-label="Hidden name" />}
          {player.saved && <Bookmark size={12} className="shrink-0 text-brand fill-current" aria-label="Saved player" />}
        </div>
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-[12px] text-text-secondary">
          <span className="truncate">{player.agent ?? "Unpicked"} · {player.levelHidden ? "Level hidden" : `Lv ${player.level ?? "—"}`}</span>
          {player.party && <span className="live-party-badge" style={{ color: player.party.color }} title={`Detected party ${player.party.number}`}>P{player.party.number}</span>}
          {encounters > 0 && <span className="inline-flex items-center gap-1"><Eye size={11} />{encounters}×</span>}
          {player.smurf && <AlertTriangle size={12} data-testid={`smurf-flag-${player.puuid}`} className="live-alert-smurf shrink-0" aria-label="Possible smurf" />}
          {boosting && <AlertTriangle size={12} data-testid={`boosting-flag-${player.puuid}`} className="live-alert-boosting shrink-0" aria-label="Possible boosting" />}
        </div>
      </div>
      <div className="live-player-rank">
        {player.rankIcon && <img src={player.rankIcon} alt="" className="h-7 w-7 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        <div className="min-w-0"><div className="truncate text-[14px] font-semibold" title={player.rank}>{player.rank}</div>
          <div className="text-[12px] text-text-secondary">{player.rankTier > 2 ? `${fmtNum(player.rr)} RR` : "Unranked"}</div>
        </div>
      </div>
      {!showLoadouts && <><div className="live-player-stats" title="Current-act win rate. K/D and HS are sampled from recent matches, not this live match.">
        <span data-testid="player-row-wr"><small>Act WR</small><strong>{fmtPct(player.winRate)}</strong></span>
        <span data-testid="player-row-kd"><small>K/D</small><strong>{fmtNum(player.kd, 2)}</strong></span>
        <span data-testid="player-row-hs"><small>HS</small><strong>{fmtPct(player.hsPct)}</strong></span>
        <span className="live-player-peak" title={`Peak rank: ${player.peakRank ?? "Unavailable"}`}><small>Peak</small>{player.peakIcon && <img src={player.peakIcon} alt={player.peakRank ?? ""} className="h-5 w-5" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</span>
      </div>
      <div className="live-player-form-line"><RecentFormTiles form={player.form} latestRr={player.rrEarned} recentDetails={recentDetails}
        onRequestDetails={() => onRequestRecentDetails?.(player.puuid)} testId={`player-${player.puuid}-recent-form`} /></div></>}
      {showLoadouts && <div className="live-player-loadout"><WeaponLoadoutStrip weapons={player.weapons} compact /></div>}
    </article>
  );
}
