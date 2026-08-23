export const ASCII_WIDTH = 26;

export const DRAW_GLYPHS = [
  "█",
  "▓",
  "▒",
  "░",
  "■",
  "▄",
  "▀",
  "▌",
  "▐",
  "─",
  "═",
  "║",
  "╔",
  "╗",
  "╚",
  "╝",
  "╠",
  "╣",
  "╬",
  "♥",
  "♦",
  "♣",
  "♠",
] as const;

export const BACKGROUND_GLYPHS = ["░", "▒", "▓", "█", "─"] as const;

const RAW_FONT: Record<string, string[]> = {
  " ": ["   ", "   ", "   ", "   ", "   "],
  A: [" ## ", "#  #", "####", "#  #", "#  #"],
  B: ["### ", "#  #", "### ", "#  #", "### "],
  C: [" ###", "#   ", "#   ", "#   ", " ###"],
  D: ["### ", "#  #", "#  #", "#  #", "### "],
  E: ["####", "#   ", "### ", "#   ", "####"],
  F: ["####", "#   ", "### ", "#   ", "#   "],
  G: [" ###", "#   ", "# ##", "#  #", " ###"],
  H: ["#  #", "#  #", "####", "#  #", "#  #"],
  I: ["###", " # ", " # ", " # ", "###"],
  J: ["####", "   #", "   #", "#  #", " ## "],
  K: ["#  #", "# # ", "##  ", "# # ", "#  #"],
  L: ["#   ", "#   ", "#   ", "#   ", "####"],
  M: ["#   #", "## ##", "# # #", "#   #", "#   #"],
  N: ["#   #", "##  #", "# # #", "#  ##", "#   #"],
  O: [" ## ", "#  #", "#  #", "#  #", " ## "],
  P: ["### ", "#  #", "### ", "#   ", "#   "],
  Q: [" ## ", "#  #", "#  #", "# ##", " ###"],
  R: ["### ", "#  #", "### ", "# # ", "#  #"],
  S: [" ###", "#   ", " ## ", "   #", "### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  "],
  U: ["#  #", "#  #", "#  #", "#  #", " ## "],
  V: ["#   #", "#   #", "#   #", " # # ", "  #  "],
  W: ["#   #", "#   #", "# # #", "## ##", "#   #"],
  X: ["#   #", " # # ", "  #  ", " # # ", "#   #"],
  Y: ["#   #", " # # ", "  #  ", "  #  ", "  #  "],
  Z: ["####", "  # ", " #  ", "#   ", "####"],
  "0": [" ## ", "#  #", "#  #", "#  #", " ## "],
  "1": [" # ", "## ", " # ", " # ", "###"],
  "2": ["### ", "   #", " ## ", "#   ", "####"],
  "3": ["### ", "   #", " ## ", "   #", "### "],
  "4": ["#  #", "#  #", "####", "   #", "   #"],
  "5": ["####", "#   ", "### ", "   #", "### "],
  "6": [" ###", "#   ", "### ", "#  #", " ## "],
  "7": ["####", "   #", "  # ", " #  ", " #  "],
  "8": [" ## ", "#  #", " ## ", "#  #", " ## "],
  "9": [" ## ", "#  #", " ###", "   #", "### "],
  "!": ["#", "#", "#", " ", "#"],
  "?": ["### ", "   #", " ## ", "    ", " #  "],
  ".": [" ", " ", " ", " ", "#"],
  ",": ["  ", "  ", "  ", " #", "# "],
  "-": ["    ", "    ", "####", "    ", "    "],
  "+": ["   ", " # ", "###", " # ", "   "],
  "'": ["#", "#", " ", " ", " "],
  ":": [" ", "#", " ", "#", " "],
  "<": ["  #", " # ", "#  ", " # ", "  #"],
  ">": ["#  ", " # ", "  #", " # ", "#  "],
  "(": [" #", "# ", "# ", "# ", " #"],
  ")": ["# ", " #", " #", " #", "# "],
  "*": ["     ", "# # #", " ### ", "# # #", "     "],
  "=": ["    ", "####", "    ", "####", "    "],
  "/": ["   #", "  # ", " #  ", "#   ", "    "],
};

const FONT = Object.fromEntries(
  Object.entries(RAW_FONT).map(([character, rows]) => {
    const width = Math.max(...rows.map((row) => row.length));
    return [character, rows.map((row) => row.padEnd(width, " "))];
  }),
) as Record<string, string[]>;

function glyph(character: string): string[] {
  return FONT[character] ?? FONT[" "];
}

function measure(text: string, gap: number): number {
  const characters = [...text];
  return characters.reduce(
    (width, character, index) => width + glyph(character)[0].length + (index > 0 ? gap : 0),
    0,
  );
}

function wrapText(input: string, gap: number): string[] {
  const words = input.toUpperCase().split(" ");
  const lines: string[] = [];
  let current = "";

  for (let word of words) {
    if (!word) continue;

    while (measure(word, gap) > ASCII_WIDTH) {
      let cut = word.length;
      while (cut > 1 && measure(word.slice(0, cut), gap) > ASCII_WIDTH) cut -= 1;

      if (current) {
        lines.push(current);
        current = "";
      }

      lines.push(word.slice(0, cut));
      word = word.slice(cut);
    }

    if (!word) continue;

    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate, gap) <= ASCII_WIDTH) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export interface TextStyle {
  draw?: string;
  background?: string;
  gap?: number;
}

export function generateTextRows(input: string, style: TextStyle = {}): string[] {
  const original = String(input || "");
  if (!original.replace(/\s/g, "").length) return [];

  const draw = style.draw ?? "█";
  const background = style.background ?? "░";
  const gap = Math.max(0, style.gap ?? 1);
  const separator = " ".repeat(gap);
  const output: string[] = [];

  wrapText(original, gap).forEach((line, lineIndex) => {
    if (lineIndex > 0) output.push("");
    const characters = [...line].map(glyph);

    for (let row = 0; row < 5; row += 1) {
      output.push(characters.map((character) => character[row]).join(separator));
    }
  });

  return output.map((row) =>
    [...row.padEnd(ASCII_WIDTH, " ")].map((cell) => (cell === "#" ? draw : background)).join(""),
  );
}

export function chunkRows(content: string, width = ASCII_WIDTH): string[] {
  const characters = [...String(content || "")];
  const rows: string[] = [];
  for (let index = 0; index < characters.length; index += width) {
    rows.push(characters.slice(index, index + width).join(""));
  }
  return rows;
}

export function canvasToRows(
  grid: boolean[][],
  style: Pick<TextStyle, "draw" | "background"> = {},
): string[] {
  const draw = style.draw ?? "█";
  const background = style.background ?? "░";
  return grid.map((row) => {
    let output = "";
    for (let column = 0; column < ASCII_WIDTH; column += 1) {
      output += row[column] ? draw : background;
    }
    return output;
  });
}

export function rowsToPreview(rows: string[]): string {
  return rows.join("\n");
}

export function rowsToClipboard(rows: string[]): string {
  return rows.join(" ");
}
