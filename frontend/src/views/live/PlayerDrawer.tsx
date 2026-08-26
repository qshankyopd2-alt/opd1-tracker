import { useEffect, useState } from "react";
import { Bookmark, Save, Trash2, X } from "lucide-react";
import { ApiError, backend } from "../../api/client";
import type { Career, CareerMatch, LivePlayer, MatchMeta } from "../../api/types";
import { MatchDetailModal } from "../history/MatchDetailModal";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { RankBadge } from "../../components/domain/RankBadge";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { fmtDelta, fmtNum, fmtPct, matchDate, resultColor } from "../../lib/format";
import { RANKS } from "../../lib/ranks";

function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border border-edge rounded-sm px-2.5 py-1.5 bg-panel">
      <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="text-[13px] font-semibold num" style={{ color: color ?? "#E4E4E7" }}>
        {value}
      </div>
    </div>
  );
}

function RankCard({
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

function MapStatCard({
  map,
  games,
  winRate,
  splash,
}: {
  map: string;
  games: number;
  winRate: number;
  splash: string | null;
}) {
  return (
    <div className="relative min-h-[52px] overflow-hidden rounded-sm border border-edge bg-card px-2.5 py-2">
      {splash && <img src={splash} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" loading="lazy" draggable={false} />}
      <span className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/55" />
      <span className="relative flex items-center justify-between gap-3">
        <span className="truncate text-[12px] font-semibold text-zinc-100">{map}</span>
        <span className="shrink-0 text-[11px] num text-zinc-400">
          <span className={winRate >= 50 ? "text-victory" : "text-defeat"}>{winRate}%</span> · {games}g
        </span>
      </span>
    </div>
  );
}

function RecentMatchCard({ match, onOpen }: { match: CareerMatch; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative min-h-[78px] w-full overflow-hidden rounded-sm border border-edge bg-card px-2.5 py-2 text-left transition-colors hover:border-zinc-600"
      data-testid={`drawer-match-${match.matchId}`}
    >
      {match.mapSplash && (
        <img
          src={match.mapSplash}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-200 group-hover:opacity-35"
          loading="lazy"
          draggable={false}
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/55" />

      <span className="relative flex min-w-0 items-center gap-2">
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: resultColor(match.result) }} />
        <AgentAvatar portrait={match.agentPortrait} name={match.agent} color={match.agentColor} size={32} />
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-zinc-100">{match.map}</span>
            <span className="shrink-0 text-[10px] text-zinc-400">{match.mode}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span style={{ color: resultColor(match.result) }}>{match.result}</span>
            <span>·</span>
            <span>{matchDate(match.startMillis)}</span>
          </span>
        </span>
        {match.rrDelta !== null && match.rrDelta !== undefined && (
          <span className={`shrink-0 text-right text-[11px] font-semibold num ${match.rrDelta >= 0 ? "text-victory" : "text-defeat"}`}>
            {fmtDelta(match.rrDelta)} RR
          </span>
        )}
      </span>

      <span className="relative mt-2 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-edge/70 pt-1.5">
        <span className="text-[11px] text-zinc-200 num">
          {match.kills}/{match.deaths}/{match.assists}
          <span className="ml-1 text-[9px] uppercase tracking-wider text-zinc-500">K/D/A</span>
        </span>
        <span className="text-[10px] text-zinc-400 num">{match.acs} ACS</span>
        <span className="flex min-w-0 items-center justify-end gap-1.5">
          {match.rankIcon && <img src={match.rankIcon} alt={match.rankAfter ?? "Rank"} className="h-5 w-5 shrink-0" loading="lazy" />}
          <span className="max-w-[96px] truncate text-right text-[10px] font-semibold" style={{ color: match.rankColor ?? "#A1A1AA" }}>
            {match.rankAfter ?? "Unrated"}
            {match.rrAfter !== null && match.rrAfter !== undefined ? ` · ${match.rrAfter} RR` : ""}
          </span>
        </span>
      </span>
    </button>
  );
}

export function PlayerDrawer({
  player,
  accountPuuid,
  onSavedChange,
  onClose,
}: {
  player: LivePlayer;
  accountPuuid: string | null;
  onSavedChange: (saved: boolean, note: string) => void;
  onClose: () => void;
}) {
  const [career, setCareer] = useState<Career | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMatch, setOpenMatch] = useState<string | null>(null);
  const [metaOverrides, setMetaOverrides] = useState<Record<string, MatchMeta>>({});
  const [saved, setSaved] = useState(Boolean(player.saved));
  const [note, setNote] = useState(player.savedNote ?? "");
  const [savedBusy, setSavedBusy] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setCareer(null);
    setError(null);
    setLoading(true);
    backend
      .profile(player.puuid)
      .then((c) => alive && setCareer(c))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load career."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [player.puuid]);

  useEffect(() => {
    setSaved(Boolean(player.saved));
    setNote(player.savedNote ?? "");
    setSavedMessage(null);
  }, [player.puuid, player.saved, player.savedNote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const enc = player.encounter;
  const careerUsable = career && career.source === "local";
  const featuredWeapons = ["Vandal", "Phantom", "Operator", "Melee"]
    .map((weapon) => player.weapons.find((item) => item.weapon === weapon))
    .filter((item) => item !== undefined);
  const profileBackdrop = player.playerCard ?? player.agentArt ?? player.agentPortrait;
  const largePlayerCard = player.playerCard?.replace("/wideart.png", "/largeart.png");
  const previousRank = RANKS.find((rank) => rank.name === player.previousRank);
  const rankIconTemplate = player.rankIcon ?? player.peakIcon;
  const previousRankIcon = previousRank && rankIconTemplate
    ? rankIconTemplate.replace(/\/\d+\/smallicon\.png$/, `/${previousRank.tier}/smallicon.png`)
    : null;
  const recentMatches = career?.matches ?? [];
  const recentWins = recentMatches.filter((match) => match.result === "Victory").length;
  const recentLosses = recentMatches.filter((match) => match.result === "Defeat").length;
  const recentDraws = recentMatches.filter((match) => match.result === "Draw").length;
  const recentRecord = career
    ? `${recentWins}W - ${recentLosses}L${recentDraws ? ` - ${recentDraws}D` : ""}`
    : "—";
  const mapSplashes = new Map<string, string>();
  for (const match of recentMatches) {
    if (match.mapSplash && !mapSplashes.has(match.map)) mapSplashes.set(match.map, match.mapSplash);
  }

  const updateSaved = async (keep: boolean) => {
    if (!accountPuuid) return;
    setSavedBusy(true);
    setSavedMessage(null);
    try {
      const result = await backend.updateSavedPlayer(player.puuid, {
        accountPuuid,
        saved: keep,
        note: keep ? note : "",
      });
      setSaved(result.saved);
      const updatedNote = result.saved ? note.trim() : "";
      setNote(updatedNote);
      onSavedChange(result.saved, updatedNote);
      setSavedMessage(result.saved ? "Player and note saved." : "Player removed from Saved Players.");
    } catch (e) {
      setSavedMessage(e instanceof ApiError ? e.message : "Could not save this player.");
    } finally {
      setSavedBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="player-drawer-title" className="fixed inset-0 z-40" data-testid="player-drawer">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} data-testid="player-drawer-backdrop" />
      <aside className="absolute right-0 top-0 h-full w-[640px] max-w-full bg-panel border-l border-edge overflow-y-auto rise">
        {/* header */}
        <div className="relative border-b border-edge overflow-hidden">
          {profileBackdrop && (
            <img src={profileBackdrop} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-30" draggable={false} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel/90 to-panel/55" />
          <div className="relative flex min-h-[132px] items-center gap-4 p-4">
            {largePlayerCard ? (
              <img
                src={largePlayerCard}
                alt={`${player.name} player card`}
                className="h-24 w-16 shrink-0 rounded-sm border border-edge object-cover shadow-lg"
                draggable={false}
              />
            ) : (
              <AgentAvatar portrait={player.agentPortrait} name={player.agent ?? player.name} color={player.agentColor} size={64} />
            )}
            <div className="min-w-0 flex-1 self-center">
              <div className="flex items-center gap-2">
                <h2 id="player-drawer-title" dir="auto" className="truncate font-display text-[24px] font-black leading-tight">{player.name}</h2>
                {player.party && (
                  <span
                    className="shrink-0 rounded-sm border px-1.5 py-0.5 text-[9px] font-black num"
                    style={{ borderColor: player.party.color, color: player.party.color }}
                  >
                    PARTY P{player.party.number}
                  </span>
                )}
                {player.smurf && (
                  <Badge color="#F59E0B" filled testId="drawer-smurf-badge">
                    Smurf
                  </Badge>
                )}
              </div>
              {player.title && <div className="mt-1 text-[11px] italic text-zinc-400">{player.title}</div>}
              <div className="mt-1 text-[11px] text-zinc-400">
                {player.agent ? `${player.agent} · ` : ""}
                {player.role ?? ""} {player.levelHidden ? "· Lvl hidden" : `· Lvl ${player.level || "?"}`}
              </div>
            </div>
            <button
              aria-label="Close"
              data-testid="player-drawer-close"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm border border-edge p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {player.smurf && player.smurfReasons.length > 0 && (
            <div className="border border-amber-500/40 bg-amber-500/10 rounded-sm px-3 py-2 text-[12px] text-amber-200" data-testid="drawer-smurf-reasons">
              {player.smurfReasons.join(" · ")}
            </div>
          )}

          {!player.isSelf && accountPuuid && (
            <section className="rounded-sm border border-amber-400/25 bg-amber-400/5 p-3" data-testid="drawer-saved-player">
              <div className="mb-2 flex items-center gap-2">
                <Bookmark size={13} className="text-amber-300" fill={saved ? "currentColor" : "none"} />
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                  {saved ? "Saved player" : "Save this player"}
                </h3>
              </div>
              <textarea
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a note you want to see next time this player appears…"
                className="min-h-16 w-full resize-y rounded-sm border border-edge bg-ink px-2.5 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={savedBusy}
                  onClick={() => void updateSaved(true)}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-amber-300 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink disabled:opacity-50"
                >
                  <Save size={11} /> {saved ? "Save note" : "Save player"}
                </button>
                {saved && (
                  <button
                    type="button"
                    disabled={savedBusy}
                    onClick={() => void updateSaved(false)}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-edge px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-defeat disabled:opacity-50"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                )}
                <span className="ml-auto text-[9px] text-zinc-600 num">{note.length}/500</span>
              </div>
              {savedMessage && <p className="mt-2 text-[10px] text-zinc-400">{savedMessage}</p>}
            </section>
          )}

          {/* Act rank information comes from the current competitive MMR payload. */}
          <div className="grid grid-cols-3 gap-2" data-testid="drawer-rank-chips">
            <RankCard
              label="Current rank"
              name={player.rank}
              icon={player.rankIcon}
              color={player.rankColor}
              rr={player.rankTier > 2 ? player.rr : null}
            />
            <RankCard
              label="Peak rank"
              name={player.peakRank}
              icon={player.peakIcon}
              color={player.peakColor}
              detail={player.peakAct ?? undefined}
            />
            <RankCard
              label="Previous rank"
              name={player.previousRank || "Unknown"}
              icon={previousRankIcon}
              color={previousRank?.color ?? "#A1A1AA"}
            />
          </div>

          {/* encounter history */}
          {enc && (enc.withCount > 0 || enc.againstCount > 0) && (
            <div className="grid grid-cols-2 gap-2" data-testid="drawer-encounter">
              <Chip
                label="Played with you"
                value={`${enc.withCount}× · ${enc.winsWith}W–${enc.lossesWith}L`}
                color="#10B981"
              />
              <Chip
                label="Played against you"
                value={`${enc.againstCount}× · ${enc.winsAgainst}W–${enc.lossesAgainst}L`}
                color="#EF4444"
              />
            </div>
          )}

          {/* loadout */}
          {featuredWeapons.length > 0 && (
            <section data-testid="drawer-loadout">
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2">Featured loadout</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {featuredWeapons.map((w) => (
                  <div key={w.weapon} className="flex items-center gap-2 border border-edge rounded-sm px-2 py-1.5 bg-card">
                    {w.skin?.icon && <img src={w.skin.icon} alt="" className="h-5 max-w-[64px] object-contain" loading="lazy" />}
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold truncate">{w.skin?.name ?? "Standard"}</div>
                      <div className="text-[10px] text-zinc-500">{w.weapon === "Melee" ? "Knife" : w.weapon}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* career */}
          <section data-testid="drawer-career">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2">
              {career ? `Last ${recentMatches.length} matches` : "Last matches"}
            </h3>
            {loading && (
              <div className="space-y-1.5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}
            {!loading && (error || !careerUsable) && (
              <p className="text-[12px] text-zinc-500 border border-edge rounded-sm px-3 py-2.5" data-testid="drawer-career-unavailable">
                {error ?? "Career details are unavailable for this player right now."}
              </p>
            )}
            {!loading && careerUsable && career && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Chip label="Record" value={recentRecord} />
                  <Chip label="Win rate" value={fmtPct(career.averages.winRate)} />
                  <Chip label="Average K/D" value={fmtNum(career.averages.kd, 2)} />
                  <Chip label="Average HS%" value={fmtPct(career.averages.hsPct)} />
                  <Chip label="Average K/D/A" value={`${fmtNum(career.averages.kills, 1)}/${fmtNum(career.averages.deaths, 1)}/${fmtNum(career.averages.assists, 1)}`} />
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Current Act</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Chip label="Games" value={`${player.games}`} />
                    <Chip label="Win rate" value={fmtPct(player.winRate)} />
                  </div>
                </div>

                {career.agentPool.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Agent pool</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {career.agentPool.map((a) => (
                        <div key={a.agent} className="flex items-center gap-1.5 border border-edge rounded-sm pl-1 pr-2 py-1 bg-card">
                          <AgentAvatar portrait={a.portrait} name={a.agent} color={a.color} size={28} />
                          <span className="text-[11px]">{a.agent}</span>
                          <span className="text-[10px] text-zinc-500 num">
                            {a.games}g · {a.winRate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {career.mapStats.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Maps</h4>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {career.mapStats.map((m) => (
                        <MapStatCard
                          key={m.map}
                          map={m.map}
                          games={m.games}
                          winRate={m.winRate}
                          splash={mapSplashes.get(m.map) ?? null}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Last matches</h4>
                  <div className="space-y-1">
                    {recentMatches.map((match) => (
                      <RecentMatchCard key={match.matchId} match={match} onOpen={() => setOpenMatch(match.matchId)} />
                    ))}
                  </div>
                </div>

                {career.coPlayers.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Frequent teammates</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {career.coPlayers.map((c) => (
                        <span key={c.puuid} className="text-[11px] border border-edge rounded-sm px-2 py-1 bg-card">
                          {c.name ?? c.puuid.slice(0, 8)}
                          <span className="text-zinc-500 num"> ·{c.sharedMatches}×</span>
                          {c.isParty && <span className="text-brand"> party</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </aside>

      {openMatch && (
        <MatchDetailModal
          matchId={openMatch}
          subject={player.puuid}
          expected={career?.matches.find((match) => match.matchId === openMatch)}
          meta={metaOverrides[openMatch]}
          onMetaSaved={(id, m) => setMetaOverrides((prev) => ({ ...prev, [id]: m }))}
          onClose={() => setOpenMatch(null)}
        />
      )}
    </div>
  );
}
