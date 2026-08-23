import { Fragment, useMemo, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Pencil, Save, Search, Trash2 } from "lucide-react";
import { ApiError, backend } from "../../api/client";
import type { SavedPlayer } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { usePoll } from "../../hooks/usePoll";
import { timeAgo } from "../../lib/format";

export function EncountersView() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const { data, error, loading, refresh } = usePoll(() => backend.savedPlayers(), null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data?.players ?? [];
    return (data?.players ?? []).filter((player) =>
      `${player.name ?? ""} ${player.note}`.toLowerCase().includes(q));
  }, [data, query]);

  const mutate = async (player: SavedPlayer, saved: boolean, note: string) => {
    if (!data?.accountPuuid) return;
    setBusy(player.puuid);
    setMutationError(null);
    try {
      await backend.updateSavedPlayer(player.puuid, {
        accountPuuid: data.accountPuuid,
        saved,
        note,
      });
      setEditing(null);
      refresh();
    } catch (err) {
      setMutationError(err instanceof ApiError ? err.message : "Could not update this player.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="p-5"><TableSkeleton rows={6} /></div>;
  }

  return (
    <div className="space-y-4 p-5" data-testid="saved-players-view">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="font-display text-2xl font-black italic uppercase tracking-tight">Saved Players</h1>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Notes stay on this PC. Encounter history updates whenever you meet a saved player again.
          </p>
        </div>
        <label className="relative ml-auto">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or note…"
            className="w-56 rounded-sm border border-edge bg-panel py-1.5 pl-7 pr-2 text-[12px] text-zinc-200 placeholder:text-zinc-600"
          />
        </label>
      </div>

      {(error || mutationError) && (
        <ErrorBanner
          message={mutationError ?? error ?? "Unknown error"}
          onRetry={() => { setMutationError(null); refresh(); }}
          testId="saved-players-error"
        />
      )}

      {!error && rows.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved players"
          message="Open a player from Live Match, add a note, and choose Save player. Their past and future encounters will appear here."
          testId="saved-players-empty"
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-edge bg-card">
          <table className="w-full min-w-[860px] text-[12px]" data-testid="saved-players-table">
            <thead>
              <tr className="border-b border-edge text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="py-2 pl-3 text-left font-medium">Player</th>
                <th className="text-left font-medium">Your note</th>
                <th className="text-right font-medium">With you</th>
                <th className="text-right font-medium">Against</th>
                <th className="text-right font-medium">Completed</th>
                <th className="text-right font-medium">Last seen</th>
                <th className="pr-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((player) => {
                const timeline = player.timeline ?? [];
                const completed = (player.winsWith ?? 0) + (player.lossesWith ?? 0) +
                  (player.winsAgainst ?? 0) + (player.lossesAgainst ?? 0);
                const isEditing = editing === player.puuid;
                const isExpanded = expanded === player.puuid;
                return (
                  <Fragment key={player.puuid}>
                    <tr className="border-b border-edge/60 transition-colors hover:bg-zinc-800/35">
                      <td className="py-2.5 pl-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <AgentAvatar portrait={player.topAgentPortrait} name={player.topAgent ?? player.name} color={player.topAgentColor ?? undefined} size={28} />
                          <span className="min-w-0">
                            <span className="block max-w-[180px] truncate font-semibold text-zinc-100">
                              {player.name ?? player.puuid.slice(0, 8)}
                            </span>
                            <span className="text-[9px] text-zinc-600">Saved {timeAgo(player.savedAt)}</span>
                          </span>
                        </span>
                      </td>
                      <td className="max-w-[320px] py-2 pr-4">
                        {isEditing ? (
                          <textarea
                            autoFocus
                            value={draft}
                            maxLength={500}
                            onChange={(event) => setDraft(event.target.value)}
                            className="min-h-14 w-full resize-y rounded-sm border border-amber-400/40 bg-ink px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none"
                          />
                        ) : (
                          <span className="block truncate text-zinc-400" title={player.note}>
                            {player.note || "No note"}
                          </span>
                        )}
                      </td>
                      <td className="text-right num text-zinc-300">{player.withCount ?? 0}×</td>
                      <td className="text-right num text-zinc-300">{player.againstCount ?? 0}×</td>
                      <td className="text-right num">
                        <span className="text-victory">{(player.winsWith ?? 0) + (player.winsAgainst ?? 0)}W</span>
                        <span className="text-zinc-600">–</span>
                        <span className="text-defeat">{(player.lossesWith ?? 0) + (player.lossesAgainst ?? 0)}L</span>
                        <span className="ml-1 text-zinc-600">({completed})</span>
                      </td>
                      <td className="text-right num text-zinc-500">{timeAgo(player.lastSeen)}</td>
                      <td className="pr-3 text-right">
                        <span className="inline-flex items-center gap-1">
                          {isEditing ? (
                            <button
                              type="button"
                              disabled={busy === player.puuid}
                              onClick={() => void mutate(player, true, draft)}
                              title="Save note"
                              className="rounded-sm border border-edge p-1.5 text-amber-300 hover:bg-zinc-800 disabled:opacity-50"
                            >
                              <Save size={12} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setEditing(player.puuid); setDraft(player.note); }}
                              title="Edit note"
                              className="rounded-sm border border-edge p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpanded(isExpanded ? null : player.puuid)}
                            title="Encounter games"
                            className="rounded-sm border border-edge p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          <button
                            type="button"
                            disabled={busy === player.puuid}
                            onClick={() => void mutate(player, false, "")}
                            title="Remove saved player"
                            className="rounded-sm border border-edge p-1.5 text-zinc-500 hover:bg-defeat/10 hover:text-defeat disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-edge/60 bg-ink/40">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Encounter games</div>
                          {timeline.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {[...timeline].reverse().map((item) => (
                                <span key={item.matchId} className="rounded-sm border border-edge bg-panel px-2 py-1 text-[10px] text-zinc-400">
                                  <span className={item.result === "win" ? "text-victory" : item.result === "loss" ? "text-defeat" : "text-zinc-500"}>
                                    {item.result === "win" ? "W" : item.result === "loss" ? "L" : "–"}
                                  </span>
                                  {` · ${item.side === "with" ? "with" : "against"}`}
                                  {item.map ? ` · ${item.map}` : ""}
                                  {item.agent ? ` · ${item.agent}` : ""}
                                  {` · ${timeAgo(item.at)}`}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-zinc-600">The current match is recorded. Its result appears here after the match ends.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
