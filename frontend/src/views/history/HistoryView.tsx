import { useEffect, useMemo, useState } from "react";
import { Bookmark, History, RotateCw, StickyNote, Users } from "lucide-react";
import { backend } from "../../api/client";
import type { HistoryPoint, MatchMeta } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { PageHeader } from "../../components/shell/PageHeader";
import { usePerformance } from "../../hooks/usePerformance";
import { fmtDelta, fmtNum, fmtPct, scoreline, timeAgo } from "../../lib/format";
import { MatchDetailModal } from "./MatchDetailModal";
import { OutcomeBadge, normalizeOutcome } from "../../components/ui/OutcomeBadge";

type Filter = "all" | "wins" | "losses" | "bookmarked";

function MatchRow({
  point,
  meta,
  splash,
  rankIcon,
  onOpen,
}: {
  point: HistoryPoint;
  meta: MatchMeta | undefined;
  splash: string | null | undefined;
  rankIcon: string | null | undefined;
  onOpen: (opener: HTMLElement) => void;
}) {
  const ariaLabel = `${point.map ?? "Unknown map"} match, ${point.result ?? "Unknown result"}${point.agent ? `, played as ${point.agent}` : ""}${point.kills !== undefined ? `, KDA ${point.kills}/${point.deaths}/${point.assists}` : ""}`;
  return (
    <button
      data-testid={`history-row-${point.matchId}`}
      aria-label={ariaLabel}
      onClick={(event) => onOpen(event.currentTarget)}
      className="history-row group block w-full text-left"
    >
      <span className="history-map-art">
        {splash && (
          <img src={splash} alt="" className="history-map-img" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />
        )}
        <span className="history-map-agent">
          {point.agent && (
            <AgentAvatar portrait={point.agentPortrait} name={point.agent} color={point.agentColor} size={26} />
          )}
        </span>
      </span>
      <span className="history-row-main">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-display text-[16.5px] font-bold uppercase tracking-[0.04em] text-text-primary">
            {point.map ?? "Unknown"}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <OutcomeBadge size="xs" outcome={normalizeOutcome(point.result)} />
            <span className="num font-display text-[12px] font-bold text-text-secondary tabular-nums">
              {scoreline(point.scores, null, point.result)}
            </span>
          </span>
        </span>
        <span className="micro-label mt-1 block normal-case tracking-normal">
          {point.mode ?? "Competitive"} · {timeAgo(point.ts)}
        </span>
      </span>
      <span className="num min-w-0 text-right font-mono text-[12.5px] text-text-secondary tabular-nums" title="Kills / deaths / assists · K/D ratio">
        {point.kills !== undefined
          ? `${point.kills}/${point.deaths}/${point.assists}${point.kd !== undefined ? ` · ${fmtNum(point.kd, 2)}` : ""}`
          : "—"}
      </span>
      <span className="num text-right font-mono text-[12.5px] text-text-secondary tabular-nums" title="Average combat score · Headshots %">
        {point.acs ?? "—"}
        {point.hsPct !== null && point.hsPct !== undefined ? ` · ${fmtPct(point.hsPct)}` : ""}
      </span>
      <span className="flex items-center justify-end gap-1.5" title="Rank change">
        {typeof point.delta === "number" ? (
          <span className={`num font-mono text-[12.5px] font-semibold ${point.delta >= 0 ? "text-victory" : "text-defeat"}`}>
            {fmtDelta(point.delta)}
          </span>
        ) : (
          <span className="text-[12px] text-text-muted">—</span>
        )}
        {rankIcon && (
          <img src={rankIcon} alt="" className="h-4 w-4" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        )}
      </span>
      <span className="flex items-center justify-end gap-1.5 text-text-muted">
        {meta?.bookmarked && <Bookmark size={12} className="text-gold" fill="currentColor" aria-label="Bookmarked" />}
        {meta?.note && <StickyNote size={12} aria-label="Has note" />}
        {point.partySize && point.partySize > 1 && (
          <span className="num inline-flex items-center gap-0.5 text-[11px] text-text-muted" title={`Party of ${point.partySize}`}>
            <Users size={11} />
            {point.partySize}
          </span>
        )}
      </span>
    </button>
  );
}

