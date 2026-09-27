import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Star, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ApiError, backend } from "../../api/client";
import type { DetailPlayer, MatchDetail, MatchMeta } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
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

function MvpMark({ player }: { player: DetailPlayer }) {
  if (!player.isMatchMvp && !player.isTeamMvp) return null;
  return (
    <span className="flex shrink-0 items-center gap-1">
      {player.isMatchMvp && (
        <span
          className="inline-flex items-center gap-0.5 rounded-sm bg-gold px-1.5 py-px font-display text-[9px] font-bold uppercase tracking-[0.08em] text-ink"
          title="Match MVP — highest ACS of the game"
        >
          <Star size={8} fill="currentColor" /> MVP
        </span>
      )}
      {player.isTeamMvp && !player.isMatchMvp && (
        <span
          className="inline-flex items-center gap-0.5 rounded-sm border border-draw/50 bg-draw-subtle px-1.5 py-px font-display text-[9px] font-bold uppercase tracking-[0.08em] text-draw"
          title="Team MVP — highest ACS on this team"
        >
          <Star size={8} /> Team MVP
        </span>
      )}
    </span>
  );
}

function DetailTable({ players, accent, label, teamStats }: { players: DetailPlayer[]; accent: string; label: string; teamStats?: { avgRank: string; avgRankColor: string; rankIcon: string | null } }) {
  return (
    <div style={{ "--team-accent": accent } as React.CSSProperties}>
      <header className="detail-team-head" data-testid={`detail-team-head`}>
        <span className="font-display text-[12.5px] font-bold uppercase tracking-[0.1em] text-text-primary">{label}</span>
        {teamStats && (
          <span className="ml-auto flex items-center gap-1.5 text-[11.5px]" title="Average rank of this team">
            <span className="micro-label">Avg rank</span>
            {teamStats.rankIcon && (
              <img src={teamStats.rankIcon} alt="" className="h-[14px] w-[14px] object-contain" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            )}
            <span className="font-display font-bold" style={{ color: teamStats.avgRankColor }}>{teamStats.avgRank}</span>
          </span>
        )}
      </header>
      <div className="detail-team-table">
        <div
          className="detail-row border-b border-edge bg-inset/60 text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted"
          aria-hidden="true"
        >
          <span />
          <span>Player</span>
          <span>Rank</span>
          <span className="text-right">K / D / A</span>
          <span className="text-right">K/D</span>
          <span className="text-right">ACS</span>
          <span className="text-right">HS%</span>
        </div>
        {players.map((p) => (
          <div
            key={p.puuid}
            className={`detail-row ${p.isSubject ? "detail-row-subject" : ""} ${p.isMatchMvp ? "detail-row-mvp" : ""}`}
            data-testid={`detail-player-${p.puuid}`}
          >
            <AgentAvatar portrait={p.agentPortrait} name={p.agent} color={p.agentColor} size={28} />
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className={`truncate font-display text-[13px] font-bold ${p.isSubject ? "text-ally" : "text-text-primary"}`}
                title={p.name}
              >
                {p.name}
                {p.isSubject && <span className="ml-1 text-[9px] font-bold uppercase text-text-muted">· You</span>}
              </span>
              <MvpMark player={p} />
            </span>
            <span className="flex min-w-0 items-center gap-1.5" title={`${p.rank}${p.rr ? ` · ${p.rr} RR` : ""}`}>
              {p.rankIcon && (
                <img src={p.rankIcon} alt="" className="h-[16px] w-[16px] shrink-0 object-contain" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
              )}
              <span className="truncate font-display text-[11.5px] font-semibold" style={{ color: p.rankColor }}>
                {p.rank}
                {p.rr !== undefined && <span className="text-text-muted"> · {p.rr}</span>}
              </span>
            </span>
            <span className="num text-right font-display text-[13px] font-bold text-text-primary tabular-nums">
              {p.kills}/{p.deaths}/{p.assists}
            </span>
            <span className="num text-right font-display text-[13px] font-semibold text-text-secondary tabular-nums">{fmtNum(p.kd, 2)}</span>
            <span className="num text-right font-display text-[13px] font-semibold text-text-secondary tabular-nums">{p.acs}</span>
            <span className="num text-right font-mono text-[12.5px] text-text-muted tabular-nums">{fmtPct(p.hsPct)}</span>
          </div>
        ))}
      </div>
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
    <div className="border border-edge rounded-md bg-card p-3 space-y-2" data-testid="match-meta-editor">
      <div className="flex items-center gap-2">
        <h4 className="micro-label flex-1 flex items-center gap-2">
          <span className="section-tick" aria-hidden="true" /> Match notes
        </h4>
        <button
          type="button"
          data-testid="meta-bookmark-toggle"
          aria-pressed={bookmarked}
          disabled={busy}
          onClick={handleBookmarkToggle}
          className={`inline-flex items-center gap-1 rounded-sm border px-2.5 py-1.5 text-[11.5px] font-bold transition-colors ${
            bookmarked ? "border-gold/60 bg-gold-subtle text-gold" : "border-edge text-text-muted hover:bg-card-hover"
          }`}
        >
          <Bookmark size={11} fill={bookmarked ? "currentColor" : "none"} /> {bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
      <label htmlFor="match-notes" className="block micro-label">Notes</label>
      <textarea
        id="match-notes"
        data-testid="meta-note-input"
        disabled={busy}
        value={note}
        onChange={(e) => handleNoteChange(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="What happened this game?"
        className="w-full bg-inset border border-edge rounded-sm px-2 py-1.5 text-[12px] text-text-secondary placeholder:text-text-muted resize-none"
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label htmlFor="match-tags" className="col-span-2 micro-label">Tags</label>
        <input
          id="match-tags"
          data-testid="meta-tags-input"
          disabled={busy}
          value={tags}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="e.g. clutch, ace, throw"
          className="flex-1 bg-inset border border-edge rounded-sm px-2 py-1.5 text-[12px] text-text-secondary placeholder:text-text-muted"
        />
        <button
          type="button"
          data-testid="meta-save-button"
          disabled={busy}
          onClick={save}
          className="rounded-sm bg-brand px-3 text-[12px] font-bold text-ink transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {msg && (
        <p role="status" data-testid="meta-save-status" className="text-[12px] text-text-secondary">
          {msg}
        </p>
      )}
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
      {/* Header */}
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
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <div className="micro-label">{detail?.mode ?? "Match"}</div>
            <Dialog.Title id="match-detail-title" className="font-display text-[24px] font-bold uppercase tracking-[0.04em] leading-tight text-text-primary">
              {detail?.map ?? "Match details"}
            </Dialog.Title>
          </div>
          {detail && (
            <OutcomeBadge size="lg" outcome={normalizeOutcome(detail.result)} score={scoreline(detail.scores, subjectTeam)} />
          )}
          <button
            type="button"
            aria-label="Close match details"
            data-testid="match-detail-close"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {clientOffline && (
          <div
            className="border border-warn/40 bg-warn/10 rounded-sm px-3 py-2.5 text-[12px] text-warn"
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
                accent={teamId === subjectTeam ? "var(--ally)" : subjectTeam ? "var(--enemy)" : "var(--text-secondary)"}
                label={
                  subjectTeam
                    ? teamId === subjectTeam
                      ? "Your team"
                      : "Enemy team"
                    : `Team ${teamId}`
                }
                teamStats={detail.teamStats?.[teamId]}
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
        className="relative max-h-[85vh] h-[85vh] w-full max-w-3xl rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-2xl focus-visible:outline-none flex flex-col overflow-hidden"
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
