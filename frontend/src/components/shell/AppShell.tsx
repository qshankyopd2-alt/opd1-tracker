import type { ReactNode } from "react";
import { LiveDataProvider } from "../../state/LiveDataContext";
import { useWindowDensity } from "../../hooks/useWindowDensity";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";

export function AppShell({ children }: { children: ReactNode }) {
  const density = useWindowDensity();

  return (
    <LiveDataProvider>
      <div className="h-full flex flex-col" data-window-density={density}>
        <div className="flex-1 flex min-h-0">
          <Sidebar />
          <main data-testid="main-content" className="flex-1 min-w-0 overflow-y-auto bg-ink">
            {children}
          </main>
        </div>
        <StatusBar />
      </div>
    </LiveDataProvider>
  );
}
