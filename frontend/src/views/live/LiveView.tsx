import { useEffect, useState } from "react";
import type { LivePlayer } from "../../api/types";
import { LockKeyhole } from "lucide-react";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useLiveData } from "../../state/LiveDataContext";
import { MatchHeader } from "./MatchHeader";
import { OfflineHero } from "./OfflineHero";
import { PlayerDrawer } from "./PlayerDrawer";
import { RecapCard } from "./RecapCard";
import { TeamPanel } from "./TeamPanel";
import { LobbyQueueCard } from "./LobbyQueueCard";
import { splitTeams } from "./teamSplit";
import { useRecentFormDetails } from "../../hooks/useRecentFormDetails";

const designModeEnabled = import.meta.env.DEV && import.meta.env.VITE_DESIGN_MODE === "true";

export function LiveView() {
  const { board, error, loading, showBoard, refresh } = useLiveData();
  const [selected, setSelected] = useState<{ player: LivePlayer; accountPuuid: string | null; restoreFocus: HTMLElement | null } | null>(null);
  const [savedOverrides, setSavedOverrides] = useState<Record<string, { saved: boolean; note: string }>>({});
  const [previewDrawerRequested, setPreviewDrawerRequested] = useState(false);
  const { recentDetailsByPlayer, onRequestRecentDetails } = useRecentFormDetails();
  const accountPuuid = board?.selfPuuid ?? null;

  useEffect(() => {
    setSelected((current) => (current && current.accountPuuid !== accountPuuid ? null : current));
    setSavedOverrides({});
  }, [accountPuuid]);

  useEffect(() => {
    if (!board) return;
    setSelected((current) => {
      if (!current) return current;
      const fresh = board.players.find((player) => player.puuid === current.player.puuid);
      if (!fresh) return current;
      const saved = savedOverrides[fresh.puuid];
      return {
        ...current,
        player: saved ? { ...fresh, saved: saved.saved, savedNote: saved.note } : fresh,
      };
    });
  }, [board, savedOverrides]);

  useEffect(() => {
    if (!designModeEnabled) return;
    const onPreviewView = (event: Event) => {
      setPreviewDrawerRequested((event as CustomEvent<string>).detail === "live-drawer");
    };
    window.addEventListener("opd1:design-view", onPreviewView);
    return () => window.removeEventListener("opd1:design-view", onPreviewView);
  }, []);

  useEffect(() => {
    if (!previewDrawerRequested || !board) return;
    const player = board.players.find((candidate) => candidate.smurf) ?? board.players[0];
    if (player) setSelected({ player, accountPuuid: board.selfPuuid ?? null, restoreFocus: null });
  }, [board, previewDrawerRequested]);

  if (loading && !board) {
    return (
      <div className="p-5">
        <TableSkeleton rows={7} />
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="p-5 space-y-4">
        <ErrorBanner message={error} onRetry={refresh} testId="live-error" />
        <OfflineHero />
      </div>
    );
  }

  if (!showBoard || !board) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <OfflineHero notice={board?.notice} />
        </div>
      </div>
    );
  }

  const pregame = board.state === "PREGAME";
  const menus = board.state === "MENUS";
  const { allyId, enemyId, ally, enemy } = splitTeams(board);

  const drawer = selected ? (
    <PlayerDrawer
      key={`${selected.accountPuuid}:${selected.player.puuid}`}
      player={selected.player}
      accountPuuid={selected.accountPuuid}
      restoreFocus={selected.restoreFocus}
      onSavedChange={(saved, note) => {
        setSavedOverrides((current) => ({
          ...current,
          [selected.player.puuid]: { saved, note },
        }));
        setSelected((current) =>
          current
            ? {
                ...current,
                player: { ...current.player, saved, savedNote: note },
              }
            : current
        );
      }}
      onClose={() => setSelected(null)}
    />
  ) : null;

  if (menus) {
    return (
      <div data-testid="live-view" className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-2" data-live-state="menus">
        <MatchHeader board={board} />
        {board.recap && <RecapCard recap={board.recap} />}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px] items-stretch gap-2">
          <TeamPanel
            label="Your party"
            accent="victory"
            players={ally}
            stats={allyId ? board.teamStats?.[allyId] : undefined}
            parties={board.parties ?? []}
            partyDetection={allyId ? board.partyDetection?.teams?.[allyId] : undefined}
            savedOverrides={savedOverrides}
            pregame={false}
            lobby
            onSelect={(player, restoreFocus) => setSelected({ player, accountPuuid, restoreFocus })}
            recentDetailsByPlayer={recentDetailsByPlayer}
            onRequestRecentDetails={onRequestRecentDetails}
            testId="ally-team-panel"
          />
          <div className="flex min-h-0 flex-col gap-2">
            <LobbyQueueCard queue={board.queue} />
          </div>
        </div>
        {drawer}
      </div>
    );
  }

  return (
    <div
      data-testid="live-view"
      className="live-view flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-2"
      data-live-state={board.state}
    >
      <MatchHeader board={board} />

      <div
        className={`matchup-board grid min-h-0 flex-1 items-stretch ${
          enemy.length > 0 || pregame ? "grid-cols-2" : "grid-cols-1"
        }`}
        data-testid="matchup-board"
      >
        <TeamPanel
          label="Your team"
          accent="victory"
          players={ally}
          stats={allyId ? board.teamStats?.[allyId] : undefined}
          parties={board.parties ?? []}
          partyDetection={allyId ? board.partyDetection?.teams?.[allyId] : undefined}
          savedOverrides={savedOverrides}
          pregame={pregame}
          onSelect={(player, restoreFocus) => setSelected({ player, accountPuuid, restoreFocus })}
          recentDetailsByPlayer={recentDetailsByPlayer}
          onRequestRecentDetails={onRequestRecentDetails}
          testId="ally-team-panel"
        />
        {enemy.length > 0 ? (
          <TeamPanel
            label="Enemy team"
            accent="defeat"
            players={enemy}
            stats={enemyId ? board.teamStats?.[enemyId] : undefined}
            parties={board.parties ?? []}
            partyDetection={enemyId ? board.partyDetection?.teams?.[enemyId] : undefined}
            savedOverrides={savedOverrides}
            pregame={pregame}
            onSelect={(player, restoreFocus) => setSelected({ player, accountPuuid, restoreFocus })}
            recentDetailsByPlayer={recentDetailsByPlayer}
            onRequestRecentDetails={onRequestRecentDetails}
            testId="enemy-team-panel"
          />
        ) : (
          pregame && (
            <div
              data-testid="enemy-hidden-panel"
              className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-edge bg-panel/40 text-text-muted"
            >
              <LockKeyhole size={22} className="mb-1 text-text-muted" />
              <div className="font-display text-[13px] font-bold uppercase tracking-[0.1em] text-text-secondary">
                Enemy team hidden
              </div>
              <div className="text-[12px] text-text-muted">Revealed once the match starts</div>
            </div>
          )
        )}
      </div>

      {drawer}
    </div>
  );
}
