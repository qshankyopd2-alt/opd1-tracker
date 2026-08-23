import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { backend } from "../api/client";
import type { Health } from "../api/types";
import { usePoll } from "../hooks/usePoll";

export type ViewId =
  | "live"
  | "competitive"
  | "history"
  | "encounters"
  | "collection"
  | "ascii"
  | "settings";

interface AppState {
  view: ViewId;
  setView: (v: ViewId) => void;
  health: Health | null;
  healthError: string | null;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>("live");

  const { data: health, error: healthError } = usePoll(() => backend.health(), 10000);

  const value = useMemo<AppState>(
    () => ({
      view,
      setView,
      health,
      healthError,
    }),
    [view, health, healthError],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}
