import { AppProvider, useApp } from "./state/AppContext";
import { AppShell } from "./components/shell/AppShell";
import { LiveView } from "./views/live/LiveView";
import { CompetitiveView } from "./views/competitive/CompetitiveView";
import { HistoryView } from "./views/history/HistoryView";
import { EncountersView } from "./views/encounters/EncountersView";
import { CollectionView } from "./views/collection/CollectionView";
import { AsciiStudioView } from "./views/ascii/AsciiStudioView";
import { SettingsView } from "./views/settings/SettingsView";
import { DesignModeBar } from "./dev/DesignModeBar";

function CurrentView() {
  const { view } = useApp();
  switch (view) {
    case "live":
      return <LiveView />;
    case "competitive":
      return <CompetitiveView />;
    case "history":
      return <HistoryView />;
    case "encounters":
      return <EncountersView />;
    case "collection":
      return <CollectionView />;
    case "ascii":
      return <AsciiStudioView />;
    case "settings":
      return <SettingsView />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <CurrentView />
      </AppShell>
      <DesignModeBar />
    </AppProvider>
  );
}
