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
      <div className="px-4 pt-5 pb-4 border-b border-edge bg-zinc-900/50">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-brand-hover bg-brand">
            <Crosshair size={15} className="text-white" />
          </span>
          <span className="font-display italic font-black text-[22px] leading-none tracking-tight text-zinc-100">
            OPD<span className="text-brand">1</span>
          </span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 mt-1.5 ml-[38px] font-bold">Tracker</div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              onClick={() => setView(id)}
              aria-current={active ? "page" : undefined}
              className={`flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset ${
                active
                  ? "border-brand bg-zinc-800/70 text-zinc-100"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <Icon size={16} className={active ? "text-brand" : "text-zinc-500"} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-edge">
        <div
          data-testid="sidebar-client-status"
          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-sm border ${
            clientOk
              ? "bg-victory/10 text-victory border-victory/20"
              : "bg-defeat/10 text-defeat border-defeat/20"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${clientOk ? "bg-victory pulse-dot" : "bg-defeat"}`}
          />
          {clientOk ? "CLIENT DETECTED" : "CLIENT OFFLINE"}
        </div>
      </div>
    </aside>
  );
}
