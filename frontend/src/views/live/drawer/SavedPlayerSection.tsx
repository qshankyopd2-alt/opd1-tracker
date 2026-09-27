import { Bookmark, ChevronDown, Save, Trash2 } from "lucide-react";

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
    <section id="drawer-player-note" className="border-t border-edge py-3" data-testid="drawer-saved-player">
      <h3 className="micro-label mb-2 flex items-center gap-2">
        <span className="section-tick" aria-hidden="true" /> Player note
      </h3>
      <div className="min-w-0 rounded-sm border border-edge bg-card">
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left"
          data-testid="drawer-note-toggle"
          aria-expanded={expanded}
        >
          <Bookmark size={13} className={`shrink-0 ${saved ? "text-gold" : "text-text-secondary"}`} fill={saved ? "currentColor" : "none"} />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-bold text-text-primary">{saved ? "Saved note" : "Save this player"}</span>
            <span className="mt-0.5 block truncate text-[12px] text-text-muted">{note.trim() || "No note added"}</span>
          </span>
          <ChevronDown size={14} className={`shrink-0 text-text-muted transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div id="drawer-player-note-content" className="overflow-hidden border-t border-edge">
            <div className="p-3">
              <textarea
                aria-label="Player note"
                data-testid="drawer-note-input"
                value={note}
                maxLength={500}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Add a note you want to see next time this player appears…"
                className="min-h-16 w-full resize-y rounded-sm border border-edge bg-inset px-2.5 py-2 text-[12px] text-text-secondary placeholder:text-text-muted focus:border-accent focus-visible:ring-1 focus-visible:ring-accent"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={savedBusy}
                    onClick={onSave}
                    data-testid="drawer-note-save"
                    className="inline-flex items-center gap-1.5 rounded-sm bg-brand px-2.5 py-1.5 text-[12px] font-bold text-ink transition-colors hover:bg-brand-hover disabled:opacity-50"
                  >
                    <Save size={12} /> {saved ? "Save note" : "Save player"}
                  </button>
                  {saved && (
                    <button
                      type="button"
                      disabled={savedBusy}
                      onClick={onRemove}
                      data-testid="drawer-note-remove"
                      className="inline-flex items-center gap-1.5 rounded-sm border border-edge px-2.5 py-1.5 text-[12px] font-bold text-text-muted transition-colors hover:text-defeat disabled:opacity-50"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>
                <span className="num text-[11.5px] text-text-muted tabular-nums">{note.length}/500</span>
              </div>
            </div>
          </div>
        )}
        {savedMessage && (
          <p className="border-t border-edge px-3 py-2 text-[12px] text-text-secondary" role="status">
            {savedMessage}
          </p>
        )}
      </div>
    </section>
  );
}
