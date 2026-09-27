import { useEffect, useState } from "react";

export interface WindowModeState {
  isMaximized: boolean;
  mode: "fixed";
  fixedWidth: number;
  fixedHeight: number;
  isTauri: boolean;
}

// The tracker is a single fixed size — 1200×800 — and cannot be maximized
// or resized. There is no maximize control; the native window frame is
// locked to this size (see src-tauri/tauri.conf.json).
export const FIXED_WIDTH = 1200;
export const FIXED_HEIGHT = 800;

export function useWindowMode(): WindowModeState {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window));
  }, []);

  return {
    isMaximized: false,
    mode: "fixed",
    fixedWidth: FIXED_WIDTH,
    fixedHeight: FIXED_HEIGHT,
    isTauri,
  };
}
