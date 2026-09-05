import { useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import { copyText } from "./clipboard";
import { chunkRows, rowsToClipboard, rowsToPreview } from "./font";
import { GALLERY, GALLERY_CATEGORIES, type GalleryCategory } from "./gallery";

function categoryCount(category: GalleryCategory): number {
  if (category === "All") return GALLERY.length;
  return GALLERY.filter((piece) => piece.category === category).length;
}

export function GalleryPanel() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GalleryCategory>("All");
  const [copied, setCopied] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...GALLERY].reverse().filter((piece) => {
      if (category !== "All" && piece.category !== category) return false;
      if (!q) return true;
      return `${piece.name} ${piece.category}`.toLowerCase().includes(q);
    });
  }, [query, category]);

  const onCopy = async (id: string, content: string) => {
    const ok = await copyText(rowsToClipboard(chunkRows(content)));
    if (ok) {
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1400);
    }
  };

  return (
    <section data-testid="ascii-gallery" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border border-edge bg-panel p-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search chat art</span>
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pieces by name or category…"
            className="h-9 w-full rounded-sm border border-edge bg-ink pl-8 pr-3 text-[13px] text-zinc-100 placeholder:text-zinc-500"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="ascii-categories">
        {GALLERY_CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              aria-pressed={active}
              data-testid={`ascii-category-${cat.toLowerCase()}`}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${
                active
                  ? "border-brand bg-brand text-ink"
                  : "border-edge bg-card text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {cat} <span className={active ? "text-ink/65" : "text-zinc-400"}>{categoryCount(cat)}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-[12px] text-zinc-400">No chat art matches your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 stagger">
          {rows.map((piece) => {
            const isCopied = copied === piece.id;
            const preview = rowsToPreview(chunkRows(piece.content));
            return (
              <article
                key={piece.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-md border border-edge bg-card transition-colors hover:border-brand/40"
                data-testid="ascii-piece"
              >
                <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display font-semibold text-sm" title={piece.name}>
                      {piece.name}
                    </h3>
                    <div className="mt-0.5 text-[12px] text-zinc-400">{piece.category}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void onCopy(piece.id, piece.content)}
                  className="relative mx-3 grid min-h-[150px] flex-1 place-items-center overflow-auto rounded-sm border border-edge bg-ink/70 p-3 text-left"
                  aria-label={`Copy ${piece.name}`}
                >
                  <pre className="whitespace-pre font-code text-[9px] leading-[1.05] text-zinc-200">
                    {preview}
                  </pre>
                </button>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => void onCopy(piece.id, piece.content)}
                    data-testid={`copy-${piece.id}`}
                    className={`inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-[12px] font-semibold transition-colors ${
                      isCopied
                        ? "bg-victory text-ink"
                        : "bg-brand text-ink hover:bg-brand-hover"
                    }`}
                  >
                    <Copy size={13} /> {isCopied ? "Copied" : "Copy art"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
