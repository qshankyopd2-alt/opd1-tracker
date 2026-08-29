import { Package, RotateCw } from "lucide-react";
import { backend } from "../../api/client";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Section } from "../../components/ui/Section";
import { PageHeader } from "../../components/shell/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { usePoll } from "../../hooks/usePoll";

const TIER_COLORS: Record<string, string> = {
  Select: "#5CA3E4",
  Deluxe: "#009587",
  Premium: "#D1548D",
  Exclusive: "#F5955B",
  Ultra: "#FAD663",
  Other: "#A1A1AA",
};

function ValueCard({ label, value, sub, testId, highlight }: { label: string; value: string; sub?: string; testId: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-md p-3.5 ${highlight ? 'bg-brand/5 border-brand/50 shadow-[inset_0_0_12px_rgba(249,115,22,0.05)]' : 'bg-card border-edge'}`} data-testid={testId}>
      <div className={`text-[10px] uppercase tracking-[0.25em] ${highlight ? 'text-brand/80' : 'text-zinc-500'}`}>{label}</div>
      <div className={`font-display font-black text-[26px] leading-tight num ${highlight ? 'text-brand' : 'text-zinc-100'}`}>{value}</div>
      {sub && <div className={`text-[11px] ${highlight ? 'text-brand/60' : 'text-zinc-500'}`}>{sub}</div>}
    </div>
  );
}

export function CollectionView() {
  const { data, error, loading, refresh } = usePoll(() => backend.inventory(), null);

  if (loading) {
    return (
      <div className="p-5">
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <ErrorBanner message={error} onRetry={refresh} testId="collection-error" />
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="p-5" data-testid="collection-view">
        <div className="flex h-[400px] items-center justify-center rounded-md border border-edge bg-card/30">
          <EmptyState
            icon={Package}
            title="Collection unavailable"
            message={
              data?.retryable
                ? "Your collection is read from the local Riot client. Start VALORANT and sign in, then try again."
                : "Collection data needs the live VALORANT client — it isn't available in demo mode."
            }
            testId="collection-unavailable"
          >
            {data?.retryable && (
              <button
                data-testid="collection-retry-button"
                onClick={refresh}
                className="mt-2 inline-flex items-center gap-1.5 border border-edge rounded-sm bg-panel px-4 py-2 text-[11px] uppercase tracking-wider font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors shadow-sm"
              >
                <RotateCw size={12} /> Try again
              </button>
            )}
          </EmptyState>
        </div>
      </div>
    );
  }

  const counts = data.counts;
  const tiers = Object.entries(data.tiers ?? {}).sort((a, b) => b[1].vp - a[1].vp);

  return (
    <div className="p-5 space-y-4" data-testid="collection-view">
      <PageHeader title="Collection">
        {data.stale && (
          <Badge color="#F59E0B" testId="collection-stale-badge">
            Stale data
          </Badge>
        )}
        <button
          data-testid="collection-refresh-button"
          onClick={refresh}
          className="ml-auto inline-flex items-center gap-1.5 border border-edge rounded-sm px-2.5 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          <RotateCw size={12} /> Refresh
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <ValueCard
          label="Collection value"
          value={`${(data.totalVp ?? 0).toLocaleString()} VP`}
          sub={`≈ $${(data.usdApprox ?? 0).toLocaleString()} USD · ${counts?.skins ?? 0} paid skins`}
          testId="collection-value-card"
          highlight={true}
        />
        <ValueCard label="Valorant Points" value={(data.wallet?.vp ?? 0).toLocaleString()} sub="wallet balance" testId="wallet-vp-card" />
        <ValueCard label="Radianite" value={(data.wallet?.rad ?? 0).toLocaleString()} sub="upgrade currency" testId="wallet-rad-card" />
        <ValueCard label="Kingdom Credits" value={(data.wallet?.kc ?? 0).toLocaleString()} sub="agent currency" testId="wallet-kc-card" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">
        <Section title="Breakdown" testId="collection-breakdown">
          <div className="space-y-4" data-testid="tier-breakdown">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-inset ring-white/5">
              {tiers.map(([name, t]) => (
                <div
                  key={name}
                  className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full hover:brightness-125 cursor-default"
                  style={{ width: `${(t.vp / (data.totalVp || 1)) * 100}%`, backgroundColor: TIER_COLORS[name] ?? "#A1A1AA" }}
                  title={`${name}: ${t.skins} skins, ${t.vp.toLocaleString()} VP`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
              {tiers.map(([name, t]) => (
                <div key={name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm shadow-sm" style={{ backgroundColor: TIER_COLORS[name] ?? "#A1A1AA" }} />
                    <span style={{ color: TIER_COLORS[name] ?? "#A1A1AA" }} className="font-semibold">{name}</span>
                  </div>
                  <span className="text-zinc-500 num">{t.skins} skins</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div className="border border-edge rounded-sm px-2 py-1.5">Earned skins <span className="text-zinc-200 num float-right">{counts?.earned ?? 0}</span></div>
            <div className="border border-edge rounded-sm px-2 py-1.5">Agents <span className="text-zinc-200 num float-right">{counts?.agents ?? "—"}</span></div>
            <div className="border border-edge rounded-sm px-2 py-1.5">Buddies <span className="text-zinc-200 num float-right">{counts?.buddies ?? "—"}</span></div>
            <div className="border border-edge rounded-sm px-2 py-1.5">Cards <span className="text-zinc-200 num float-right">{counts?.cards ?? "—"}</span></div>
            <div className="border border-edge rounded-sm px-2 py-1.5">Sprays <span className="text-zinc-200 num float-right">{counts?.sprays ?? "—"}</span></div>
          </div>
        </Section>

        <Section title="Most valuable skins" testId="collection-top-skins">
          {(data.top ?? []).length === 0 ? (
            <p className="text-[12px] text-zinc-500">No priced skins found in this collection.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 stagger" data-testid="top-skins-grid">
              {(data.top ?? []).map((s) => (
                <div key={s.name} className="rounded-sm p-3 bg-panel flex flex-col shadow-sm border-b border-l border-r border-edge" style={{ borderTop: `2px solid ${TIER_COLORS[s.tier] ?? '#A1A1AA'}` }}>
                  {s.icon ? (
                    <img src={s.icon} alt={s.name} className="h-10 object-contain self-center hover:scale-105 transition-transform duration-300" loading="lazy" draggable={false} />
                  ) : (
                    <div className="h-10" />
                  )}
                  <div className="text-[11px] font-semibold mt-3 truncate text-zinc-200" title={s.name}>{s.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TIER_COLORS[s.tier] ?? "#A1A1AA" }}>
                      {s.tier}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-200 num tracking-tight">{s.vp.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(data.recent ?? []).length > 0 && (
            <div className="mt-6 pt-4 border-t border-edge" data-testid="recent-skins">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3">Recently added</h4>
              <div className="flex flex-wrap gap-2">
                {(data.recent ?? []).map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-[11px] border border-edge rounded-sm py-1.5 px-2.5 bg-card" style={{ borderLeft: `3px solid ${TIER_COLORS[s.tier] ?? '#A1A1AA'}` }}>
                    <span className="text-zinc-200 font-medium truncate max-w-[120px]">{s.name}</span>
                    <span className="text-zinc-500 num">{s.vp.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
