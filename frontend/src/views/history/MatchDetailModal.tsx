import { useEffect, useState } from "react";
import { Bookmark, X } from "lucide-react";
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

function DetailTable({ players, accent, label }: { players: DetailPlayer[]; accent: string; label: string }) {
  return (
    <div className="border border-edge rounded-md overflow-hidden">
      <header className="flex items-center gap-2 px-3 py-1.5 bg-panel border-b border-edge">
        <span className="w-1.5 h-3.5 rounded-[2px]" style={{ backgroundColor: accent }} />
        <span className="font-display font-bold uppercase text-[13px]" style={{ color: accent }}>
          {label}
        </span>
      </header>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-[9px] uppercase tracking-wider text-zinc-500 border-b border-edge/70">
            <th className="text-left font-medium py-1 pl-2">Player</th>
            <th className="text-right font-medium">K / D / A</th>
            <th className="text-right font-medium">K/D</th>
            <th className="text-right font-medium">ACS</th>
            <th className="text-right font-medium pr-2">HS%</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr
              key={p.puuid}
              className={`border-b border-edge/50 last:border-b-0 ${p.isSubject ? "bg-brand/5" : ""}`}
              data-testid={`detail-player-${p.puuid}`}
            >
              <td className="py-1.5 pl-2">
                <span className="flex items-center gap-2 min-w-0">
                  <AgentAvatar portrait={p.agentPortrait} name={p.agent} color={p.agentColor} size={24} />
                  {p.rankIcon && <img src={p.rankIcon} alt={p.rank} title={p.rank} className="w-4 h-4" loading="lazy" />}
                  <span className={`truncate font-semibold ${p.isSubject ? "text-brand" : "text-zinc-200"}`}>{p.name}</span>
                  {p.isMatchMvp && <Badge color="#FBBF24" filled>MVP</Badge>}
                  {p.isTeamMvp && !p.isMatchMvp && <Badge color="#A1A1AA">Team MVP</Badge>}
                </span>
              </td>
              <td className="text-right text-zinc-300 tabular-nums">
                {p.kills}/{p.deaths}/{p.assists}
              </td>
              <td className="text-right text-zinc-300 tabular-nums">{fmtNum(p.kd, 2)}</td>
              <td className="text-right font-semibold text-zinc-200 tabular-nums">{p.acs}</td>
              <td className="pr-2 text-right text-zinc-400 tabular-nums">{fmtPct(p.hsPct)}</td>
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
  onSaved,
}: {
  matchId: string;
  meta: MatchMeta | undefined;
  onSaved: (m: MatchMeta) => void;
}) {
  const [note, setNote] = useState(meta?.note ?? "");
  const [tags, setTags] = useState((meta?.tags ?? []).join(", "));
  const [bookmarked, setBookmarked] = useState(meta?.bookmarked ?? false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
        <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 flex-1">Notes</h4>
        <button
          data-testid="meta-bookmark-toggle"
          onClick={() => setBookmarked((b) => !b)}
          className={`inline-flex items-center gap-1 border rounded-sm px-2 py-1 text-[10px] uppercase tracking-wider font-semibold transition-colors ${
            bookmarked ? "border-amber-400 text-amber-300 bg-amber-400/10" : "border-edge text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          <Bookmark size={11} /> {bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
      <label htmlFor="match-notes" className="block text-[10px] font-semibold text-white/60">Notes</label>
      <textarea id="match-notes"
        data-testid="meta-note-input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="What happened this game?"
        className="w-full bg-panel border border-edge rounded-sm px-2 py-1.5 text-[12px] text-zinc-200 placeholder:text-zinc-600 resize-none"
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label htmlFor="match-tags" className="col-span-2 text-[10px] font-semibold text-white/60">Tags</label>
        <input id="match-tags"
          data-testid="meta-tags-input"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. clutch, ace, throw"
          className="flex-1 bg-panel border border-edge rounded-sm px-2 py-1.5 text-[12px] text-zinc-200 placeholder:text-zinc-600"
        />
        <button
          data-testid="meta-save-button"
          disabled={busy}
          onClick={save}
          className="bg-brand hover:bg-brand-hover text-ink rounded-sm px-3 text-[11px] uppercase tracking-wider font-bold transition-colors disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {msg && <p className="text-[11px] text-zinc-400">{msg}</p>}
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
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { health } = useApp();
  const clientOffline = health != null && health.clientStatus !== "ok";

  useEffect(() => {
    if (clientOffline) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    backend
      .match(matchId, subject)
      .then((d) => {
        if (!alive) return;
        const subjectPlayer = d.players?.find((player) => player.isSubject);
        const mismatched = Boolean(
          (expected?.map && d.map !== expected.map) ||
          (expected?.kills !== undefined && subjectPlayer?.kills !== expected.kills) ||
          (expected?.deaths !== undefined && subjectPlayer?.deaths !== expected.deaths) ||
          (expected?.assists !== undefined && subjectPlayer?.assists !== expected.assists) ||
          (expected?.acs !== undefined && subjectPlayer?.acs !== expected.acs),
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
  }, [matchId, subject, expected, clientOffline]);

  const subjectTeam = detail?.players.find((p) => p.isSubject)?.team ?? null;
  const teams = detail ? Array.from(new Set(detail.players.map((p) => p.team))) : [];
  const orderedTeams = subjectTeam ? [subjectTeam, ...teams.filter((t) => t !== subjectTeam)] : teams;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><div className="fixed inset-0 z-[70] flex items-center justify-center p-6" data-testid="match-detail-modal">
      <Dialog.Overlay className="absolute inset-0 bg-black/70" data-testid="match-detail-backdrop" />
      <Dialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); if (restoreFocus?.isConnected) restoreFocus.focus(); }} className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-white/10 bg-surface-modal/95 shadow-modal backdrop-blur-modal rise">
        {/* header */}
        <div className="relative border-b border-edge overflow-hidden">
          {detail?.mapSplash && (
            <img src={detail.mapSplash} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" draggable={false} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel/80 to-panel/50" />
          <div className="relative flex items-center gap-4 p-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-400">{detail?.mode ?? "Match"}</div>
              <Dialog.Title id="match-detail-title" className="font-display text-2xl font-bold italic uppercase leading-tight">{detail?.map ?? "Match Details"}</Dialog.Title>
            </div>
            {detail && (
              <OutcomeBadge size="lg" outcome={normalizeOutcome(detail.result)} score={scoreline(detail.scores, subjectTeam)} />
            )}
            <button
              aria-label="Close"
              data-testid="match-detail-close"
              onClick={onClose}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-sm border border-edge text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
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
          {detail &&
            orderedTeams.map((teamId) => (
              <DetailTable
                key={teamId}
                players={detail.players.filter((p) => p.team === teamId)}
                accent={teamId === subjectTeam ? "#10B981" : subjectTeam ? "#EF4444" : "#3B82F6"}
                label={
                  subjectTeam
                    ? teamId === subjectTeam
                      ? "Your team"
                      : "Enemy team"
                    : `Team ${teamId}`
                }
              />
            ))}
          {!loading && !error && !clientOffline && (
            <MetaEditor matchId={matchId} meta={meta} onSaved={(m) => onMetaSaved(matchId, m)} />
          )}
        </div>
      </Dialog.Content>
    </div></Dialog.Portal></Dialog.Root>
  );
}
