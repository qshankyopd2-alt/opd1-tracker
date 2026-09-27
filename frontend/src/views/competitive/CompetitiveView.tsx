import { ArrowDown, ArrowUp, LineChart, Lightbulb, RotateCw } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";
import { Section } from "../../components/ui/Section";
import { PageHeader } from "../../components/shell/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { usePerformance } from "../../hooks/usePerformance";
import { fmtDelta, fmtNum, timeAgo } from "../../lib/format";
import { rankFromTier } from "../../lib/ranks";
import { useLiveData } from "../../state/LiveDataContext";
import { RRChart } from "./RRChart";
import { ScheduleBars } from "./ScheduleBars";
import { SessionPanel } from "./SessionPanel";
import { SplitTable } from "./SplitTable";

export function CompetitiveView() {
  const { data, error, loading, stale, refresh } = usePerformance();
  const { isLive } = useLiveData();

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
        <ErrorBanner message={error} onRetry={refresh} testId="competitive-error" />
      </div>
    );
  }

  const points = data?.points ?? [];
  const summary = data?.summary;
  const current = summary?.current;
  const currentIcon = current?.tier !== null && current?.tier !== undefined ? data?.rankIcons?.[String(current.tier)] : null;

  if (!data || points.length === 0) {
    return (
      <div className="p-5 space-y-4" data-testid="competitive-view">
        <EmptyState
          icon={LineChart}
          title="No competitive history yet"
          message="Open VALORANT to load your recent competitive matches. Your rank progress, map results, and insights will appear here."
          testId="competitive-empty"
        >
          <button
            data-testid="competitive-refresh-button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 border border-edge rounded-sm px-3 py-1.5 text-[12px] font-bold text-text-secondary hover:bg-card transition-colors"
          >
            <RotateCw size={12} /> Check again
          </button>
        </EmptyState>
      </div>
    );
  }

  const account = data.account;

  return (
    <div className="p-5 space-y-4" data-testid="competitive-view">
      <PageHeader title="Competitive">
        {account.riotId && <span className="text-[12px] font-medium text-text-secondary mr-2">{account.riotId}</span>}
        {stale && (
          <Badge color="#f5a524" testId="competitive-stale-badge">
            Saved data · VALORANT offline
          </Badge>
        )}
        <button
          data-testid="competitive-refresh-button"
          onClick={refresh}
          className="ml-auto inline-flex items-center gap-1.5 border border-edge rounded-sm px-2.5 py-1.5 text-[12px] font-bold text-text-muted hover:bg-card transition-colors"
        >
          <RotateCw size={12} /> Refresh
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        {/* Rank card */}
        <Section testId="rank-card">
          <div className="flex items-center gap-3.5">
            {currentIcon ? (
              <img src={currentIcon} alt="" className="w-14 h-14 object-contain" />
            ) : (
              <span className="w-14 h-14 border border-edge rounded-sm" />
            )}
            <div className="min-w-0">
              <div className="micro-label">Current rank</div>
              <div className="font-display font-bold text-[26px] leading-tight text-text-primary truncate">
                {current?.name ?? "Unranked"}
              </div>
              <div className="text-[12px] text-text-secondary num">
                {current?.rr ?? 0} RR
                {summary && summary.winRate !== null && (
                  <span>
                    {" "}
                    · {summary.wins}W–{summary.losses}L ({fmtNum(summary.winRate, 1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {summary?.next && (
            <div className="mt-4" data-testid="next-rank-progress">
              <div className="flex justify-between text-[12px] text-text-secondary mb-1.5">
                <span>
                  Next: <span className="text-text-primary font-semibold">{summary.next.name}</span>
                </span>
                <span className="num font-medium">{summary.next.rrNeeded} RR to go</span>
              </div>
              <div className="h-1.5 bg-inset rounded-sm overflow-hidden ring-1 ring-inset ring-edge">
                <div className="h-full bg-accent rounded-sm transition-all duration-300" style={{ width: `${summary.next.progress}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="border border-edge bg-inset rounded-sm py-2.5">
              <div className={`font-display font-bold text-[22px] num leading-none ${summary && summary.net >= 0 ? "text-victory" : "text-defeat"}`}>
                {fmtDelta(summary?.net ?? 0)}
              </div>
              <div className="micro-label mt-1.5">Net RR</div>
            </div>
            <div className="border border-edge bg-inset rounded-sm py-2.5">
              <div className="font-display font-bold text-[22px] num leading-none text-victory">
                {summary?.avgWin !== null && summary?.avgWin !== undefined ? fmtDelta(Math.round(summary.avgWin)) : "—"}
              </div>
              <div className="micro-label mt-1.5">Avg win</div>
            </div>
            <div className="border border-edge bg-inset rounded-sm py-2.5">
              <div className="font-display font-bold text-[22px] num leading-none text-defeat">
                {summary?.avgLoss !== null && summary?.avgLoss !== undefined ? fmtDelta(Math.round(summary.avgLoss)) : "—"}
              </div>
              <div className="micro-label mt-1.5">Avg loss</div>
            </div>
          </div>

          {data.rankChanges.length > 0 && (
            <div className="mt-4 border-t border-edge pt-3" data-testid="rank-changes">
              <h4 className="micro-label flex items-center gap-2 mb-2">
                <span className="section-tick" aria-hidden="true" /> Rank changes
              </h4>
              <div className="space-y-1.5">
                {data.rankChanges.slice(-4).reverse().map((c) => {
                  const to = rankFromTier(c.toTier);
                  return (
                    <div key={c.matchId} className="flex items-center gap-2 text-[12px]">
                      {c.type === "promotion" ? (
                        <ArrowUp size={12} className="text-victory shrink-0" />
                      ) : (
                        <ArrowDown size={12} className="text-defeat shrink-0" />
                      )}
                      <span style={{ color: to.color }} className="font-semibold">{to.name}</span>
                      <span className="text-text-muted ml-auto">{timeAgo(c.ts)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        {/* RR chart */}
        <Section
          title="RR progression"
          testId="rr-chart-section"
          actions={
            <span className="text-[12px] text-text-secondary num">
              {data.dataQuality.exact} exact · {data.dataQuality.estimated} estimated results
            </span>
          }
        >
          <RRChart points={points} />
        </Section>
      </div>

      <Section title="Session" testId="session-section">
        <SessionPanel
          active={data.sessions?.active ?? null}
          archive={data.sessions?.archive ?? []}
          onChanged={refresh}
          canControl={isLive}
        />
      </Section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="Maps" testId="maps-split-section">
          <SplitTable rows={data.splits.maps} kind="map" testId="maps-split-table" />
        </Section>
        <Section title="Agents" testId="agents-split-section">
          <SplitTable rows={data.splits.agents} kind="agent" testId="agents-split-table" />
        </Section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="Schedule" testId="schedule-section">
          <ScheduleBars weekdays={data.splits.schedule.weekdays} dayparts={data.splits.schedule.dayparts} />
        </Section>

        <Section title="Insights" testId="insights-section">
          {data.insights.length === 0 ? (
            <p className="text-[12px] text-text-secondary">
              Insights unlock after {data.insightsMinimum} rated matches ({summary?.matches ?? 0} recorded so far).
            </p>
          ) : (
            <div className="space-y-2.5" data-testid="insights-list">
              {data.insights.map((ins, i) => (
                <div key={i} className="flex gap-2.5 border border-edge bg-inset rounded-sm px-3 py-2.5">
                  <Lightbulb
                    size={14}
                    className={`mt-0.5 shrink-0 ${ins.tone === "pos" ? "text-victory" : ins.tone === "neg" ? "text-defeat" : "text-text-secondary"}`}
                  />
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-text-primary">{ins.title}</div>
                    <div className="text-[12px] text-text-secondary mt-0.5">{ins.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.actComparison && (
            <div className="mt-4 border-t border-edge pt-3 grid grid-cols-2 gap-3" data-testid="act-comparison">
              {(["current", "previous"] as const).map((k) => {
                const act = data.actComparison![k];
                return (
                  <div key={k} className="border border-edge bg-inset rounded-sm p-2.5">
                    <div className="micro-label">{k === "current" ? "Current act" : "Previous act"}</div>
                    <div className="text-[13px] font-bold num" style={{ color: act.current.color }}>
                      {act.current.name}
                    </div>
                    <div className="text-[12px] text-text-secondary num">
                      {act.wins}W–{act.losses}L · {fmtDelta(act.net)} RR
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
