import { Activity, Database, Globe, ShieldCheck } from "lucide-react";
import { Section } from "../../components/ui/Section";
import { PageHeader } from "../../components/shell/PageHeader";
import { useApp } from "../../state/AppContext";

function AboutRow({ label, value, tone }: { label: string; value: string; tone?: "ok" | "muted" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-edge/60 last:border-b-0 py-2.5">
      <span className="text-[12px] font-semibold text-text-secondary">{label}</span>
      <span
        className={`text-right text-[13px] font-medium ${
          tone === "ok" ? "text-victory" : tone === "muted" ? "text-text-muted" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function SettingsView() {
  const { health } = useApp();

  return (
    <div className="p-5 space-y-4 max-w-5xl" data-testid="settings-view">
      <PageHeader title="Settings" />

      <Section title="About" testId="settings-about-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <div className="space-y-0">
            <AboutRow label="App" value={`OPD1 Tracker${health?.appVersion ? ` v${health.appVersion}` : ""}`} />
            <AboutRow label="Data source" value={health?.dataSourcePreference ?? "—"} />
            <AboutRow
              label="Riot client"
              value={health?.clientStatus === "ok" ? "Detected" : "Not running"}
              tone={health?.clientStatus === "ok" ? "ok" : "muted"}
            />
            <AboutRow label="Region" value="Detected automatically" />
          </div>
          <div className="space-y-3 pt-2.5">
            <div className="flex items-center gap-2 text-[12px] text-text-secondary">
              <Activity size={13} className="text-text-muted shrink-0" />
              Reads data from the VALORANT client running on this PC.
            </div>
            <div className="flex items-center gap-2 text-[12px] text-text-secondary">
              <Database size={13} className="text-text-muted shrink-0" />
              Notes and saved players stay local to this machine.
            </div>
            <div className="flex items-center gap-2 text-[12px] text-text-secondary">
              <Globe size={13} className="text-text-muted shrink-0" />
              Server region is detected automatically from the client.
            </div>
          </div>
        </div>

        <div className="mt-4 border border-edge bg-inset rounded-sm px-3 py-2.5 flex gap-2.5">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-text-muted" />
          <p className="text-[12px] text-text-secondary leading-relaxed">
            OPD1 Tracker reads data from the VALORANT client running on this PC. It is not endorsed by Riot Games and
            does not reflect the views of Riot Games or anyone officially involved in producing or managing Riot Games
            properties.
          </p>
        </div>
      </Section>
    </div>
  );
}
