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
    <aside data-testid="sidebar" className="flex w-16 shrink-0 flex-col border-r border-edge bg-panel lg:w-52">
      <div className="border-b border-edge bg-zinc-900/50 px-3 py-4 lg:px-4 lg:pb-4 lg:pt-5">
        <div className="flex items-center justify-center gap-2.5 lg:justify-start">
          <span className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-brand-hover bg-brand">
            <Crosshair size={15} className="text-white" />
          </span>
          <span className="hidden font-display text-[22px] font-black italic leading-none tracking-tight text-zinc-100 lg:inline">
            OPD<span className="text-brand">1</span>
          </span>
        </div>
        <div className="ml-[38px] mt-1.5 hidden text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500 lg:block">Tracker</div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              aria-label={label}
              title={label}
              onClick={() => setView(id)}
              className={`flex w-full items-center justify-center gap-3 border-l-2 px-2 py-2.5 text-[13px] font-semibold transition-colors duration-200 lg:justify-start lg:px-3 ${
                active
                  ? "border-brand bg-zinc-800/70 text-zinc-100"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <Icon size={16} className={active ? "text-brand" : "text-zinc-500"} />
              <span className="hidden lg:inline">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-edge p-2 lg:p-3">
        <div
          data-testid="sidebar-client-status"
          title={clientOk ? "Client detected" : "Client offline"}
          className={`flex items-center justify-center gap-2 rounded-sm border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider lg:justify-start ${
            clientOk
              ? "bg-victory/10 text-victory border-victory/20"
              : "bg-defeat/10 text-defeat border-defeat/20"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${clientOk ? "bg-victory pulse-dot" : "bg-defeat"}`}
          />
          <span className="hidden lg:inline">{clientOk ? "CLIENT DETECTED" : "CLIENT OFFLINE"}</span>
        </div>
      </div>
    </aside>
  );
}
