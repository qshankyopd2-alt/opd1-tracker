import { useState } from "react";
import { Grid3X3, PenTool, Type } from "lucide-react";
import { DrawStudioPanel } from "./DrawStudioPanel";
import { GalleryPanel } from "./GalleryPanel";
import { TextGeneratorPanel } from "./TextGeneratorPanel";
import { PageHeader } from "../../components/shell/PageHeader";

type AsciiTab = "gallery" | "text" | "draw";

const TABS: { id: AsciiTab; label: string; icon: typeof Type }[] = [
  { id: "gallery", label: "Gallery", icon: Grid3X3 },
  { id: "text", label: "Text generator", icon: Type },
  { id: "draw", label: "Draw studio", icon: PenTool },
];

export function AsciiStudioView() {
  const [tab, setTab] = useState<AsciiTab>("gallery");

  return (
    <div className="p-5 space-y-4" data-testid="ascii-studio-view">
      <PageHeader title="ASCII Studio" />

      <nav
        aria-label="ASCII Studio mode"
        className="grid gap-2 rounded-md border border-edge bg-panel p-2 sm:grid-cols-3"
        data-testid="ascii-tabs"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              data-testid={`ascii-tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 rounded-sm border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-brand/40 bg-brand text-ink"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-sm ${
                  active ? "bg-ink/15 text-ink" : "bg-zinc-800/60 text-brand"
                }`}
              >
                <Icon size={17} />
              </span>
              <span className="font-display font-bold uppercase tracking-wide text-sm">{label}</span>
            </button>
          );
        })}
      </nav>

      {tab === "gallery" && <GalleryPanel />}
      {tab === "text" && <TextGeneratorPanel />}
      {tab === "draw" && <DrawStudioPanel />}
    </div>
  );
}
