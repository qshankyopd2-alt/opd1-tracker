import { Section } from "../../components/ui/Section";
import { PageHeader } from "../../components/shell/PageHeader";
import { useApp } from "../../state/AppContext";

export function SettingsView() {
  const { health, healthError } = useApp();
  return (
    <div className="p-6 space-y-6" data-testid="settings-view">
      <PageHeader title="Settings" />
      <div className="settings-layout">
        <div><p className="text-brand text-[12px] tracking-widest">APPLICATION</p><h2 className="font-display text-[38px] mt-3">OPD1 Tracker</h2><p className="mt-2 text-text-secondary">{health?.appVersion ? `Version ${health.appVersion}` : "Version unavailable"}</p><p className="mt-6 max-w-sm text-[14px] leading-relaxed text-text-secondary">A local workspace for your VALORANT matches, competitive progress and player notes.</p></div>
        <Section title="Connection" testId="settings-about-section">
          <dl className="settings-facts">
            <div><dt>Data service</dt><dd>{healthError ? "Unavailable" : health ? "Connected" : "Checking…"}</dd></div>
            <div><dt>Riot client</dt><dd>{health?.clientStatus === "ok" ? "Detected" : "Not running or not ready"}</dd></div>
            <div><dt>Data source</dt><dd>{health?.dataSourcePreference ?? "—"}</dd></div>
            <div><dt>Region</dt><dd>Detected automatically</dd></div>
          </dl>
          <p className="text-[12px] text-text-secondary mt-5">Region follows the local game log. Player notes and match annotations stay on this PC.</p>
        </Section>
      </div>
      <p className="border-t border-edge pt-5 text-[12px] text-text-secondary max-w-4xl">OPD1 Tracker is not endorsed by Riot Games and does not reflect the views of Riot Games or anyone officially involved in producing or managing Riot Games properties.</p>
    </div>
  );
}
