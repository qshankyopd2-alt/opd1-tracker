import { Bookmark, Crosshair, History, Package, Settings, TrendingUp, Type } from "lucide-react";
import { useApp, type ViewId } from "../../state/AppContext";

const NAV: { id: ViewId; label: string; icon: typeof Crosshair }[] = [
  { id: "live", label: "Live Match", icon: Crosshair },
  { id: "competitive", label: "Competitive", icon: TrendingUp },
  { id: "history", label: "Match History", icon: History },
  { id: "encounters", label: "Saved Players", icon: Bookmark },
  { id: "collection", label: "Collection", icon: Package },
  { id: "ascii", label: "ASCII Studio", icon: Type },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { view, setView, health } = useApp();
  const clientOk = health?.clientStatus === "ok";

  return (
    <aside data-testid="sidebar" className="w-52 shrink-0 border-r border-edge bg-panel flex flex-col">
      <div className="px-4 pt-5 pb-4 border-b border-edge">
        <div className="flex items-center gap-2">
          <span className="w-3 h-6 bg-brand rounded-[2px]" />
          <span className="font-display italic font-black text-[26px] leading-none tracking-tight">
            OPD<span className="text-brand">1</span>
          </span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 mt-1 ml-5">Tracker</div>
      </div>

      <nav className="flex-1 py-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              onClick={() => setView(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium border-l-2 transition-colors ${
                active
                  ? "border-brand bg-zinc-800/60 text-zinc-100"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              }`}
            >
              <Icon size={16} className={active ? "text-brand" : ""} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-edge space-y-1.5">
        <div data-testid="sidebar-client-status" className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span
            className={`w-2 h-2 rounded-full ${clientOk ? "bg-victory pulse-dot" : "bg-zinc-600"}`}
          />
          {clientOk ? "VALORANT client detected" : "VALORANT not running"}
        </div>
      </div>
    </aside>
  );
}
