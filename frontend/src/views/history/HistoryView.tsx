import { useEffect, useMemo, useState } from "react";
import { Bookmark, History, RotateCw, StickyNote } from "lucide-react";
import { backend } from "../../api/client";
import type { HistoryPoint, MatchMeta } from "../../api/types";
import { AgentAvatar } from "../../components/domain/AgentAvatar";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { PageHeader } from "../../components/shell/PageHeader";
import { usePerformance } from "../../hooks/usePerformance";
import { fmtDelta, fmtNum, fmtPct, resultColor, scoreline, timeAgo } from "../../lib/format";
import { MatchDetailModal } from "./MatchDetailModal";

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
  onOpen: () => void;
}) {
  return (
    <button
      data-testid={`history-row-${point.matchId}`}
      onClick={onOpen}
      className="group relative min-h-[72px] w-full overflow-hidden rounded-md border border-edge bg-card text-left transition-colors hover:border-zinc-600"
    >
      {splash && (
        <span className="absolute inset-y-0 left-0 w-[300px] overflow-hidden">
          <img src={splash} alt="" className="h-full w-full object-cover opacity-20 transition-opacity group-hover:opacity-30" draggable={false} />
          <span className="absolute inset-0 bg-gradient-to-r from-black/20 via-card/45 to-card" />
        </span>
      )}
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: resultColor(point.result) }} />
      <div className="relative grid grid-cols-[minmax(150px,1.25fr)_70px_minmax(125px,1fr)_112px_92px_82px_48px] items-center gap-3 px-4 py-2.5">
        <span className="min-w-0">
          <span className="font-display font-bold text-[15px] truncate block">{point.map ?? "Unknown"}</span>
          <span className="text-[10px] text-zinc-500">
            {point.mode ?? "Competitive"} · {timeAgo(point.ts)}
          </span>
        </span>

        <span className="text-[12px] font-bold num" style={{ color: resultColor(point.result) }}>
          {point.result === "Victory" ? "WIN" : point.result === "Defeat" ? "LOSS" : point.result === "Draw" ? "DRAW" : "—"}
          <span className="block text-[10px] text-zinc-500 font-normal">{scoreline(point.scores, null, point.result)}</span>
        </span>

        <span className="flex min-w-0 items-center gap-2.5">
          {point.agent ? (
            <>
              <AgentAvatar portrait={point.agentPortrait} name={point.agent} color={point.agentColor} size={36} />
              <span className="truncate text-[13px] font-semibold text-zinc-200">{point.agent}</span>
            </>
          ) : (
            <span className="text-[11px] text-zinc-600">—</span>
          )}
        </span>

        <span className="text-right text-zinc-300">
          <span className="block text-[8px] font-semibold uppercase tracking-wider text-zinc-600">K/D/A · K/D</span>
          <span className="text-[12px] num">
            {point.kills !== undefined
              ? `${point.kills}/${point.deaths}/${point.assists}${point.kd !== undefined ? ` · ${fmtNum(point.kd, 2)}` : ""}`
              : "—"}
          </span>
        </span>
        <span className="text-right text-zinc-300">
          <span className="block text-[8px] font-semibold uppercase tracking-wider text-zinc-600">ACS · HS%</span>
          <span className="text-[12px] num">{point.acs ?? "—"}{point.hsPct !== null && point.hsPct !== undefined ? ` · ${fmtPct(point.hsPct)}` : ""}</span>
        </span>

        <span className="text-right">
          <span className="block text-[8px] font-semibold uppercase tracking-wider text-zinc-600">Rank change</span>
          {typeof point.delta === "number" ? (
            <span className={`num text-[13px] font-bold ${point.delta >= 0 ? "text-victory" : "text-defeat"}`}>
              {fmtDelta(point.delta)}
            </span>
          ) : (
            <span className="text-zinc-600 text-[11px]">—</span>
          )}
          {rankIcon && <img src={rankIcon} alt="" className="ml-1.5 inline-block h-5 w-5 align-middle" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        </span>

        <span className="flex items-center justify-end gap-1.5 text-zinc-500">
          {meta?.bookmarked && <Bookmark size={12} className="text-amber-300" />}
          {meta?.note && <StickyNote size={12} />}
          {point.partySize && point.partySize > 1 && <span className="text-[10px] num">×{point.partySize}</span>}
        </span>
      </div>
    </button>
  );
}

export function HistoryView() {
  const { data, error, loading, stale, refresh } = usePerformance();
  const [filter, setFilter] = useState<Filter>("all");
  const [openMatch, setOpenMatch] = useState<string | null>(null);
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
      <PageHeader title="Match History">
        <div className="flex border border-edge rounded-sm" data-testid="history-filter">
          {(["all", "wins", "losses", "bookmarked"] as Filter[]).map((f) => (
            <button
              key={f}
              data-testid={`history-filter-${f}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold transition-colors ${
                filter === f ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {stale && (
          <Badge color="#F59E0B" testId="history-stale-badge">
            saved data · VALORANT offline
          </Badge>
        )}
        <button
          data-testid="history-refresh-button"
          onClick={refresh}
          className="ml-auto inline-flex items-center gap-1.5 border border-edge rounded-sm px-2.5 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
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
        <div className="space-y-1.5 stagger" data-testid="history-list">
          {points.map((p) => (
            <MatchRow
              key={p.matchId}
              point={p}
              meta={allMeta[p.matchId]}
              splash={p.mapSplash ?? (p.map ? data?.mapSplashes?.[p.map] : null)}
              rankIcon={typeof p.tier === "number" ? data?.rankIcons?.[String(p.tier)] : null}
              onOpen={() => setOpenMatch(p.matchId)}
            />
          ))}
        </div>
      )}

      {openMatch && (
        <MatchDetailModal
          matchId={openMatch}
          subject={data?.account.puuid ?? null}
          expected={allPoints.find((point) => point.matchId === openMatch)}
          meta={allMeta[openMatch]}
          onMetaSaved={(id, m) => setMetaOverrides((prev) => ({ ...prev, [id]: m }))}
          onClose={() => setOpenMatch(null)}
        />
      )}
    </div>
  );
}
