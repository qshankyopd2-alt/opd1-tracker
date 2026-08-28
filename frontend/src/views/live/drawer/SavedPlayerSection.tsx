import { Bookmark, Save, Trash2 } from "lucide-react";

export function SavedPlayerSection({
  saved,
  note,
  savedBusy,
  savedMessage,
  onNoteChange,
  onSave,
  onRemove,
}: {
  saved: boolean;
  note: string;
  savedBusy: boolean;
  savedMessage: string | null;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  return (
    <section className="rounded-sm border border-amber-400/25 bg-amber-400/5 p-3" data-testid="drawer-saved-player">
      <div className="mb-2 flex items-center gap-2">
        <Bookmark size={13} className="text-amber-300" fill={saved ? "currentColor" : "none"} />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
          {saved ? "Saved player" : "Save this player"}
        </h3>
      </div>
      <textarea
        value={note}
        maxLength={500}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="Add a note you want to see next time this player appears…"
        className="min-h-16 w-full resize-y rounded-sm border border-edge bg-ink px-2.5 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={savedBusy}
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-sm bg-amber-300 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink disabled:opacity-50"
        >
          <Save size={11} /> {saved ? "Save note" : "Save player"}
        </button>
        {saved && (
          <button
            type="button"
            disabled={savedBusy}
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-sm border border-edge px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-defeat disabled:opacity-50"
          >
            <Trash2 size={11} /> Remove
          </button>
        )}
        <span className="ml-auto text-[9px] text-zinc-600 num">{note.length}/500</span>
      </div>
      {savedMessage && <p className="mt-2 text-[10px] text-zinc-400">{savedMessage}</p>}
    </section>
  );
}
