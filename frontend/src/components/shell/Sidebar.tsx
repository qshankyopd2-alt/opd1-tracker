import { useState } from "react";
import { Bookmark, Crosshair, History, Package, Pin, PinOff, Settings, TrendingUp, Type } from "lucide-react";
import { useApp, type ViewId } from "../../state/AppContext";
import { useLiveData } from "../../state/LiveDataContext";

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
  const { isLive, board } = useLiveData();
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
  const inAction = isLive && (board?.state === "INGAME" || board?.state === "PREGAME");

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("opd1:sidebar-pinned", String(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  return (
    <aside
      data-testid="sidebar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col overflow-hidden border-r border-edge bg-panel select-none transition-[width] ${
        isExpanded ? "w-[216px]" : "w-16"
      }`}
      style={{
        transitionDuration: "var(--dur-normal)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {/* Brand row — aligned with the command bar height */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-edge pl-3 pr-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent text-white">
          <Crosshair size={17} strokeWidth={2.5} />
        </span>
        {isExpanded && (
          <div className="flex min-w-0 flex-col whitespace-nowrap leading-none transition-opacity duration-200">
            <span className="font-display text-[16px] font-bold tracking-[0.02em] text-text-primary">
              OPD<span className="text-accent">1</span>
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              Tracker
            </span>
          </div>
        )}
        {isExpanded && (
          <button
            type="button"
            data-testid="sidebar-pin-toggle"
            aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            title={isPinned ? "Unpin sidebar (collapse on mouse leave)" : "Pin sidebar (stay open)"}
            onClick={togglePin}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
              isPinned
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-edge bg-card text-text-muted hover:text-text-primary"
            }`}
          >
            {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`nav-${id}`}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={!isExpanded ? label : undefined}
              onClick={() => setView(id)}
              className={`relative flex h-10 w-full items-center rounded-sm pr-2 text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "bg-card text-text-primary"
                  : "text-text-secondary hover:bg-card/60 hover:text-text-primary"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm ${
                  active ? "bg-accent" : "bg-transparent"
                }`}
              />
              <span className="flex h-5 w-5 shrink-0 items-center justify-center pl-3">
                <Icon size={17} className={active ? "text-accent" : "text-text-muted"} />
              </span>
              {isExpanded && (
                <span className="ml-2.5 truncate whitespace-nowrap text-left">{label}</span>
              )}
              {isExpanded && id === "live" && inAction && (
                <span className="ml-auto mr-1 h-1.5 w-1.5 shrink-0 rounded-full bg-victory pulse-dot" aria-label="Match in progress" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Client status */}
      <div className="shrink-0 border-t border-edge p-2">
        <div
          data-testid="sidebar-client-status"
          title={clientOk ? "Riot client detected" : "Riot client offline"}
          className={`flex h-8 items-center rounded-sm border px-2 text-[11px] font-semibold ${
            isExpanded ? "gap-2 pl-3" : "justify-center"
          } ${clientOk ? "border-victory/25 bg-victory/10 text-victory" : "border-edge bg-card text-text-muted"}`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${clientOk ? "bg-victory" : "bg-text-muted"}`} />
          {isExpanded && <span className="truncate whitespace-nowrap">{clientOk ? "Client online" : "Client offline"}</span>}
        </div>
      </div>
    </aside>
  );
}
