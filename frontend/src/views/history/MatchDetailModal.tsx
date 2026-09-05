import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ApiError, backend } from "../../api/client";
import type { DetailPlayer, MatchDetail, MatchMeta } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { Badge } from "../../components/ui/Badge";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { OutcomeBadge, normalizeOutcome } from "../../components/ui/OutcomeBadge";
import { fmtNum, fmtPct, scoreline } from "../../lib/format";
import { useApp } from "../../state/AppContext";

interface ExpectedMatch {
  map?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  acs?: number;
}

export interface MatchMetaDraft {
  note: string;
  tags: string;
  bookmarked: boolean;
}

function DetailTable({ players, accent, label }: { players: DetailPlayer[]; accent: string; label: string }) {
  return (
    <div className="border border-edge rounded-md overflow-hidden">
      <header className="flex items-center gap-2 border-b border-edge bg-panel px-3 py-2">
        <span className="w-1.5 h-3.5 rounded-[2px]" style={{ backgroundColor: accent }} />
        <span className="font-display text-[14px] font-semibold" style={{ color: accent }}>
          {label}
        </span>
      </header>
      <table className="w-full table-fixed text-[14px]">
        <colgroup>
          <col className="w-auto" />
          <col className="w-[84px]" />
          <col className="w-[54px]" />
          <col className="w-[54px]" />
          <col className="w-[54px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-edge text-[12px] text-zinc-400">
            <th className="py-2 pl-3 text-left font-semibold">Player</th>
            <th className="text-right font-semibold">K / D / A</th>
            <th className="text-right font-semibold">K/D</th>
            <th className="text-right font-semibold">ACS</th>
            <th className="pr-3 text-right font-semibold">HS%</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr
              key={p.puuid}
              className={`border-b border-edge last:border-b-0 ${p.isSubject ? "bg-brand/5" : ""}`}
              data-testid={`detail-player-${p.puuid}`}
            >
              <td className="py-2 pl-3 truncate min-w-0">
                <span className="flex items-center gap-2 min-w-0">
                  <AgentAvatar portrait={p.agentPortrait} name={p.agent} color={p.agentColor} size={24} />
                  {p.rankIcon && <img src={p.rankIcon} alt={p.rank} title={p.rank} className="w-4 h-4 shrink-0" loading="lazy" />}
                  <span className={`truncate font-semibold ${p.isSubject ? "text-brand" : "text-zinc-200"}`} title={p.name}>{p.name}</span>
                  {p.isMatchMvp && <Badge color="#FBBF24" filled>MVP</Badge>}
                  {p.isTeamMvp && !p.isMatchMvp && <Badge color="#A1A1AA">Team MVP</Badge>}
                </span>
              </td>
              <td className="text-right text-zinc-300 tabular-nums">
                {p.kills}/{p.deaths}/{p.assists}
              </td>
              <td className="text-right text-zinc-300 tabular-nums">{fmtNum(p.kd, 2)}</td>
              <td className="text-right font-semibold text-zinc-200 tabular-nums">{p.acs}</td>
              <td className="pr-3 text-right text-zinc-400 tabular-nums">{fmtPct(p.hsPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetaEditor({
  matchId,
  meta,
  draft,
  onDraftChange,
  onSaved,
}: {
  matchId: string;
  meta: MatchMeta | undefined;
  draft?: MatchMetaDraft;
  onDraftChange?: (draft: MatchMetaDraft) => void;
  onSaved: (m: MatchMeta) => void;
}) {
  const [note, setNote] = useState(() => draft?.note ?? meta?.note ?? "");
  const [tags, setTags] = useState(() => draft?.tags ?? (meta?.tags ?? []).join(", "));
  const [bookmarked, setBookmarked] = useState(() => draft?.bookmarked ?? meta?.bookmarked ?? false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setNote(draft?.note ?? meta?.note ?? "");
    setTags(draft?.tags ?? (meta?.tags ?? []).join(", "));
    setBookmarked(draft?.bookmarked ?? meta?.bookmarked ?? false);
  }, [matchId, meta, draft]);

  const handleNoteChange = (val: string) => {
    setMsg(null);
    setNote(val);
    onDraftChange?.({ note: val, tags, bookmarked });
  };
  const handleTagsChange = (val: string) => {
    setMsg(null);
    setTags(val);
    onDraftChange?.({ note, tags: val, bookmarked });
  };
  const handleBookmarkToggle = () => {
    setMsg(null);
    const next = !bookmarked;
    setBookmarked(next);
    onDraftChange?.({ note, tags, bookmarked: next });
  };

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await backend.updateMatchMeta(matchId, {
        note,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        bookmarked,
      });
      if (res.ok) {
        setMsg("Saved.");
        onSaved(res.meta);
      } else {
        setMsg("Couldn't save — is VALORANT running?");
      }
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-edge rounded-md p-3 space-y-2" data-testid="match-meta-editor">
      <div className="flex items-center gap-2">
        <h4 className="flex-1 text-[12px] font-semibold text-zinc-300">Match notes</h4>
        <button
          type="button"
          data-testid="meta-bookmark-toggle"
          disabled={busy}
          onClick={handleBookmarkToggle}
          className={`inline-flex items-center gap-1 rounded-sm border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
            bookmarked ? "border-amber-400 text-amber-300 bg-amber-400/10" : "border-edge text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          <Bookmark size={11} /> {bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
      <label htmlFor="match-notes" className="block text-[12px] font-semibold text-white/70">Notes</label>
      <textarea id="match-notes"
        data-testid="meta-note-input"
        disabled={busy}
        value={note}
        onChange={(e) => handleNoteChange(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="What happened this game?"
        className="w-full bg-panel border border-edge rounded-sm px-2 py-1.5 text-[12px] text-zinc-200 placeholder:text-zinc-500 resize-none"
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label htmlFor="match-tags" className="col-span-2 text-[12px] font-semibold text-white/70">Tags</label>
        <input id="match-tags"
          data-testid="meta-tags-input"
          disabled={busy}
          value={tags}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="e.g. clutch, ace, throw"
          className="flex-1 bg-panel border border-edge rounded-sm px-2 py-1.5 text-[12px] text-zinc-200 placeholder:text-zinc-500"
        />
        <button
          type="button"
          data-testid="meta-save-button"
          disabled={busy}
          onClick={save}
          className="rounded-sm bg-brand px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {msg && <p role="status" data-testid="meta-save-status" className="text-[12px] text-zinc-300">{msg}</p>}
    </div>
  );
}

export function MatchDetailContent({
  matchId,
  subject,
  expected,
  meta,
  draft,
  onDraftChange,
  onMetaSaved,
  onClose,
  onBack,
  isEmbedded,
}: {
  matchId: string;
  subject: string | null;
  expected?: ExpectedMatch;
  meta: MatchMeta | undefined;
  draft?: MatchMetaDraft;
  onDraftChange?: (draft: MatchMetaDraft) => void;
  onMetaSaved: (id: string, m: MatchMeta) => void;
  onClose: () => void;
  onBack?: () => void;
  isEmbedded?: boolean;
}) {
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { health } = useApp();
  const clientOffline = health != null && health.clientStatus !== "ok";

  const expectedMap = expected?.map;
  const expectedKills = expected?.kills;
  const expectedDeaths = expected?.deaths;
  const expectedAssists = expected?.assists;
  const expectedAcs = expected?.acs;

  useEffect(() => {
    setDetail(null);
    setError(null);
    if (clientOffline) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let alive = true;
    backend
      .match(matchId, subject)
      .then((d) => {
        if (!alive) return;
        const subjectPlayer = d.players?.find((player) => player.isSubject);
        const mismatched = Boolean(
          (expectedMap && d.map !== expectedMap) ||
          (expectedKills !== undefined && subjectPlayer?.kills !== expectedKills) ||
          (expectedDeaths !== undefined && subjectPlayer?.deaths !== expectedDeaths) ||
          (expectedAssists !== undefined && subjectPlayer?.assists !== expectedAssists) ||
          (expectedAcs !== undefined && subjectPlayer?.acs !== expectedAcs),
        );
        if (d.error) setError(d.error);
        else if (mismatched) setError("Match details are unavailable from Riot right now.");
        else setDetail(d);
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load match."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [matchId, subject, expectedMap, expectedKills, expectedDeaths, expectedAssists, expectedAcs, clientOffline]);

  const subjectTeam = detail?.players.find((p) => p.isSubject)?.team ?? null;
  const teams = detail ? Array.from(new Set(detail.players.map((p) => p.team))) : [];
  const orderedTeams = subjectTeam ? [subjectTeam, ...teams.filter((t) => t !== subjectTeam)] : teams;

  return (
    <div className={`relative flex flex-col min-h-0 w-full bg-[var(--bg-panel)] overflow-hidden ${isEmbedded ? "flex-1" : "h-full"}`}>
      {/* header */}
      <div className="relative border-b border-[var(--border-subtle)] overflow-hidden shrink-0">
        {detail?.mapSplash && (
          <img src={detail.mapSplash} alt="" className="absolute inset-y-0 right-0 w-1/2 h-full object-cover" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel to-transparent" />
        <div className="relative flex items-center gap-4 p-4">
          {isEmbedded && onBack && (
            <button
              autoFocus
              type="button"
              onClick={onBack}
              aria-label="Back to match list"
              title="Back to match list"
              data-testid="match-detail-back"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] focus-visible:ring-2 focus-visible:ring-[var(--accent-info)] cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <div className="text-[12px] font-semibold text-zinc-400">{detail?.mode ?? "Match"}</div>
            <Dialog.Title id="match-detail-title" className="font-display text-[28px] font-semibold leading-tight text-white">{detail?.map ?? "Match details"}</Dialog.Title>
          </div>
          {detail && (
            <OutcomeBadge size="lg" outcome={normalizeOutcome(detail.result)} score={scoreline(detail.scores, subjectTeam)} />
          )}
          <button
            type="button"
            aria-label="Close"
            data-testid="match-detail-close"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] focus-visible:ring-2 focus-visible:ring-[var(--accent-info)] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {clientOffline && (
          <div
            className="border border-amber-500/40 bg-amber-500/10 rounded-sm px-3 py-2.5 text-[12px] text-amber-200"
            data-testid="match-detail-offline"
          >
            VALORANT is closed — match details are only available while the game is running.
          </div>
        )}
        {loading && <TableSkeleton rows={6} />}
        {error && <ErrorBanner message={error} testId="match-detail-error" />}
        <div className="match-detail-teams">
        {detail &&
          orderedTeams.map((teamId) => (
            <DetailTable
              key={teamId}
              players={detail.players.filter((p) => p.team === teamId)}
              accent={teamId === subjectTeam ? "var(--accent-team-a)" : subjectTeam ? "var(--accent-team-b)" : "var(--text-secondary)"}
              label={
                subjectTeam
                  ? teamId === subjectTeam
                    ? "Your team"
                    : "Enemy team"
                  : `Team ${teamId}`
              }
            />
          ))}
        </div>
        {!loading && !error && !clientOffline && (
          <MetaEditor
            matchId={matchId}
            meta={meta}
            draft={draft}
            onDraftChange={onDraftChange}
            onSaved={(m) => onMetaSaved(matchId, m)}
          />
        )}
      </div>
    </div>
  );
}

export function MatchDetailModal({
  matchId,
  subject,
  expected,
  meta,
  onMetaSaved,
  onClose,
  restoreFocus,
}: {
  matchId: string;
  subject: string | null;
  expected?: ExpectedMatch;
  meta: MatchMeta | undefined;
  onMetaSaved: (id: string, m: MatchMeta) => void;
  onClose: () => void;
  restoreFocus?: HTMLElement | null;
}) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><div className="modal-backdrop z-[70] p-6" data-testid="match-detail-modal">
      <Dialog.Overlay className="absolute inset-0 bg-black/70" data-testid="match-detail-backdrop" />
      <Dialog.Content
        aria-labelledby="match-detail-title"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => { event.preventDefault(); if (restoreFocus?.isConnected) restoreFocus.focus(); }}
        className="relative max-h-[85vh] h-[85vh] w-full max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-2xl focus-visible:outline-none flex flex-col overflow-hidden"
      >
        <MatchDetailContent
          matchId={matchId}
          subject={subject}
          expected={expected}
          meta={meta}
          onMetaSaved={onMetaSaved}
          onClose={onClose}
        />
      </Dialog.Content>
    </div></Dialog.Portal></Dialog.Root>
  );
}
