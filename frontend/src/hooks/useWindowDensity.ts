import { useEffect, useState } from "react";

export type WindowDensity = "compact" | "expanded";

export const COMPACT_WINDOW_WIDTH = 900;
export const EXPANDED_WINDOW_WIDTH = 1400;
export const WINDOW_DENSITY_MIDPOINT = 1150;

export function windowDensityForWidth(width: number): WindowDensity {
  return width < WINDOW_DENSITY_MIDPOINT ? "compact" : "expanded";
}

export function nearestWindowWidth(width: number, availableWidth = Number.POSITIVE_INFINITY): number {
  if (availableWidth < EXPANDED_WINDOW_WIDTH) return COMPACT_WINDOW_WIDTH;
  return windowDensityForWidth(width) === "compact" ? COMPACT_WINDOW_WIDTH : EXPANDED_WINDOW_WIDTH;
}

export function shouldSnapWindow(maximized: boolean, fullscreen: boolean): boolean {
  return !maximized && !fullscreen;
}

export function useWindowDensity(): WindowDensity {
  const [density, setDensity] = useState<WindowDensity>(() => (
    typeof window === "undefined" ? "expanded" : windowDensityForWidth(window.innerWidth)
  ));

  useEffect(() => {
    const onBrowserResize = () => setDensity(windowDensityForWidth(window.innerWidth));
    window.addEventListener("resize", onBrowserResize);

    let cancelled = false;
    let unlisten: (() => void) | undefined;
    let snapTimer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      const { isTauri } = await import("@tauri-apps/api/core");
      if (!isTauri() || cancelled) return;

      const { currentMonitor, getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      unlisten = await appWindow.onResized(({ payload }) => {
        void (async () => {
          const scaleFactor = await appWindow.scaleFactor();
          const logicalWidth = payload.width / scaleFactor;
          const logicalHeight = payload.height / scaleFactor;
          setDensity(windowDensityForWidth(logicalWidth));

          if (snapTimer) clearTimeout(snapTimer);
          snapTimer = setTimeout(() => {
            void (async () => {
              if (!shouldSnapWindow(await appWindow.isMaximized(), await appWindow.isFullscreen())) return;
              const monitor = await currentMonitor();
              const availableWidth = monitor
                ? monitor.workArea.size.width / monitor.scaleFactor
                : Number.POSITIVE_INFINITY;
              const targetWidth = nearestWindowWidth(logicalWidth, availableWidth);
              if (Math.abs(logicalWidth - targetWidth) < 1) return;
              await appWindow.setSize(new LogicalSize(targetWidth, Math.max(600, logicalHeight)));
            })();
          }, 200);
        })();
      });
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onBrowserResize);
      if (snapTimer) clearTimeout(snapTimer);
      unlisten?.();
    };
  }, []);

  return density;
}
