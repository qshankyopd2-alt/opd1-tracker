import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, FlipHorizontal2, MoveLeft, MoveRight, Redo2, RotateCcw, Undo2, X } from "lucide-react";
import { copyText } from "./clipboard";
import {
  ASCII_WIDTH,
  BACKGROUND_GLYPHS,
  DRAW_GLYPHS,
  canvasToRows,
  rowsToClipboard,
  rowsToPreview,
} from "./font";

const MIN_ROWS = 3;
const MAX_ROWS = 16;
const DEFAULT_ROWS = 7;
const HISTORY_LIMIT = 20;

type Grid = boolean[][];

function makeGrid(rows: number): Grid {
  return Array.from({ length: rows }, () => Array<boolean>(ASCII_WIDTH).fill(false));
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function DrawStudioPanel() {
  const [height, setHeight] = useState(DEFAULT_ROWS);
  const [grid, setGrid] = useState<Grid>(() => makeGrid(DEFAULT_ROWS));
  const [undoStack, setUndoStack] = useState<Grid[]>([]);
  const [redoStack, setRedoStack] = useState<Grid[]>([]);
  const [draw, setDraw] = useState("█");
  const [background, setBackground] = useState("░");
  const [customDraw, setCustomDraw] = useState("");
  const [copied, setCopied] = useState(false);
  const paint = useRef<{ active: boolean; value: boolean }>({ active: false, value: true });

  useEffect(() => {
    const stopPainting = () => {
      paint.current.active = false;
    };

    window.addEventListener("pointerup", stopPainting);
    window.addEventListener("pointercancel", stopPainting);
    return () => {
      window.removeEventListener("pointerup", stopPainting);
      window.removeEventListener("pointercancel", stopPainting);
    };
  }, []);

  const saveSnapshot = () => {
    setUndoStack((stack) => [...stack.slice(-(HISTORY_LIMIT - 1)), cloneGrid(grid)]);
    setRedoStack([]);
  };

  const beginPaint = (row: number, column: number) => {
    const value = !grid[row][column];
    saveSnapshot();
    paint.current = { active: true, value };
    setGrid((current) => {
      const next = cloneGrid(current);
      next[row][column] = value;
      return next;
    });
  };

  const continuePaint = (row: number, column: number) => {
    if (!paint.current.active) return;
    setGrid((current) => {
      if (current[row]?.[column] === paint.current.value) return current;
      const next = cloneGrid(current);
      next[row][column] = paint.current.value;
      return next;
    });
  };

  const transform = (operation: (current: Grid) => Grid) => {
    saveSnapshot();
    setGrid((current) => operation(current));
  };

  const undo = () => {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack([cloneGrid(grid), ...redoStack].slice(0, HISTORY_LIMIT));
    setGrid(cloneGrid(previous));
  };

  const redo = () => {
    const next = redoStack[0];
    if (!next) return;
    setUndoStack([...undoStack.slice(-(HISTORY_LIMIT - 1)), cloneGrid(grid)]);
    setRedoStack(redoStack.slice(1));
    setGrid(cloneGrid(next));
  };

  const resize = (nextHeight: number) => {
    setHeight(nextHeight);
    setGrid((current) =>
      Array.from({ length: nextHeight }, (_, row) =>
        Array.from({ length: ASCII_WIDTH }, (_, column) => Boolean(current[row]?.[column])),
      ),
    );
  };

  const rows = useMemo(() => canvasToRows(grid, { draw, background }), [background, draw, grid]);
  const preview = useMemo(() => rowsToPreview(rows), [rows]);

  const onCustomDraw = (value: string) => {
    setCustomDraw(value);
    const firstCharacter = [...value][0];
    if (firstCharacter) setDraw(firstCharacter);
  };

  const onCopy = async () => {
    const ok = await copyText(rowsToClipboard(rows));
    if (!ok) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section data-testid="ascii-draw-studio" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="rounded-md border border-edge bg-card p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <ToolButton label="Undo" icon={Undo2} onClick={undo} disabled={undoStack.length === 0} />
            <ToolButton label="Redo" icon={Redo2} onClick={redo} disabled={redoStack.length === 0} />
            <ToolButton
              label="Invert"
              icon={RotateCcw}
              onClick={() => transform((current) => current.map((row) => row.map((cell) => !cell)))}
            />
            <ToolButton
              label="Mirror"
              icon={FlipHorizontal2}
              onClick={() => transform((current) => current.map((row) => row.slice().reverse()))}
            />
            <ToolButton
              label="Shift left"
              icon={MoveLeft}
              onClick={() => transform((current) => current.map((row) => [...row.slice(1), row[0]]))}
            />
            <ToolButton
              label="Shift right"
              icon={MoveRight}
              onClick={() =>
                transform((current) => current.map((row) => [row[row.length - 1], ...row.slice(0, -1)]))
              }
            />
            <ToolButton label="Clear" icon={X} onClick={() => transform(() => makeGrid(height))} />
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_1fr_150px]">
            <div>
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Brush glyph
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DRAW_GLYPHS.slice(0, 8).map((glyph) => (
                  <GlyphButton key={glyph} glyph={glyph} selected={draw === glyph} onClick={() => setDraw(glyph)} />
                ))}
                <input
                  value={customDraw}
                  onChange={(event) => onCustomDraw(event.target.value)}
                  maxLength={2}
                  aria-label="Custom brush glyph"
                  placeholder="+"
                  className="h-8 w-10 rounded-sm border border-edge bg-panel text-center font-code text-sm text-zinc-200 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Background glyph
              </span>
              <div className="flex gap-1.5">
                {BACKGROUND_GLYPHS.map((glyph) => (
                  <GlyphButton
                    key={glyph}
                    glyph={glyph}
                    selected={background === glyph}
                    onClick={() => setBackground(glyph)}
                  />
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Height — {height}
              </span>
              <input
                type="range"
                min={MIN_ROWS}
                max={MAX_ROWS}
                value={height}
                onChange={(event) => resize(Number(event.target.value))}
                className="w-full accent-brand"
              />
            </label>
          </div>

          <div
            className="touch-none overflow-auto rounded-sm border border-edge bg-ink/80 p-2"
            onPointerLeave={() => {
              paint.current.active = false;
            }}
          >
            <div
              className="mx-auto grid select-none gap-px"
              style={{ width: "min(100%, 820px)", gridTemplateColumns: `repeat(${ASCII_WIDTH}, minmax(0, 1fr))` }}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, columnIndex) => (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    type="button"
                    aria-label={`Canvas cell ${rowIndex + 1}, ${columnIndex + 1}`}
                    onPointerDown={() => beginPaint(rowIndex, columnIndex)}
                    onPointerEnter={() => continuePaint(rowIndex, columnIndex)}
                    className={`aspect-square w-full rounded-[2px] border border-white/[0.04] transition-colors ${
                      cell ? "bg-brand shadow-[0_0_5px_rgba(249,115,22,0.45)]" : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  />
                )),
              )}
            </div>
          </div>
          <p className="mt-2 text-[12px] text-zinc-500">Drag to paint. Start on a filled cell to erase.</p>
        </div>

        <div className="rounded-md border border-brand/20 bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">Preview</span>
            <span className="rounded-sm bg-victory/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-victory">
              Chat ready
            </span>
          </div>
          <div className="overflow-auto rounded-sm border border-edge bg-ink/80 p-4">
            <pre className="min-w-max whitespace-pre font-code text-[12px] leading-[1.08] text-zinc-100">
              {preview}
            </pre>
          </div>
          <button
            type="button"
            onClick={() => void onCopy()}
            className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider transition-colors ${
              copied ? "bg-victory text-ink" : "bg-brand text-ink hover:bg-brand-hover"
            }`}
          >
            <Copy size={13} /> {copied ? "Copied" : "Copy paste-ready art"}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-zinc-500">
            Empty cells are filled and rows are joined at VALORANT's 26-cell wrap boundary.
          </p>
        </div>
      </div>
    </section>
  );
}

interface ToolButtonProps {
  label: string;
  icon: typeof Undo2;
  onClick: () => void;
  disabled?: boolean;
}

function ToolButton({ label, icon: Icon, onClick, disabled = false }: ToolButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-sm border border-edge bg-panel px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 transition-colors hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <span className="inline-flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </span>
    </button>
  );
}

interface GlyphButtonProps {
  glyph: string;
  selected: boolean;
  onClick: () => void;
}

function GlyphButton({ glyph, selected, onClick }: GlyphButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-sm border font-code text-sm transition-colors ${
        selected ? "border-brand bg-brand text-ink" : "border-edge bg-panel text-zinc-300 hover:border-brand/40"
      }`}
    >
      {glyph}
    </button>
  );
}
