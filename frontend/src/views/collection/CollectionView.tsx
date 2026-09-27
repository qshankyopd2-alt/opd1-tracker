import { useEffect } from "react";
import { Package, RotateCw } from "lucide-react";
import { backend } from "../../api/client";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Section } from "../../components/ui/Section";
import { PageHeader } from "../../components/shell/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { usePoll } from "../../hooks/usePoll";

const designModeEnabled = import.meta.env.DEV && import.meta.env.VITE_DESIGN_MODE === "true";

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
    <div
      className={`relative overflow-hidden rounded-sm border p-3.5 ${
        highlight ? "border-accent/40 bg-[var(--bg-card)]" : "border-edge bg-card"
      }`}
      data-testid={testId}
    >
      {highlight && (
        <span className="absolute left-0 top-0 h-full w-[3px] bg-accent" aria-hidden="true" />
      )}
      <div className="micro-label">{label}</div>
      <div className={`mt-1.5 font-display text-[26px] font-bold leading-none num ${highlight ? "text-text-primary" : "text-text-primary"}`}>{value}</div>
      {sub && <div className="mt-1.5 text-[12px] leading-snug text-text-secondary">{sub}</div>}
    </div>
  );
}

function CountCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between border border-edge bg-inset px-2.5 py-1.5 text-[12px]">
      <span className="text-text-secondary">{label}</span>
      <span className="font-display text-[13px] font-bold text-text-primary num">{value}</span>
    </div>
  );
}

export function CollectionView() {
  const { data, error, loading, refresh } = usePoll(() => backend.inventory(), null);

  useEffect(() => {
    if (!designModeEnabled) return;
    const refreshPreview = () => refresh();
    window.addEventListener("opd1:design-view", refreshPreview);
    return () => window.removeEventListener("opd1:design-view", refreshPreview);
  }, [refresh]);

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
                : "Open VALORANT and sign in to view your collection."
            }
            testId="collection-unavailable"
          >
            {data?.retryable && (
              <button
                data-testid="collection-retry-button"
                onClick={refresh}
                className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-edge bg-panel px-4 py-2 text-[12px] font-bold text-text-secondary transition-colors hover:bg-card hover:text-text-primary"
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
          <Badge color="#f5a524" testId="collection-stale-badge">
            Saved collection
          </Badge>
        )}
        <button
          data-testid="collection-refresh-button"
          onClick={refresh}
          className="ml-auto inline-flex items-center gap-1.5 border border-edge rounded-sm px-2.5 py-1.5 text-[12px] font-bold text-text-muted hover:bg-card transition-colors"
        >
          <RotateCw size={12} /> Refresh
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ValueCard
          label="Collection value · estimate"
          value={`${(data.totalVp ?? 0).toLocaleString()} VP`}
          sub={`≈ $${(data.usdApprox ?? 0).toLocaleString()} USD · ${counts?.skins ?? 0} paid skins`}
          testId="collection-value-card"
          highlight={true}
        />
        <ValueCard label="VALORANT Points" value={(data.wallet?.vp ?? 0).toLocaleString()} sub="Wallet balance" testId="wallet-vp-card" />
        <ValueCard label="Radianite" value={(data.wallet?.rad ?? 0).toLocaleString()} sub="Upgrade currency" testId="wallet-rad-card" />
        <ValueCard label="Kingdom Credits" value={(data.wallet?.kc ?? 0).toLocaleString()} sub="Agent currency" testId="wallet-kc-card" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">
        <Section title="Breakdown" testId="collection-breakdown">
          <div className="space-y-4" data-testid="tier-breakdown">
            <div className="flex h-2.5 w-full overflow-hidden rounded-sm bg-inset ring-1 ring-inset ring-edge">
              {tiers.map(([name, t]) => (
                <div
                  key={name}
                  className="h-full cursor-default transition-all duration-200 first:rounded-l-sm last:rounded-r-sm hover:brightness-125"
                  style={{ width: `${(t.vp / (data.totalVp || 1)) * 100}%`, backgroundColor: TIER_COLORS[name] ?? "#A1A1AA" }}
                  title={`${name}: ${t.skins} skins, ${t.vp.toLocaleString()} VP`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
              {tiers.map(([name, t]) => (
                <div key={name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TIER_COLORS[name] ?? "#A1A1AA" }} />
                    <span className="font-semibold text-text-primary">{name}</span>
                  </div>
                  <span className="text-text-secondary num">{t.skins} skins</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
            <CountCell label="Earned skins" value={counts?.earned ?? 0} />
            <CountCell label="Agents" value={counts?.agents ?? "—"} />
            <CountCell label="Buddies" value={counts?.buddies ?? "—"} />
            <CountCell label="Cards" value={counts?.cards ?? "—"} />
            <CountCell label="Sprays" value={counts?.sprays ?? "—"} />
          </div>
        </Section>

        <Section title="Most valuable skins" testId="collection-top-skins">
          {(data.top ?? []).length === 0 ? (
            <p className="text-[12px] text-text-secondary">No priced skins found in this collection.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" data-testid="top-skins-grid">
              {(data.top ?? []).map((s) => (
                <div
                  key={s.name}
                  className="flex flex-col rounded-sm border-b border-l border-r border-edge bg-panel p-3"
                  style={{ borderTop: `2px solid ${TIER_COLORS[s.tier] ?? "#A1A1AA"}` }}
                >
                  {s.icon ? (
                    <img src={s.icon} alt={s.name} className="h-10 object-contain self-center hover:scale-105 transition-transform duration-300" loading="lazy" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} />
                  ) : (
                    <div className="h-10" />
                  )}
                  <div className="text-[12px] font-semibold mt-3 truncate text-text-primary" title={s.name}>{s.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-semibold" style={{ color: TIER_COLORS[s.tier] ?? "#A1A1AA" }}>
                      {s.tier}
                    </span>
                    <span className="text-[12px] font-semibold text-text-primary num">{s.vp.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(data.recent ?? []).length > 0 && (
            <div className="mt-6 pt-4 border-t border-edge" data-testid="recent-skins">
              <h4 className="micro-label flex items-center gap-2 mb-3">
                <span className="section-tick" aria-hidden="true" /> Recently added
              </h4>
              <div className="flex flex-wrap gap-2">
                {(data.recent ?? []).map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-2 text-[12px] border border-edge rounded-sm py-1.5 px-2.5 bg-card"
                    style={{ borderLeft: `3px solid ${TIER_COLORS[s.tier] ?? "#A1A1AA"}` }}
                  >
                    <span className="text-text-primary font-medium truncate max-w-[120px]">{s.name}</span>
                    <span className="text-text-secondary num">{s.vp.toLocaleString()}</span>
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
