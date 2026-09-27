import { useEffect, useMemo, useState } from "react";
import { Bookmark, ChevronDown, Pencil, RotateCw, Save, Search, Trash2 } from "lucide-react";
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

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="micro-label">{label}</span>
      <span className="num font-display text-[14px] font-bold text-text-primary tabular-nums">{value}</span>
    </div>
  );
}

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
      <PageHeader title="Saved players">
        <label className="relative ml-auto">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            aria-label="Search saved players"
            data-testid="saved-players-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or note…"
            className="w-56 rounded-sm border border-edge bg-inset py-1.5 pl-7 pr-2 text-[12px] text-text-secondary placeholder:text-text-muted"
          />
        </label>
        <button
          data-testid="saved-players-refresh-button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 border border-edge rounded-sm px-2.5 py-1.5 text-[12px] font-bold text-text-muted hover:bg-card transition-colors"
        >
          <RotateCw size={12} /> Refresh
        </button>
      </PageHeader>
      <p className="text-[12px] text-text-secondary">
        Notes stay on this PC. Encounter history updates whenever you meet a saved player again.
      </p>

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
        <div className="space-y-2" data-testid="saved-players-table">
          {rows.map((player) => {
            const timeline = player.timeline ?? [];
            const isEditing = editing === player.puuid;
            const isExpanded = expanded === player.puuid;
            const wins = (player.winsWith ?? 0) + (player.winsAgainst ?? 0);
            const losses = (player.lossesWith ?? 0) + (player.lossesAgainst ?? 0);
            return (
              <article key={player.puuid} className="saved-player-card group/row">
                <div className="saved-player-main">
                  {/* Identity */}
                  <div className="flex min-w-0 items-start gap-3">
                    <AgentAvatar portrait={player.topAgentPortrait} name={player.topAgent ?? player.name} color={player.topAgentColor ?? undefined} size={40} />
                    <div className="min-w-0">
                      <div className="truncate font-display text-[15px] font-bold text-text-primary">
                        {player.name ?? player.puuid.slice(0, 8)}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-text-muted">
                        <span>Seen {timeAgo(player.lastSeen)}</span>
                        <span aria-hidden="true">·</span>
                        <span>Saved {timeAgo(player.savedAt)}</span>
                      </div>
                      {(player.agents ?? []).length > 0 && (
                        <div className="mt-1 truncate text-[11.5px] text-text-muted" title={(player.agents ?? []).join(", ")}>
                          {(player.agents ?? []).slice(0, 3).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  <div className="min-w-0 flex-1 border-l border-edge pl-4">
                    {isEditing ? (
                      <textarea
                        aria-label={`Note for ${player.name ?? "saved player"}`}
                        data-testid={`saved-player-note-${player.puuid}`}
                        autoFocus
                        value={draft}
                        maxLength={500}
                        onChange={(event) => setDraft(event.target.value)}
                        className="min-h-16 w-full resize-y rounded-sm border border-edge bg-inset px-2.5 py-1.5 text-[12px] text-text-secondary focus-visible:ring-1 focus-visible:ring-brand"
                      />
                    ) : (
                      <button
                        type="button"
                        aria-label={`Edit note for ${player.name ?? "saved player"}`}
                        data-testid={`saved-player-note-open-${player.puuid}`}
                        onClick={() => { setEditing(player.puuid); setDraft(player.note); }}
                        className="group/note relative min-h-10 w-full rounded-sm px-2 py-1.5 text-left hover:bg-card-hover"
                        title="Click to edit note"
                      >
                        <span className="block text-text-muted text-[12px] leading-relaxed pr-6 line-clamp-3">
                          {player.note || "Add a note…"}
                        </span>
                        <Pencil size={10} className="absolute right-2 top-2 text-text-muted opacity-0 group-hover/note:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>

                  {/* Your stats in matches with them */}
                  <div className="flex shrink-0 flex-col gap-1.5 border-l border-edge pl-4">
                    <StatCell label="K/D · with them" value={player.withKd?.toFixed(2) ?? "—"} />
                    <StatCell label="ACS" value={player.withAcs ? String(Math.round(player.withAcs)) : "—"} />
                    <StatCell label="HS%" value={player.withHsPct ? `${Math.round(player.withHsPct)}%` : "—"} />
                  </div>

                  {/* Encounters */}
                  <div className="flex shrink-0 flex-col gap-1.5 border-l border-edge pl-4">
                    <div className="flex items-center gap-3">
                      <StatCell label="With" value={String(player.withCount ?? 0)} />
                      <StatCell label="Against" value={String(player.againstCount ?? 0)} />
                    </div>
                    <div className="num font-display text-[13px] font-bold">
                      <span className="text-victory">{wins}W</span>
                      <span className="text-text-muted">–</span>
                      <span className="text-defeat">{losses}L</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-start justify-end gap-0.5 opacity-70 group-hover/row:opacity-100 transition-opacity">
                    {isEditing ? (
                      <button
                        type="button"
                        disabled={busy === player.puuid}
                        onClick={() => void mutate(player, true, draft)}
                        title="Save note"
                        aria-label="Save note"
                        data-testid={`saved-player-save-${player.puuid}`}
                        className="rounded-sm p-1.5 text-text-primary hover:bg-card-hover disabled:opacity-50 transition-colors"
                      >
                        <Save size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditing(player.puuid); setDraft(player.note); }}
                        title="Edit note"
                        aria-label="Edit note"
                        data-testid={`saved-player-edit-${player.puuid}`}
                        className="rounded-sm p-1.5 text-text-muted hover:bg-card-hover hover:text-text-primary transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : player.puuid)}
                      title="Encounter games"
                      aria-label={isExpanded ? "Collapse encounter games" : "Expand encounter games"}
                      aria-expanded={isExpanded}
                      data-testid={`saved-player-expand-${player.puuid}`}
                      className="rounded-sm p-1.5 text-text-muted hover:bg-card-hover hover:text-text-primary transition-colors"
                    >
                      <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      type="button"
                      disabled={busy === player.puuid}
                      onClick={() => void mutate(player, false, "")}
                      title="Remove saved player"
                      aria-label="Remove saved player"
                      data-testid={`saved-player-remove-${player.puuid}`}
                      className="rounded-sm p-1.5 text-text-muted hover:bg-defeat/10 hover:text-defeat disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-edge px-4 py-4" data-testid={`saved-player-timeline-${player.puuid}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="micro-label flex items-center gap-2">
                        <span className="section-tick" aria-hidden="true" /> Encounter history
                      </div>
                      <div className="text-[11.5px] text-text-muted">Last {timeline.length} matches</div>
                    </div>
                    {timeline.length ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                        {[...timeline].reverse().map((item) => (
                          <div key={item.matchId} className="flex items-center gap-2 rounded-sm border border-edge bg-inset px-2.5 py-2 text-[12px]">
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-display text-[11px] font-bold ${
                                item.result === "win" ? "bg-victory/10 text-victory" : item.result === "loss" ? "bg-defeat/10 text-defeat" : "bg-card-hover text-text-secondary"
                              }`}
                            >
                              {item.result === "win" ? "W" : item.result === "loss" ? "L" : "–"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-text-primary capitalize">{item.side}</span>
                                <span className="text-[11.5px] text-text-muted whitespace-nowrap">{timeAgo(item.at)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11.5px] text-text-muted truncate mt-0.5">
                                {item.map && <span>{item.map}</span>}
                                {item.map && item.agent && <span aria-hidden="true">·</span>}
                                {item.agent && <span>{item.agent}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-text-secondary">The current match is recorded. Its result appears here after the match ends.</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
