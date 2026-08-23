export function timeAgo(ts: number | null | undefined): string {
  if (!ts) return "—";
  const ms = ts > 1e12 ? ts : ts * 1000;
  const diff = Math.max(0, Date.now() - ms);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`;
}

export function fmtDelta(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n > 0 ? `+${n}` : `${n}`;
}

export function fmtNum(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(digits);
}

export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${Math.round(n)}%`;
}

/** "13–7" from a scores map, own team first when known. */
export function scoreline(
  scores: Record<string, number> | undefined,
  ownTeam?: string | null,
  result?: string | null,
): string {
  if (!scores || Object.keys(scores).length === 0) return "—";
  const entries = Object.entries(scores);
  if (ownTeam && ownTeam in scores) {
    const own = scores[ownTeam];
    const other = entries.filter(([t]) => t !== ownTeam).map(([, v]) => v);
    return `${own}–${other[0] ?? 0}`;
  }
  const vals = entries.map(([, v]) => v).sort((a, b) => result === "Defeat" ? a - b : b - a);
  return vals.join("–");
}

export function matchDate(ms: number | null | undefined): string {
  if (!ms) return "—";
  const norm = ms > 1e12 ? ms : ms * 1000;
  return new Date(norm).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function resultColor(result: string | null | undefined): string {
  if (result === "Victory") return "#10B981";
  if (result === "Defeat") return "#EF4444";
  return "#A1A1AA";
}
