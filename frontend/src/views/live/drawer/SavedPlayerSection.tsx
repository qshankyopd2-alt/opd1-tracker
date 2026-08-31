import { Bookmark, ChevronDown, Save, Trash2 } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";

export function SavedPlayerSection({
  saved,
  note,
  expanded,
  savedBusy,
  savedMessage,
  onExpandedChange,
  onNoteChange,
  onSave,
  onRemove,
}: {
  saved: boolean;
  note: string;
  expanded: boolean;
  savedBusy: boolean;
  savedMessage: string | null;
  onExpandedChange: (expanded: boolean) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  return (
    <section id="drawer-player-note" className="grid grid-cols-[104px_minmax(0,1fr)] py-3 max-[560px]:grid-cols-1 max-[560px]:gap-2" data-testid="drawer-saved-player">
      <h3 className="text-[11px] font-semibold text-zinc-400">Player note</h3>
      <Accordion.Root type="single" collapsible value={expanded ? "note" : ""} onValueChange={(value) => onExpandedChange(value === "note")} className="min-w-0 border border-amber-400/30 bg-amber-400/5">
        <Accordion.Item value="note"><Accordion.Header><Accordion.Trigger
          className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left"
          data-testid="drawer-note-toggle"
        >
          <Bookmark size={13} className="shrink-0 text-amber-300" fill={saved ? "currentColor" : "none"} />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-amber-200">{saved ? "Saved note" : "Save this player"}</span>
            <span className="mt-0.5 block truncate text-[10px] text-zinc-500">{note.trim() || "No note added"}</span>
          </span>
          <ChevronDown size={14} className={`shrink-0 text-zinc-500 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
        </Accordion.Trigger></Accordion.Header>

        <Accordion.Content id="drawer-player-note-content" className="overflow-hidden border-t border-amber-400/20 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"><div className="p-3">
            <textarea
              value={note}
              maxLength={500}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Add a note you want to see next time this player appears…"
              className="min-h-16 w-full resize-y rounded-sm border border-edge bg-ink px-2.5 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" disabled={savedBusy} onClick={onSave} className="inline-flex items-center gap-1.5 rounded-sm bg-amber-300 px-2.5 py-1.5 text-[11px] font-semibold text-ink disabled:opacity-50">
                  <Save size={12} /> {saved ? "Save note" : "Save player"}
                </button>
                {saved && (
                  <button type="button" disabled={savedBusy} onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-sm border border-edge px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 hover:text-defeat disabled:opacity-50">
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 tabular-nums">{note.length}/500</span>
            </div>
          </div></Accordion.Content>
          {savedMessage && <p className="border-t border-amber-400/20 px-3 py-2 text-[10px] text-zinc-400" role="status">{savedMessage}</p>}
        </Accordion.Item>
      </Accordion.Root>
    </section>
  );
}
