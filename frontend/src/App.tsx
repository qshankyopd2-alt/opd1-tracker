import { lazy, Suspense } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { AppProvider, useApp } from "./state/AppContext";
import { AppShell } from "./components/shell/AppShell";
import { LiveView } from "./views/live/LiveView";
import { CompetitiveView } from "./views/competitive/CompetitiveView";
import { HistoryView } from "./views/history/HistoryView";
import { EncountersView } from "./views/encounters/EncountersView";
import { CollectionView } from "./views/collection/CollectionView";
import { AsciiStudioView } from "./views/ascii/AsciiStudioView";
import { SettingsView } from "./views/settings/SettingsView";

const DesignModeBar = import.meta.env.DEV
  ? lazy(async () => ({ default: (await import("./dev/DesignModeBar")).DesignModeBar }))
  : null;

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
    <Tooltip.Provider delayDuration={400} skipDelayDuration={150}><AppProvider>
      <AppShell>
        <CurrentView />
      </AppShell>
      {DesignModeBar && (
        <Suspense fallback={null}>
          <DesignModeBar />
        </Suspense>
      )}
    </AppProvider></Tooltip.Provider>
  );
}