export function HistoryView() {
  const { data, error, loading, stale, refresh } = usePerformance();
  const [filter, setFilter] = useState<Filter>("all");
  const [openMatch, setOpenMatch] = useState<{ id: string; opener: HTMLElement } | null>(null);
  const [metaOverrides, setMetaOverrides] = useState<Record<string, MatchMeta>>({});
  const [recentModes, setRecentModes] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    const puuid = data?.account.puuid;
    if (!puuid) {
      setRecentModes([]);
      return;
    }

    let alive = true;
    backend.profile(puuid).then((career) => {
      if (!alive || career.source !== "local") return;
      setRecentModes(career.matches.map((match) => ({
        matchId: match.matchId,
        ts: match.startMillis,
        map: match.map,
        mapSplash: match.mapSplash,
        mode: match.mode,
        result: match.result,
        resultExact: true,
        delta: match.rrDelta,
        tier: match.tierAfter,
        agent: match.agent,
        agentPortrait: match.agentPortrait,
        agentColor: match.agentColor,
        partySize: match.partySize,
        scores: match.scores,
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        kd: match.kd,
        acs: match.acs,
        hsPct: match.hsPct,
        source: "career",
      })));
    }).catch(() => {
      if (alive) setRecentModes([]);
    });
    return () => {
      alive = false;
    };
  }, [data?.account.puuid]);

  const allPoints = useMemo(() => {
    const merged = new Map((data?.points ?? []).map((point) => [point.matchId, point]));
    for (const point of recentModes) {
      const existing = merged.get(point.matchId);
      merged.set(point.matchId, {
        ...existing,
        ...point,
        delta: existing?.delta ?? point.delta,
        tier: existing?.tier ?? point.tier,
      });
    }
    return [...merged.values()]
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
      .slice(0, 8);
  }, [data?.points, recentModes]);

  const points = useMemo(() => {
    const meta = { ...(data?.matchMeta ?? {}), ...metaOverrides };
    switch (filter) {
      case "wins":
        return allPoints.filter((p) => p.result === "Victory");
      case "losses":
        return allPoints.filter((p) => p.result === "Defeat");
      case "bookmarked":
        return allPoints.filter((p) => meta[p.matchId]?.bookmarked);
      default:
        return allPoints;
    }
  }, [allPoints, data?.matchMeta, filter, metaOverrides]);

  if (loading) {
    return (
      <div className="p-5">
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-5">
        <ErrorBanner message={error} onRetry={refresh} testId="history-error" />
      </div>
    );
  }

  const allMeta = { ...(data?.matchMeta ?? {}), ...metaOverrides };
  return (
    <div className="p-5 space-y-4" data-testid="history-view">
      <PageHeader title="Match history">
        <div className="flex border border-edge rounded-sm overflow-hidden" data-testid="history-filter">
          {(["all", "wins", "losses", "bookmarked"] as Filter[]).map((f) => (
            <button
              key={f}
              data-testid={`history-filter-${f}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[12px] font-bold capitalize transition-colors ${
                filter === f ? "bg-card-hover text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {stale && (
          <Badge color="#f5a524" testId="history-stale-badge">
            Saved data · VALORANT offline
          </Badge>
        )}
        <button
          data-testid="history-refresh-button"
          onClick={refresh}
          className="ml-auto inline-flex items-center gap-1.5 rounded-sm border border-edge bg-card px-3 py-1.5 text-[12px] font-bold text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary"
        >
          <RotateCw size={12} /> Refresh
        </button>
      </PageHeader>

      {points.length === 0 ? (
        <EmptyState
          icon={History}
          title={filter === "all" ? "No matches recorded" : "Nothing matches this filter"}
          message={
            filter === "all"
              ? "Matches are loaded automatically from VALORANT, including Competitive, Unrated, and Deathmatch."
              : "Try a different filter."
          }
          testId="history-empty"
        />
      ) : (
        <div className="history-list" data-testid="history-list">
          {points.map((p) => (
            <MatchRow
              key={p.matchId}
              point={p}
              meta={allMeta[p.matchId]}
              splash={p.mapSplash ?? (p.map ? data?.mapSplashes?.[p.map] : null)}
              rankIcon={typeof p.tier === "number" ? data?.rankIcons?.[String(p.tier)] : null}
              onOpen={(opener) => setOpenMatch({ id: p.matchId, opener })}
            />
          ))}
        </div>
      )}

      {openMatch && (
        <MatchDetailModal
          matchId={openMatch.id}
          subject={data?.account.puuid ?? null}
          expected={allPoints.find((point) => point.matchId === openMatch.id)}
          meta={allMeta[openMatch.id]}
          restoreFocus={openMatch.opener}
          onMetaSaved={(id, m) => setMetaOverrides((prev) => ({ ...prev, [id]: m }))}
          onClose={() => setOpenMatch(null)}
        />
      )}
    </div>
  );
}
