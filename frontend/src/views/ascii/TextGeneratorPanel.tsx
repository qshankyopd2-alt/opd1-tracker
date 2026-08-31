import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { copyText } from "./clipboard";
import {
  BACKGROUND_GLYPHS,
  DRAW_GLYPHS,
  generateTextRows,
  rowsToClipboard,
  rowsToPreview,
} from "./font";

export function TextGeneratorPanel() {
  const [text, setText] = useState("");
  const [draw, setDraw] = useState("█");
  const [background, setBackground] = useState("░");
  const [gap, setGap] = useState(1);
  const [copied, setCopied] = useState(false);
  const rows = useMemo(
    () => generateTextRows(text, { draw, background, gap }),
    [background, draw, gap, text],
  );
  const preview = useMemo(() => rowsToPreview(rows), [rows]);

  const onCopy = async () => {
    if (rows.length === 0) return;
    const ok = await copyText(rowsToClipboard(rows));
    if (!ok) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section data-testid="ascii-text-generator" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="space-y-5 rounded-md border border-edge bg-card p-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Your text
            </span>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type up to 16 characters…"
              maxLength={16}
              className="h-11 w-full rounded-sm border border-edge bg-ink px-3 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </label>

          <div>
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Letter glyph
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DRAW_GLYPHS.map((glyph) => (
                <button
                  key={glyph}
                  type="button"
                  onClick={() => setDraw(glyph)}
                  className={`grid h-8 w-8 place-items-center rounded-sm border font-code text-sm transition-colors ${
                    draw === glyph
                      ? "border-brand bg-brand text-ink"
                      : "border-edge bg-panel text-zinc-300 hover:border-brand/40"
                  }`}
                >
                  {glyph}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div>
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Background glyph
              </span>
              <div className="flex gap-1.5">
                {BACKGROUND_GLYPHS.map((glyph) => (
                  <button
                    key={glyph}
                    type="button"
                    onClick={() => setBackground(glyph)}
                    className={`grid h-8 w-8 place-items-center rounded-sm border font-code text-sm transition-colors ${
                      background === glyph
                        ? "border-brand bg-brand text-ink"
                        : "border-edge bg-panel text-zinc-300 hover:border-brand/40"
                    }`}
                  >
                    {glyph}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Letter gap — {gap}
              </span>
              <input
                type="range"
                min={1}
                max={4}
                value={gap}
                onChange={(event) => setGap(Number(event.target.value))}
                className="w-full accent-brand"
              />
            </label>
          </div>
        </div>

        <div className="rounded-md border border-brand/20 bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">Preview</span>
            {rows.length > 0 ? (
              <span className="rounded-sm bg-victory/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-victory">
                Chat ready
              </span>
            ) : null}
          </div>
          <div className="overflow-auto rounded-sm border border-edge bg-ink/80 p-4">
            {rows.length > 0 ? (
              <pre className="min-w-max whitespace-pre font-code text-[12px] leading-[1.08] text-zinc-100">
                {preview}
              </pre>
            ) : (
              <p className="py-8 text-center text-[12px] text-zinc-600">Type something to see its banner.</p>
            )}
          </div>
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() => void onCopy()}
            className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 ${
              copied ? "bg-victory text-ink" : "bg-brand text-ink hover:bg-brand-hover"
            }`}
          >
            <Copy size={13} /> {copied ? "Copied" : "Copy paste-ready art"}
          </button>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-zinc-500">
        Each row is exactly 26 cells. Rows are joined with chat-safe wrap points when copied.
      </p>
    </section>
  );
}
