import { useState } from "react";
import { Bookmark, Crosshair, History, Package, Pin, PinOff, Settings, TrendingUp, Type } from "lucide-react";
import { useApp, type ViewId } from "../../state/AppContext";

const NAV = [
  { id: "live", label: "Live match", short: "Live", icon: Crosshair },
  { id: "competitive", label: "Competitive", short: "Rank", icon: TrendingUp },
  { id: "history", label: "Match history", short: "History", icon: History },
  { id: "encounters", label: "Saved players", short: "Players", icon: Bookmark },
  { id: "collection", label: "Collection", short: "Skins", icon: Package },
  { id: "ascii", label: "ASCII studio", short: "Studio", icon: Type },
  { id: "settings", label: "Settings", short: "Settings", icon: Settings },
] satisfies { id: ViewId; label: string; short: string; icon: typeof Crosshair }[];

export function Sidebar() {
  const { view, setView, health } = useApp();
  const [pinned, setPinned] = useState(() => {
    try { return localStorage.getItem("opd1:sidebar-pinned") === "true"; } catch { return false; }
  });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = pinned || hovered || focused;
  return (
    <aside className="opd-navigation" data-testid="sidebar" data-sidebar-pinned={pinned} data-expanded={expanded}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="opd-wordmark"><span className="font-display">OPD<span className="text-brand">1</span></span>{expanded && <span className="text-[12px] text-text-secondary">TRACKER</span>}</div>
      <nav aria-label="Main navigation">
        {NAV.map(({ id, label, short, icon: Icon }, index) => (
          <button key={id} type="button" data-testid={`nav-${id}`} aria-label={label} aria-current={view === id ? "page" : undefined}
            onClick={() => setView(id)} className="opd-nav-item">
            <Icon size={19} aria-hidden="true" /><span>{expanded ? label : short}</span>
            {expanded && <span className="opd-nav-index">0{index + 1}</span>}
          </button>
        ))}
      </nav>
      <div className="opd-nav-footer">
        <button type="button" data-testid="sidebar-pin-toggle" aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"} aria-pressed={pinned}
          onClick={() => { const next = !pinned; setPinned(next); try { localStorage.setItem("opd1:sidebar-pinned", String(next)); } catch {} }}>
          {pinned ? <PinOff size={16} /> : <Pin size={16} />}{expanded && <span>{pinned ? "Collapse navigation" : "Keep navigation open"}</span>}
        </button>
        {expanded && <span data-testid="sidebar-client-status" className="text-[12px] text-text-secondary">{health?.clientStatus === "ok" ? "Client connected" : "Waiting for client"}</span>}
      </div>
    </aside>
  );
}
