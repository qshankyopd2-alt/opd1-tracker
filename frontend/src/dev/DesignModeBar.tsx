import { useEffect, useState } from "react";
import { PREVIEW_VIEWS, applyDesignView, isDesignMode, type PreviewViewId } from "./designMode";

export function DesignModeBar() {
  const enabled = isDesignMode();
  const [view, setView] = useState<PreviewViewId>("live-ingame");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    applyDesignView(view);
    window.dispatchEvent(new CustomEvent("opd1:design-view", { detail: view }));
  }, [view, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail as PreviewViewId;
      if (PREVIEW_VIEWS.some((v) => v.id === next)) {
        applyDesignView(next);
        setView(next);
      }
    };
    window.addEventListener("opd1:design-view-set", handler as EventListener);
    return () => window.removeEventListener("opd1:design-view-set", handler as EventListener);
  }, [enabled]);

  if (!enabled) return null;

  const groups: Record<string, { id: PreviewViewId; label: string }[]> = {};
  for (const v of PREVIEW_VIEWS) {
    groups[v.group] ??= [];
    groups[v.group].push({ id: v.id, label: v.label });
  }

  return (
    <div
      data-testid="design-mode-bar"
      className="fixed bottom-1 right-2 z-50 flex flex-col items-end gap-2"
      style={{ fontFamily: "Fira Code, Consolas, monospace" }}
    >
      {open && (
        <div
          data-testid="design-mode-panel"
          className="max-h-[70vh] w-[420px] overflow-y-auto rounded-md border border-brand/60 bg-panel p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.2em] text-brand font-bold">Design Harness</div>
            <div className="text-[9px] text-zinc-500">DEV ONLY</div>
          </div>
          <div className="space-y-3">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">{group}</div>
                <div className="grid grid-cols-1 gap-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setView(item.id);
                        applyDesignView(item.id);
                      }}
                      className={`text-left rounded-sm border px-2 py-1.5 text-[11px] transition-colors ${
                        view === item.id
                          ? "border-brand bg-brand/15 text-zinc-100"
                          : "border-edge bg-card text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-edge pt-2 text-[9px] text-zinc-500 leading-relaxed">
            <div>Fixtures only run when VITE_DESIGN_MODE=true (dev). Production builds never see this panel.</div>
            <div className="mt-1">Source payload keeps <code>source: "local"</code> so the real <code>showBoard</code> gate still works.</div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-sm border border-brand bg-panel px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-brand hover:bg-brand/15 transition-colors"
      >
        {open ? "×" : "D"} Design · {view}
      </button>
    </div>
  );
}
