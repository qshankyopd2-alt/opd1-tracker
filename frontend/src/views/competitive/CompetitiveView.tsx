import { ArrowDown, ArrowUp, LineChart, Lightbulb, RotateCw } from "lucide-react";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";
import { Section } from "../../components/ui/Section";
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
  const { data, error, loading, refresh } = usePerformance();
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
          message="Keep OPD1 Tracker open while VALORANT runs. Your last competitive matches are pulled automatically and every new game is recorded — RR graph, splits and insights build up from there."
          testId="competitive-empty"
        >
          <button
            data-testid="competitive-refresh-button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 border border-edge rounded-sm px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
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
      <div className="flex items-center gap-3">
        <h1 className="font-display font-black italic uppercase text-2xl tracking-tight">Competitive</h1>
        {account.riotId && <span className="text-[12px] text-zinc-500">{account.riotId}</span>}
        <button
          data-testid="competitive-refresh-button"
          onClick={refresh}
          className="ml-auto inline-flex items-center gap-1.5 border border-edge rounded-sm px-2.5 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          <RotateCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        {/* rank card */}
        <Section testId="rank-card">
          <div className="flex items-center gap-3">
            {currentIcon ? (
              <img src={currentIcon} alt="" className="w-14 h-14" />
            ) : (
              <span className="w-14 h-14 border border-edge rounded-md" />
            )}
            <div>
              <div className="font-display font-black text-2xl leading-tight" style={{ color: current?.color }}>
                {current?.name ?? "Unranked"}
              </div>
              <div className="text-[12px] text-zinc-400 num">
                {current?.rr ?? 0} RR
                {summary && summary.winRate !== null && (
                  <span className="text-zinc-500">
                    {" "}
                    · {summary.wins}W–{summary.losses}L ({fmtNum(summary.winRate, 1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {summary?.next && (
            <div className="mt-4" data-testid="next-rank-progress">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                <span>
                  Next: <span style={{ color: summary.next.color }}>{summary.next.name}</span>
                </span>
                <span className="num">{summary.next.rrNeeded} RR to go</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full" style={{ width: `${summary.next.progress}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="border border-edge rounded-sm py-2">
              <div className={`font-display font-bold text-lg num ${summary && summary.net >= 0 ? "text-victory" : "text-defeat"}`}>
                {fmtDelta(summary?.net ?? 0)}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Net RR</div>
            </div>
            <div className="border border-edge rounded-sm py-2">
              <div className="font-display font-bold text-lg num text-victory">{summary?.avgWin !== null && summary?.avgWin !== undefined ? fmtDelta(Math.round(summary.avgWin)) : "—"}</div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Avg win</div>
            </div>
            <div className="border border-edge rounded-sm py-2">
              <div className="font-display font-bold text-lg num text-defeat">{summary?.avgLoss !== null && summary?.avgLoss !== undefined ? fmtDelta(Math.round(summary.avgLoss)) : "—"}</div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Avg loss</div>
            </div>
          </div>

          {data.rankChanges.length > 0 && (
            <div className="mt-4 border-t border-edge pt-3" data-testid="rank-changes">
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Rank changes</h4>
              <div className="space-y-1">
                {data.rankChanges.slice(-4).reverse().map((c) => {
                  const to = rankFromTier(c.toTier);
                  return (
                    <div key={c.matchId} className="flex items-center gap-2 text-[11px]">
                      {c.type === "promotion" ? (
                        <ArrowUp size={12} className="text-victory" />
                      ) : (
                        <ArrowDown size={12} className="text-defeat" />
                      )}
                      <span style={{ color: to.color }}>{to.name}</span>
                      <span className="text-zinc-600 ml-auto">{timeAgo(c.ts)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        {/* RR chart */}
        <Section
          title="RR Progression"
          testId="rr-chart-section"
          actions={
            <span className="text-[10px] text-zinc-500 num">
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
            <p className="text-[12px] text-zinc-500">
              Insights unlock after {data.insightsMinimum} rated matches ({summary?.matches ?? 0} recorded so far).
            </p>
          ) : (
            <div className="space-y-2.5" data-testid="insights-list">
              {data.insights.map((ins, i) => (
                <div key={i} className="flex gap-2.5">
                  <Lightbulb
                    size={14}
                    className={`mt-0.5 shrink-0 ${ins.tone === "pos" ? "text-victory" : ins.tone === "neg" ? "text-defeat" : "text-zinc-500"}`}
                  />
                  <div>
                    <div className="text-[12px] font-semibold text-zinc-200">{ins.title}</div>
                    <div className="text-[12px] text-zinc-400">{ins.text}</div>
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
                  <div key={k} className="border border-edge rounded-sm p-2.5">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">{k} act</div>
                    <div className="text-[13px] font-semibold num" style={{ color: act.current.color }}>
                      {act.current.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 num">
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
