import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bookmark, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ApiError, backend } from "../../api/client";
import type { Career, LivePlayer, MatchMeta } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { Badge } from "../../components/ui/Badge";
import { StreakBadge } from "../../components/ui/StreakBadge";
import { RANKS } from "../../lib/ranks";
import { MatchDetailModal } from "../history/MatchDetailModal";
import { CareerSection } from "./drawer/CareerSection";
import { MatchesSection } from "./drawer/MatchesSection";
import { SavedPlayerSection } from "./drawer/SavedPlayerSection";

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
  const [metaOverrides, setMetaOverrides] = useState<Record<string, MatchMeta>>({});
  const [saved, setSaved] = useState(Boolean(player.saved));
  const [note, setNote] = useState(player.savedNote ?? "");
  const [savedBusy, setSavedBusy] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [noteExpanded, setNoteExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    let alive = true;
    setCareer(null);
    setError(null);
    setLoading(true);
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
  const profileBackdrop = player.playerCard ?? player.agentArt ?? player.agentPortrait;
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

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><div className="fixed inset-0 z-[60]" data-testid="player-drawer">
      <Dialog.Overlay className="absolute inset-0 bg-black/70" data-testid="player-drawer-backdrop" />
      <Dialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); if (restoreFocus?.isConnected) restoreFocus.focus(); }} className="drawer-slide absolute right-0 top-0 flex h-full w-[640px] max-w-full flex-col overflow-hidden border-l border-white/10 bg-surface-panel/95 shadow-panel backdrop-blur-panel" {...(openMatch ? { inert: "", "aria-hidden": true } : {})}>
        <header className="relative flex h-24 shrink-0 items-center gap-3 overflow-hidden border-b border-edge bg-panel px-4" data-testid="drawer-header">
          {profileBackdrop && (
            <img src={profileBackdrop} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.14]" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />
          )}
          <span className="absolute inset-0 bg-gradient-to-r from-panel via-panel/95 to-panel/90" />
          <span className="absolute inset-y-3 left-0 w-[3px]" style={{ backgroundColor: player.rankColor }} aria-hidden="true" />
          <span className="relative shrink-0">
            <AgentAvatar portrait={player.agentPortrait} name={player.agent ?? player.name} color={player.agentColor} size={54} />
          </span>
          <div className="relative min-w-0 flex-1">
            <Dialog.Title id="player-drawer-title" dir="auto" className="truncate font-display text-[24px] font-bold leading-none text-zinc-100">{player.name}</Dialog.Title>
            {player.title && <div className="mt-1 truncate text-[11px] italic text-zinc-500">{player.title}</div>}
            <div className="mt-1 truncate text-[11px] text-zinc-400">
              {player.agent ?? "Unpicked"}{player.levelHidden ? " · Level hidden" : ` · Level ${player.level || "?"}`}
            </div>
            <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
              {player.party && (
                <span className="shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold" style={{ borderColor: player.party.color, color: player.party.color }}>
                  Party P{player.party.number}
                </span>
              )}
              {player.smurf && <Badge color="#F59E0B" filled testId="drawer-smurf-badge">Smurf</Badge>}
            </div>
          </div>
          <div className="relative flex w-[190px] shrink-0 items-center justify-end gap-2 pr-7" data-testid="drawer-current-rank">
            <div className="min-w-0 text-right">
              <div className="text-[10px] font-semibold text-zinc-500">Current</div>
              <div className="whitespace-nowrap font-display text-[15px] font-black leading-tight" style={{ color: player.rankColor }}>{player.rank}</div>
              {player.rankTier > 2 && <div className="text-[11px] text-zinc-400 tabular-nums">{player.rr} RR</div>}
            </div>
            {player.rankIcon && <img src={player.rankIcon} alt="" className="h-10 w-10 shrink-0" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          </div>
          {!player.isSelf && accountPuuid && (
            <button type="button" data-testid="drawer-save-action" aria-label="Open player note" title="Player note" onClick={openNoteEditor} className="absolute bottom-3 right-3 rounded-sm border border-edge bg-panel p-1.5 text-amber-300 hover:bg-zinc-800">
              <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
            </button>
          )}
          <button type="button" aria-label="Close" data-testid="player-drawer-close" onClick={onClose} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-sm border border-edge bg-panel text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100">
            <X size={15} />
          </button>
        </header>

        <div className="flex h-10 shrink-0 border-b border-edge bg-ink/70 px-4" role="tablist" aria-label="Player details" data-testid="drawer-tabs">
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
                className={`relative flex min-w-28 items-center justify-center gap-2 px-4 text-[12px] font-semibold transition-colors ${selectedTab ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {label}
                {tab === "matches" && <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 tabular-nums">{matchCount}</span>}
                {selectedTab && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-brand" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto" data-testid="drawer-scroll-region">
          {activeTab === "overview" ? (
            <div id="drawer-panel-overview" role="tabpanel" aria-labelledby="drawer-tab-overview" className="p-3" data-testid="drawer-overview-panel">
              {hasDrawerAlerts && (
                <section className={`mb-3 border bg-zinc-950 px-3 py-2 ${hasThreatAlerts ? "border-rose-400/50 shadow-[inset_3px_0_0_#e11d48]" : "border-amber-400/45 shadow-[inset_3px_0_0_#b45309]"}`} data-testid="drawer-smurf-reasons" data-alert-kind={hasThreatAlerts ? "threat" : "streak"}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {player.smurf && <span className="live-alert-badge live-alert-smurf inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white"><AlertTriangle size={11} strokeWidth={3} />Smurf</span>}
                    {boostingReasons.length > 0 && <span className="live-alert-badge live-alert-boosting inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white"><AlertTriangle size={11} strokeWidth={3} />Boosting</span>}
                    {player.streak && player.streak.count >= 3 && <StreakBadge type={player.streak.type} count={player.streak.count} />}
                  </div>
                  {hasThreatAlerts && player.smurfReasons.length > 0 && <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-zinc-300">{player.smurfReasons.join(" · ")}</p>}
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
                previousRankColor={previousRank?.color ?? "#A1A1AA"}
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
            <div id="drawer-panel-matches" role="tabpanel" aria-labelledby="drawer-tab-matches" className="flex h-full min-h-0 flex-col p-3" data-testid="drawer-matches-panel">
              <MatchesSection career={career} careerUsable={careerUsable} loading={loading} error={error} onOpenMatch={(id, opener) => setOpenMatch({ id, opener })} />
            </div>
          )}
        </div>
      </Dialog.Content>

      {openMatch && (
        <MatchDetailModal
          matchId={openMatch.id}
          subject={player.puuid}
          expected={career?.matches.find((match) => match.matchId === openMatch.id)}
          meta={metaOverrides[openMatch.id]}
          restoreFocus={openMatch.opener}
          onMetaSaved={(id, meta) => setMetaOverrides((previous) => ({ ...previous, [id]: meta }))}
          onClose={() => setOpenMatch(null)}
        />
      )}
    </div></Dialog.Portal></Dialog.Root>
  );
}
