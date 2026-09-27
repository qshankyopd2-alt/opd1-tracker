import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bookmark, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ApiError, backend } from "../../api/client";
import type { Career, LivePlayer, MatchMeta } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { PlayerIdentity } from "../../components/domain/PlayerIdentity";
import { StreakBadge } from "../../components/ui/StreakBadge";
import { RANKS } from "../../lib/ranks";
import { MatchDetailContent, type MatchMetaDraft } from "../history/MatchDetailModal";
import { CareerSection } from "./drawer/CareerSection";
import { MatchesSection } from "./drawer/MatchesSection";
import { SavedPlayerSection } from "./drawer/SavedPlayerSection";
import contourTexture from "../../assets/contour.png";

export type DrawerTab = "overview" | "matches";

const DRAWER_TABS: DrawerTab[] = ["overview", "matches"];

export function nextDrawerTabIndex(current: number, key: string): number | null {
  if (key === "ArrowRight") return (current + 1) % DRAWER_TABS.length;
  if (key === "ArrowLeft") return (current - 1 + DRAWER_TABS.length) % DRAWER_TABS.length;
  if (key === "Home") return 0;
  if (key === "End") return DRAWER_TABS.length - 1;
  return null;
}

export function PlayerDrawer({
  player,
  accountPuuid,
  onSavedChange,
  onClose,
  restoreFocus,
}: {
  player: LivePlayer;
  accountPuuid: string | null;
  onSavedChange: (saved: boolean, note: string) => void;
  onClose: () => void;
  restoreFocus?: HTMLElement | null;
}) {
  const [career, setCareer] = useState<Career | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMatch, setOpenMatch] = useState<{ id: string; opener: HTMLElement } | null>(null);
  const [matchDrafts, setMatchDrafts] = useState<Record<string, MatchMetaDraft>>({});
  const [metaOverrides, setMetaOverrides] = useState<Record<string, MatchMeta>>({});
  const [saved, setSaved] = useState(Boolean(player.saved));
  const [note, setNote] = useState(player.savedNote ?? "");
  const [savedBusy, setSavedBusy] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [cardFailed, setCardFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setCardFailed(false);
  }, [player.puuid, player.playerCard]);

  useEffect(() => {
    let alive = true;
    setCareer(null);
    setError(null);
    setLoading(true);
    setOpenMatch(null);
    backend
      .profile(player.puuid)
      .then((nextCareer) => alive && setCareer(nextCareer))
      .catch((nextError) => alive && setError(nextError instanceof ApiError ? nextError.message : "Failed to load career."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [player.puuid]);

  useEffect(() => {
    setSaved(Boolean(player.saved));
    setNote(player.savedNote ?? "");
    setSavedMessage(null);
    setActiveTab("overview");
    setNoteExpanded(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [player.puuid, player.saved, player.savedNote]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextIndex = nextDrawerTabIndex(index, event.key);
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = DRAWER_TABS[nextIndex];
    setActiveTab(nextTab);
    scrollRef.current?.scrollTo({ top: 0 });
    tabRefs.current[nextIndex]?.focus();
  };

  const closeMatch = () => {
    const opener = openMatch?.opener;
    setOpenMatch(null);
    setTimeout(() => { if (opener?.isConnected) opener.focus(); }, 0);
  };

  const selectTab = (tab: DrawerTab) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ top: 0 });
  };

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
      if (!result.saved) setNoteExpanded(false);
    } catch (nextError) {
      setSavedMessage(nextError instanceof ApiError ? nextError.message : "Could not save this player.");
    } finally {
      setSavedBusy(false);
    }
  };

  const openNoteEditor = () => {
    setActiveTab("overview");
    setNoteExpanded(true);
    requestAnimationFrame(() => document.getElementById("drawer-player-note")?.scrollIntoView({ block: "nearest" }));
  };

  const careerUsable = Boolean(career && career.source === "local");
  const previousRank = RANKS.find((rank) => rank.name === player.previousRank);
  const rankIconTemplate = player.rankIcon ?? player.peakIcon;
  const previousRankIcon = previousRank && rankIconTemplate
    ? rankIconTemplate.replace(/\/\d+\/smallicon\.png$/, `/${previousRank.tier}/smallicon.png`)
    : null;
  const mapSplashes = new Map<string, string>();
  for (const match of career?.matches ?? []) {
    if (match.mapSplash && !mapSplashes.has(match.map)) mapSplashes.set(match.map, match.mapSplash);
  }
  const matchCount = career?.matches.length ?? player.recentMatches ?? 0;
  const boostingReasons = player.smurfReasons.filter((reason) => /boost/i.test(reason));
  const hasThreatAlerts = player.smurf || boostingReasons.length > 0;
  const hasDrawerAlerts = player.smurf || boostingReasons.length > 0 || Boolean(player.streak && player.streak.count >= 3);
  const cardSrc = !cardFailed && player.playerCard ? player.playerCard : contourTexture;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
      <div className="modal-backdrop player-profile-layer z-[60]" data-testid="player-drawer">
        <Dialog.Overlay className="fixed inset-0 bg-black/70" data-testid="player-drawer-backdrop" />
        <Dialog.Content
          aria-labelledby={openMatch ? "match-detail-title" : "player-drawer-title"}
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => {
            if (openMatch) {
              event.preventDefault();
              closeMatch();
            }
          }}
          onCloseAutoFocus={(event) => { event.preventDefault(); if (restoreFocus?.isConnected) restoreFocus.focus(); }}
          className="modal drawer-slide relative z-[61] flex flex-col focus-visible:outline-none"
        >
          <div className={openMatch ? "hidden" : "flex flex-col h-full min-h-0"}>
            {/* Dossier header */}
            <header className="drawer-profile-header relative flex h-[140px] shrink-0 items-center gap-4 overflow-hidden border-b border-[var(--border-strong)] px-5" data-testid="drawer-header">
              <span className="pointer-events-none absolute inset-0" aria-hidden="true">
                <img
                  src={cardSrc}
                  alt=""
                  draggable={false}
                  className="drawer-player-card-art h-full w-full object-cover object-[center_22%]"
                  onError={() => {
                    if (!cardFailed) setCardFailed(true);
                  }}
                />
                <span className="drawer-player-card-matte absolute inset-0" />
              </span>
              <span className="absolute inset-y-3 left-0 w-[3px]" style={{ backgroundColor: player.rankColor }} aria-hidden="true" />
              <span className="relative shrink-0">
                <AgentAvatar portrait={player.agentPortrait} name={player.agent ?? player.name} color={player.agentColor} size={64} rounded={false} />
              </span>
              <div className="relative min-w-0 flex-1">
                {!openMatch ? (
                  <Dialog.Title id="player-drawer-title" dir="auto" className="min-w-0 font-display text-[24px] font-bold leading-tight tracking-[0.02em] text-[var(--text-primary)]">
                    <PlayerIdentity name={player.name} />
                  </Dialog.Title>
                ) : (
                  <h2 id="player-drawer-title" dir="auto" className="min-w-0 font-display text-[24px] font-bold leading-tight tracking-[0.02em] text-[var(--text-primary)]">
                    <PlayerIdentity name={player.name} />
                  </h2>
                )}
                {player.title && <div className="mt-1 truncate text-[12px] font-semibold uppercase tracking-[0.14em] text-text-muted">{player.title}</div>}
                <div className="mt-1 truncate text-[12.5px] font-medium text-[var(--text-secondary)]">
                  {player.agent ?? "Unpicked"}
                  {player.levelHidden ? " · Level hidden" : ` · Level ${player.level || "?"}`}
                  {player.isSelf && <span className="ml-2 rounded-sm bg-accent px-1.5 py-px font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white">You</span>}
                </div>
                <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                  {player.party && (
                    <span
                      className="shrink-0 rounded-sm border px-1.5 py-px font-display text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{ borderColor: player.party.color, color: player.party.color }}
                    >
                      Party P{player.party.number}
                    </span>
                  )}
                  {player.smurf && (
                    <span className="live-alert-smurf inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-px font-display text-[10px] font-bold uppercase tracking-[0.06em] text-white" data-testid="drawer-smurf-badge">
                      <AlertTriangle size={9} /> Smurf
                    </span>
                  )}
                  {boostingReasons.length > 0 && (
                    <span className="live-alert-boosting inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-px font-display text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                      <AlertTriangle size={9} /> Boosting
                    </span>
                  )}
                  {player.saved && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-gold/50 bg-gold-subtle px-1.5 py-px font-display text-[10px] font-bold uppercase tracking-[0.06em] text-gold">
                      <Bookmark size={9} fill="currentColor" /> Saved
                    </span>
                  )}
                </div>
              </div>
              <div className="relative flex w-[170px] shrink-0 items-center justify-end gap-3 pr-8" data-testid="drawer-current-rank">
                <div className="min-w-0 text-right leading-tight">
                  <div className="micro-label">Current rank</div>
                  <div className="whitespace-nowrap font-display text-[17px] font-bold" style={{ color: player.rankColor }}>{player.rank}</div>
                  {player.rankTier > 2 && <div className="font-mono text-[12px] font-semibold text-[var(--text-secondary)] tabular-nums">{player.rr} RR</div>}
                </div>
                {player.rankIcon && (
                  <img src={player.rankIcon} alt="" className="h-11 w-11 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                )}
              </div>
              {!player.isSelf && accountPuuid && (
                <button
                  type="button"
                  data-testid="drawer-save-action"
                  aria-label="Open player note"
                  title="Player note"
                  onClick={openNoteEditor}
                  className={`absolute bottom-3 right-3 rounded-sm border p-1.5 transition-colors ${
                    saved
                      ? "border-gold/50 bg-gold-subtle text-gold"
                      : "border-edge bg-panel text-text-secondary hover:bg-card-hover"
                  }`}
                >
                  <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                data-testid="player-drawer-close"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={15} />
              </button>
            </header>

            {/* Tabs */}
            <div className="flex h-10 shrink-0 items-stretch border-b border-[var(--border-strong)] bg-[var(--bg-app)] px-5" role="tablist" aria-label="Player details" data-testid="drawer-tabs">
              {DRAWER_TABS.map((tab, index) => {
                const selectedTab = activeTab === tab;
                const label = tab === "overview" ? "Overview" : "Matches";
                return (
                  <button
                    key={tab}
                    ref={(element) => { tabRefs.current[index] = element; }}
                    type="button"
                    id={`drawer-tab-${tab}`}
                    role="tab"
                    aria-selected={selectedTab}
                    aria-controls={`drawer-panel-${tab}`}
                    tabIndex={selectedTab ? 0 : -1}
                    data-testid={`drawer-tab-${tab}`}
                    onClick={() => selectTab(tab)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={`relative flex min-w-28 items-center justify-center gap-2 px-5 font-display text-[12px] font-bold uppercase tracking-[0.1em] transition-colors ${
                      selectedTab ? "text-[var(--text-primary)]" : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {label}
                    {tab === "matches" && (
                      <span className="num rounded-sm bg-card px-1.5 font-mono text-[11px] tabular-nums text-text-secondary">{matchCount}</span>
                    )}
                    {selectedTab && <span className="absolute inset-x-3 bottom-0 h-[3px] bg-accent" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto" data-testid="drawer-scroll-region">
              {activeTab === "overview" ? (
                <div id="drawer-panel-overview" role="tabpanel" aria-labelledby="drawer-tab-overview" className="p-4" data-testid="drawer-overview-panel">
                  {hasDrawerAlerts && (
                    <section
                      className={
                        hasThreatAlerts
                          ? "mb-3 border-l-[3px] border-accent bg-[#2a1418] px-3 py-2"
                          : "mb-3 border-l-[3px] border-edge bg-card px-3 py-2"
                      }
                      data-testid="drawer-smurf-reasons"
                      data-alert-kind={hasThreatAlerts ? "threat" : "streak"}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {player.smurf && (
                          <span className="live-alert-smurf inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-white">
                            <AlertTriangle size={11} strokeWidth={3} /> Smurf
                          </span>
                        )}
                        {boostingReasons.length > 0 && (
                          <span className="live-alert-boosting inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-white">
                            <AlertTriangle size={11} strokeWidth={3} /> Boosting
                          </span>
                        )}
                        {player.streak && player.streak.count >= 3 && <StreakBadge type={player.streak.type} count={player.streak.count} />}
                        <span className="ml-1 text-[10.5px] uppercase tracking-[0.1em] text-text-muted">Heuristic indicators</span>
                      </div>
                      {hasThreatAlerts && player.smurfReasons.length > 0 && (
                        <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-text-secondary">{player.smurfReasons.join(" · ")}</p>
                      )}
                    </section>
                  )}
                  <CareerSection
                    player={player}
                    career={career}
                    careerUsable={careerUsable}
                    loading={loading}
                    error={error}
                    mapSplashes={mapSplashes}
                    previousRankIcon={previousRankIcon}
                    previousRankColor={previousRank?.color ?? "#8a93a2"}
                  />
                  {!player.isSelf && accountPuuid && (
                    <SavedPlayerSection
                      saved={saved}
                      note={note}
                      expanded={noteExpanded}
                      savedBusy={savedBusy}
                      savedMessage={savedMessage}
                      onExpandedChange={setNoteExpanded}
                      onNoteChange={setNote}
                      onSave={() => void updateSaved(true)}
                      onRemove={() => void updateSaved(false)}
                    />
                  )}
                </div>
              ) : (
                <div id="drawer-panel-matches" role="tabpanel" aria-labelledby="drawer-tab-matches" className="flex min-h-full min-h-0 flex-col p-4" data-testid="drawer-matches-panel">
                  <MatchesSection career={career} careerUsable={careerUsable} loading={loading} error={error} onOpenMatch={(id, opener) => setOpenMatch({ id, opener })} />
                </div>
              )}
            </div>
          </div>
          {openMatch && (
            <div className="flex flex-col flex-1 min-h-0">
              <MatchDetailContent
                matchId={openMatch.id}
                subject={player.puuid}
                expected={career?.matches.find((match) => match.matchId === openMatch.id)}
                meta={metaOverrides[openMatch.id]}
                draft={matchDrafts[openMatch.id]}
                onDraftChange={(draft) => {
                  setMatchDrafts((prev) => ({ ...prev, [openMatch.id]: draft }));
                }}
                isEmbedded
                onBack={closeMatch}
                onMetaSaved={(id, savedMeta) => {
                  setMetaOverrides((previous) => ({ ...previous, [id]: savedMeta }));
                  setMatchDrafts((previous) => ({
                    ...previous,
                    [id]: {
                      note: savedMeta.note,
                      tags: (savedMeta.tags ?? []).join(", "),
                      bookmarked: savedMeta.bookmarked,
                    },
                  }));
                }}
                onClose={onClose}
              />
            </div>
          )}
        </Dialog.Content>
      </div></Dialog.Portal></Dialog.Root>
  );
}
