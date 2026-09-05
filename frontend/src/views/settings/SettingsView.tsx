import { Section } from "../../components/ui/Section";
import { PageHeader } from "../../components/shell/PageHeader";
import { useApp } from "../../state/AppContext";

export function SettingsView() {
  const { health } = useApp();

  return (
    <div className="p-5 space-y-4 max-w-5xl" data-testid="settings-view">
      <PageHeader title="Settings" />

      <Section title="About" testId="settings-about-section">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[14px]">
          <div>
            <div className="text-[12px] text-zinc-400">App</div>
            <div className="text-zinc-200 font-semibold">OPD1 Tracker {health?.appVersion ? `v${health.appVersion}` : ""}</div>
          </div>
          <div>
            <div className="text-[12px] text-zinc-400">Data source</div>
            <div className="text-zinc-200 font-semibold">{health?.dataSourcePreference ?? "—"}</div>
          </div>
          <div>
            <div className="text-[12px] text-zinc-400">Riot client</div>
            <div className={`font-semibold ${health?.clientStatus === "ok" ? "text-victory" : "text-zinc-400"}`}>
              {health?.clientStatus === "ok" ? "Detected" : "Not running"}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-zinc-400">Region</div>
            <div className="text-zinc-200 font-semibold">Detected automatically</div>
          </div>
        </div>
        <p className="text-[12px] text-zinc-400 mt-4 max-w-3xl leading-relaxed">
          OPD1 Tracker reads data from the VALORANT client running on this PC. It is not endorsed by Riot Games and
          does not reflect the views of Riot Games or anyone officially involved in producing or managing Riot Games
          properties.
        </p>
      </Section>
    </div>
  );
}
