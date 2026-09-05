import { useState } from "react";
import { Bookmark, Crosshair, History, Package, Pin, PinOff, Settings, TrendingUp, Type } from "lucide-react";
import { useApp, type ViewId } from "../../state/AppContext";

const NAV: { id: ViewId; label: string; icon: typeof Crosshair }[] = [
  { id: "live", label: "Live match", icon: Crosshair },
  { id: "competitive", label: "Competitive", icon: TrendingUp },
  { id: "history", label: "Match history", icon: History },
  { id: "encounters", label: "Saved players", icon: Bookmark },
  { id: "collection", label: "Collection", icon: Package },
  { id: "ascii", label: "ASCII studio", icon: Type },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { view, setView, health } = useApp();
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem("opd1:sidebar-pinned") === "true";
    } catch {
      return false;
    }
  });
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isPinned || isHovered;
  const clientOk = health?.clientStatus === "ok";

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("opd1:sidebar-pinned", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <aside
      data-testid="sidebar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 bottom-10 left-0 z-30 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xl overflow-hidden transition-[width] select-none ${
        isExpanded ? "w-[220px]" : "w-16"
      }`}
      style={{
        transitionDuration: "var(--dur-normal)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {/* Header & Pin toggle */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand text-[var(--bg-app)]">
            <Crosshair size={17} />
          </span>
          {isExpanded && (
            <div className="flex flex-col whitespace-nowrap leading-none transition-opacity duration-200">
              <span className="font-display text-[18px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                OPD<span className="text-brand">1</span>
              </span>
              <span className="mt-1 text-[12px] font-medium text-[var(--text-secondary)]">
                Tracker
              </span>
            </div>
          )}
        </div>

        {isExpanded && (
          <button
            type="button"
            data-testid="sidebar-pin-toggle"
            aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            title={isPinned ? "Unpin sidebar (collapse on mouse leave)" : "Pin sidebar (stay open)"}
            onClick={togglePin}
            className={`flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
              isPinned
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={!isExpanded ? label : undefined}
              onClick={() => setView(id)}
              className={`flex h-10 w-full items-center rounded-[var(--radius-sm)] px-3 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                active
                  ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)] border-l-2 border-brand"
                  : "border-l-2 border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Icon
                  size={17}
                  className={active ? "text-brand" : "text-[var(--text-muted)]"}
                />
              </span>
              {isExpanded && (
                <span className="ml-3 truncate whitespace-nowrap text-left">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Client status */}
      <div className="border-t border-[var(--border-subtle)] p-2">
        <div
          data-testid="sidebar-client-status"
          title={clientOk ? "Client detected" : "Client offline"}
          className={`flex h-8 items-center rounded-[var(--radius-sm)] border px-2 text-[12px] font-medium ${
            isExpanded ? "justify-start gap-2" : "justify-center"
          } ${
            clientOk
              ? "border-victory/20 bg-victory/10 text-victory"
              : "border-edge bg-card text-[var(--text-secondary)]"
          }`}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              clientOk ? "bg-victory" : "bg-[var(--text-muted)]"
            }`}
          />
          {isExpanded && (
            <span className="truncate whitespace-nowrap">
              {clientOk ? "Client online" : "Client offline"}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
