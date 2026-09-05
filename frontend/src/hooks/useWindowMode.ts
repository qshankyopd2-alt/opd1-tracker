import { useEffect, useState, useCallback } from "react";

export interface WindowModeState {
  isMaximized: boolean;
  mode: "fixed" | "maximized";
  fixedWidth: number;
  fixedHeight: number;
  isTauri: boolean;
  toggleMode: () => Promise<void>;
}

export const FIXED_WIDTH = 1200;
export const FIXED_HEIGHT = 700;


export function useWindowMode(): WindowModeState {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let isMounted = true;
    const isTauriEnv = typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
    setIsTauri(isTauriEnv);

    if (isTauriEnv) {
      import("@tauri-apps/api/window").then(async ({ getCurrentWindow }) => {
        if (!isMounted) return;
        try {
          const appWin = getCurrentWindow();
          const maximized = await appWin.isMaximized();
          if (!isMounted) return;
          setIsMaximized(maximized);
          if (!maximized) {
            await appWin.setResizable(false);
          }

          const unsubscribe = await appWin.onResized(async () => {
            try {
              const max = await appWin.isMaximized();
              if (isMounted) {
                setIsMaximized(max);
                if (!max) {
                  await appWin.setResizable(false);
                }
              }
            } catch {
              // Ignore resize check errors during teardown
            }
          });
          if (!isMounted) {
            unsubscribe();
          } else {
            unlisten = unsubscribe;
          }
        } catch (err) {
          console.warn("Tauri window API init warning:", err);
        }
      }).catch(() => {});
    } else if (typeof window !== "undefined") {
      const checkMax = () => {
        const availW = typeof screen !== "undefined" ? screen.availWidth : 1920;
        setIsMaximized(window.innerWidth >= availW * 0.9);
      };
      checkMax();
      window.addEventListener("resize", checkMax);
      return () => {
        isMounted = false;
        window.removeEventListener("resize", checkMax);
      };
    }

    return () => {
      isMounted = false;
      if (unlisten) unlisten();
    };
  }, []);

  const toggleMode = useCallback(async () => {
    const isTauriEnv = typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
    if (isTauriEnv) {
      try {
        const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
        const appWin = getCurrentWindow();
        const currentlyMax = await appWin.isMaximized();
        if (currentlyMax) {
          // Returning to fixed mode: unmaximize, resize to 1200x700, lock resizing, center
          await appWin.unmaximize();
          await appWin.setSize(new LogicalSize(FIXED_WIDTH, FIXED_HEIGHT));
          await appWin.setResizable(false);
          await appWin.center();
          setIsMaximized(false);
        } else {
          // Maximizing: allow resizing, then maximize
          await appWin.setResizable(true);
          await appWin.maximize();
          setIsMaximized(true);
        }
        return;
      } catch (err) {
        console.warn("Tauri window toggle failed, falling back to state toggle:", err);
      }
    }
    // Fallback for non-Tauri / test environments
    setIsMaximized((prev) => !prev);
  }, []);

  const mode = isMaximized ? "maximized" : "fixed";
  return {
    isMaximized,
    mode,
    fixedWidth: FIXED_WIDTH,
    fixedHeight: FIXED_HEIGHT,
    isTauri,
    toggleMode,
  };
}
