// Presentational tier → name/color mapping (mirrors backend/vconstants.py RANKS).

const GROUPS: [string, string, number][] = [
  ["Unranked", "#4A4A4A", 3],
  ["Iron", "#5A5751", 3],
  ["Bronze", "#BB8F5A", 3],
  ["Silver", "#AEB2B2", 3],
  ["Gold", "#C5BA3F", 3],
  ["Platinum", "#18A7B9", 3],
  ["Diamond", "#D864C7", 3],
  ["Ascendant", "#189452", 3],
  ["Immortal", "#DD4444", 3],
  ["Radiant", "#FFFDCD", 1],
];

export interface RankMeta {
  tier: number;
  name: string;
  group: string;
  color: string;
}

export const RANKS: RankMeta[] = [];
for (const [group, color, count] of GROUPS) {
  for (let i = 1; i <= count; i++) {
    const tier = RANKS.length;
    const name = group === "Unranked" ? "Unranked" : group === "Radiant" ? "Radiant" : `${group} ${i}`;
    RANKS.push({ tier, name, group, color });
  }
}

export function rankFromTier(tier: number | null | undefined): RankMeta {
  const t = Math.max(0, Math.min(RANKS.length - 1, Math.trunc(tier ?? 0)));
  return RANKS[t];
}
