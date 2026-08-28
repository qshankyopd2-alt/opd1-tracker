import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { ApiError, backend } from "../../api/client";
import type { Career, LivePlayer, MatchMeta } from "../../api/types";
import { MatchDetailModal } from "../history/MatchDetailModal";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { Badge } from "../../components/ui/Badge";
import { RANKS } from "../../lib/ranks";
import { CareerSection } from "./drawer/CareerSection";
import { Chip } from "./drawer/Chip";
import { RankCard } from "./drawer/RankCard";
import { SavedPlayerSection } from "./drawer/SavedPlayerSection";

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
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    if (dialogRef.current) {
      dialogRef.current.focus();
    }
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "Tab") {
      if (!dialogRef.current) return;
      const selectors = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const focusableElements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(selectors))
        .filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === dialogRef.current) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    }
  };
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

  const enc = player.encounter;
  const careerUsable = Boolean(career && career.source === "local");
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
  const mapSplashes = new Map<string, string>();
  for (const match of career?.matches ?? []) {
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
    <div className="fixed inset-0 z-40" data-testid="player-drawer">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} data-testid="player-drawer-backdrop" />
      <div
        className="absolute right-0 top-0 h-full w-[640px] max-w-full bg-panel border-l border-edge overflow-y-auto rise"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-drawer-title"
        ref={dialogRef as any}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
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
            <div className="border border-amber-500 bg-amber-500/20 rounded-sm px-3 py-2 text-[12px] text-amber-100 font-semibold" data-testid="drawer-smurf-reasons">
              {player.smurfReasons.join(" · ")}
            </div>
          )}

          {!player.isSelf && accountPuuid && (
            <SavedPlayerSection
              saved={saved}
              note={note}
              savedBusy={savedBusy}
              savedMessage={savedMessage}
              onNoteChange={setNote}
              onSave={() => void updateSaved(true)}
              onRemove={() => void updateSaved(false)}
            />
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

          <CareerSection
            player={player}
            career={career}
            careerUsable={careerUsable}
            loading={loading}
            error={error}
            mapSplashes={mapSplashes}
            onOpenMatch={(matchId) => setOpenMatch(matchId)}
          />
        </div>
      </div>

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
