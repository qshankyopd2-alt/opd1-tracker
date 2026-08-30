import { Fragment, useEffect, useMemo, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Pencil, RotateCw, Save, Search, Trash2, X } from "lucide-react";
import { ApiError, backend } from "../../api/client";
import type { SavedPlayer } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { PageHeader } from "../../components/shell/PageHeader";
import { usePoll } from "../../hooks/usePoll";
import { timeAgo } from "../../lib/format";

const designModeEnabled = import.meta.env.DEV && import.meta.env.VITE_DESIGN_MODE === "true";

export function EncountersView() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const { data, error, loading, refresh } = usePoll(() => backend.savedPlayers(), null);

  useEffect(() => {
    if (!designModeEnabled) return;
    const refreshPreview = () => refresh();
    window.addEventListener("opd1:design-view", refreshPreview);
    return () => window.removeEventListener("opd1:design-view", refreshPreview);
  }, [refresh]);

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
      <PageHeader title="Saved Players">
        <label className="relative ml-auto">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or note…"
            className="w-56 rounded-sm border border-edge bg-panel py-1.5 pl-7 pr-2 text-[12px] text-zinc-200 placeholder:text-zinc-600"
          />
        </label>
        <button
          data-testid="saved-players-refresh-button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 border border-edge rounded-sm px-2.5 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          <RotateCw size={12} /> Refresh
        </button>
      </PageHeader>
      <div className="flex flex-wrap items-end gap-3 -mt-6 mb-4">
        <p className="text-[11px] text-zinc-500">
          Notes stay on this PC. Encounter history updates whenever you meet a saved player again.
        </p>
      </div>

      {(error || mutationError) && (
        <ErrorBanner
          message={mutationError ?? error ?? "Unknown error"}
          onRetry={() => { setMutationError(null); refresh(); }}
          testId="saved-players-error"
        />
      )}

      {!error && rows.length === 0 ? (
        <div className="mt-8 rounded-md border border-edge bg-card/50 p-8">
          <EmptyState
            icon={Bookmark}
            title="No saved players"
            message="Open a player from Live Match, add a note, and choose Save player. Their past and future encounters will appear here."
            testId="saved-players-empty"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-edge bg-card">
          <table className="w-full min-w-[860px] text-[12px]" data-testid="saved-players-table">
            <thead>
              <tr className="border-b border-edge text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="py-2 pl-3 text-left font-medium">Player</th>
                <th className="text-left font-medium">Your note</th>
                <th className="text-right font-medium">Stats</th>
                <th className="text-right font-medium">Encounters</th>
                <th className="pr-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((player) => {
                const timeline = player.timeline ?? [];
                const isEditing = editing === player.puuid;
                const isExpanded = expanded === player.puuid;
                return (
                  <Fragment key={player.puuid}>
                    <tr className="border-b border-edge/60 transition-colors hover:bg-zinc-800/35 group/row">
                      <td className="py-2.5 pl-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <AgentAvatar portrait={player.topAgentPortrait} name={player.topAgent ?? player.name} color={player.topAgentColor ?? undefined} size={32} />
                          <span className="min-w-0">
                            <span className="block max-w-[180px] truncate font-semibold text-zinc-100">
                              {player.name ?? player.puuid.slice(0, 8)}
                            </span>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                              <span>Seen {timeAgo(player.lastSeen)}</span>
                              <span className="text-zinc-700">&middot;</span>
                              <span>Saved {timeAgo(player.savedAt)}</span>
                            </span>
                            {(player.agents ?? []).length > 0 && (
                              <span className="block text-[10px] text-zinc-500 truncate mt-0.5 max-w-[180px]">
                                {(player.agents ?? []).slice(0, 3).join(", ")}
                              </span>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="max-w-[280px] py-2 pr-4 align-top">
                        {isEditing ? (
                          <textarea
                            autoFocus
                            value={draft}
                            maxLength={500}
                            placeholder="Add a note about this player..."
                            aria-label="Player note"
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                setEditing(null);
                              } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                                event.preventDefault();
                                void mutate(player, true, draft);
                              }
                            }}
                            className="min-h-16 w-full resize-y rounded-sm border border-amber-400/40 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-200 focus-visible:ring-1 focus-visible:ring-amber-400/60"
                          />
                        ) : (
                          <div
                            onClick={() => { setEditing(player.puuid); setDraft(player.note); }}
                            className="group/note cursor-pointer rounded-sm px-2 py-1.5 hover:bg-zinc-800/50 min-h-10 relative"
                            title="Click to edit note"
                          >
                            <span className="block text-zinc-400 text-[11px] leading-relaxed pr-6 line-clamp-3">
                              {player.note || <span className="text-zinc-600 italic">Add a note...</span>}
                            </span>
                            <Pencil size={10} className="absolute right-2 top-2 text-zinc-500 opacity-0 group-hover/note:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>
                      <td className="text-right num text-[11px] text-zinc-400 py-2 align-middle">
                        <div className="flex flex-col items-end gap-0.5">
                          <div>KD: <span className="text-zinc-200 font-medium">{player.withKd?.toFixed(2) ?? "—"}</span></div>
                          <div>ACS: <span className="text-zinc-200 font-medium">{player.withAcs ? Math.round(player.withAcs) : "—"}</span></div>
                          <div>HS: <span className="text-zinc-200 font-medium">{player.withHsPct ? Math.round(player.withHsPct) + "%" : "—"}</span></div>
                        </div>
                      </td>
                      <td className="text-right num py-2 align-middle">
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-[11px]">
                            <span className="text-zinc-300 font-medium">{player.withCount ?? 0}</span> <span className="text-zinc-500">with</span>
                            <span className="text-zinc-600 mx-1">/</span>
                            <span className="text-zinc-300 font-medium">{player.againstCount ?? 0}</span> <span className="text-zinc-500">against</span>
                          </div>
                          <div className="text-[10px] bg-panel border border-edge rounded px-1.5 py-0.5">
                            <span className="text-victory font-medium">{(player.winsWith ?? 0) + (player.winsAgainst ?? 0)}W</span>
                            <span className="text-zinc-600 mx-1">–</span>
                            <span className="text-defeat font-medium">{(player.lossesWith ?? 0) + (player.lossesAgainst ?? 0)}L</span>
                          </div>
                        </div>
                      </td>
                      <td className="pr-3 text-right align-middle">
                        <span className="inline-flex items-center gap-0.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={busy === player.puuid}
                                onClick={() => void mutate(player, true, draft)}
                                title="Save note (Ctrl+Enter)"
                                aria-label="Save note"
                                className="rounded-sm p-1.5 text-amber-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                title="Cancel editing (Esc)"
                                aria-label="Cancel editing"
                                className="rounded-sm p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setEditing(player.puuid); setDraft(player.note); }}
                              title="Edit note"
                              aria-label="Edit note"
                              className="rounded-sm p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpanded(isExpanded ? null : player.puuid)}
                            title="Encounter games"
                            aria-label={isExpanded ? "Collapse encounter games" : "Expand encounter games"}
                            className="rounded-sm p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button
                            type="button"
                            disabled={busy === player.puuid}
                            onClick={() => void mutate(player, false, "")}
                            title="Remove saved player"
                            aria-label="Remove saved player"
                            className="rounded-sm p-1.5 text-zinc-500 hover:bg-defeat/10 hover:text-defeat disabled:opacity-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-edge/60 bg-ink/40">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Encounter Timeline</div>
                            <div className="text-[10px] text-zinc-600">Showing last {timeline.length} matches</div>
                          </div>
                          {timeline.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {[...timeline].reverse().map((item) => (
                                <div key={item.matchId} className="flex items-center gap-2 rounded-sm border border-edge bg-panel px-2.5 py-2 text-[11px]">
                                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold ${
                                    item.result === "win" ? "bg-victory/10 text-victory" : item.result === "loss" ? "bg-defeat/10 text-defeat" : "bg-zinc-800 text-zinc-400"
                                  }`}>
                                    {item.result === "win" ? "W" : item.result === "loss" ? "L" : "–"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="font-medium text-zinc-200 capitalize truncate">{item.side}</span>
                                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">{timeAgo(item.at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 truncate mt-0.5">
                                      {item.map && <span>{item.map}</span>}
                                      {item.map && item.agent && <span className="text-zinc-700">&middot;</span>}
                                      {item.agent && <span>{item.agent}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-zinc-500 italic">The current match is recorded. Its result appears here after the match ends.</p>
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
