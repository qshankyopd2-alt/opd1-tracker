import { useEffect, useState } from "react";
import type { LivePlayer } from "../../api/types";
import { EyeOff } from "lucide-react";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useLiveData } from "../../state/LiveDataContext";
import { MatchHeader } from "./MatchHeader";
import { OfflineHero } from "./OfflineHero";
import { PlayerDrawer } from "./PlayerDrawer";
import { RecapCard } from "./RecapCard";
import { TeamPanel } from "./TeamPanel";
import { splitTeams } from "./teamSplit";

export function LiveView() {
  const { board, error, loading, showBoard, refresh } = useLiveData();
  const [selected, setSelected] = useState<{ player: LivePlayer; accountPuuid: string | null } | null>(null);
  const [savedOverrides, setSavedOverrides] = useState<Record<string, { saved: boolean; note: string }>>({});
  const accountPuuid = board?.selfPuuid ?? null;

  useEffect(() => {
    setSelected((current) => current && current.accountPuuid !== accountPuuid ? null : current);
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

  return (
    <div
      data-testid="live-view"
      className={menus ? "space-y-4 p-5" : "flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3"}
    >
      <MatchHeader board={board} />

      {menus && board.recap && <RecapCard recap={board.recap} />}

      <div className={`grid items-stretch gap-3 ${menus ? "" : "min-h-0 flex-1"} ${enemy.length > 0 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        <TeamPanel
          label={menus ? "Your Party" : "Your Team"}
          accent="#10B981"
          players={ally}
          stats={allyId ? board.teamStats?.[allyId] : undefined}
          parties={board.parties ?? []}
          partyDetection={allyId ? board.partyDetection?.teams?.[allyId] : undefined}
          savedOverrides={savedOverrides}
          pregame={pregame}
          onSelect={(player) => setSelected({ player, accountPuuid })}
          testId="ally-team-panel"
        />
        {enemy.length > 0 ? (
          <TeamPanel
            label="Enemy Team"
            accent="#EF4444"
            players={enemy}
            stats={enemyId ? board.teamStats?.[enemyId] : undefined}
            parties={board.parties ?? []}
            partyDetection={enemyId ? board.partyDetection?.teams?.[enemyId] : undefined}
            savedOverrides={savedOverrides}
            pregame={pregame}
            onSelect={(player) => setSelected({ player, accountPuuid })}
            testId="enemy-team-panel"
          />
        ) : (
          pregame && (
            <div
              data-testid="enemy-hidden-panel"
              className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-edge bg-panel/30 text-zinc-500"
            >
              <EyeOff size={24} className="text-zinc-600 mb-1" />
              <div className="text-[13px] font-semibold uppercase tracking-wider text-zinc-400">Enemy Team Hidden</div>
              <div className="text-[11px]">Revealed once the match starts</div>
            </div>
          )
        )}
      </div>

      {selected && (
        <PlayerDrawer
          player={selected.player}
          accountPuuid={selected.accountPuuid}
          onSavedChange={(saved, note) => {
            setSavedOverrides((current) => ({
              ...current,
              [selected.player.puuid]: { saved, note },
            }));
            setSelected((current) => current ? {
              ...current,
              player: { ...current.player, saved, savedNote: note },
            } : current);
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
