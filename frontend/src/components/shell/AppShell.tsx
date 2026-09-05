import type { ReactNode } from "react";
import { LiveDataProvider } from "../../state/LiveDataContext";
import { useWindowMode } from "../../hooks/useWindowMode";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";

export function AppShell({ children }: { children: ReactNode }) {
  const { mode, isMaximized } = useWindowMode();

  return (
    <LiveDataProvider>
      <div
        className="h-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)]"
        data-window-mode={mode}
        data-is-maximized={isMaximized}
      >
        <div className="flex-1 flex min-h-0 relative">
          <Sidebar />
          <main
            data-testid="main-content"
            className="flex-1 min-w-0 ml-16 overflow-y-auto bg-[var(--bg-app)]"
          >
            <div className="w-full max-w-[1800px] mx-auto h-full flex flex-col">
              {children}
            </div>
          </main>
        </div>
        <StatusBar />
      </div>
    </LiveDataProvider>
  );
}
