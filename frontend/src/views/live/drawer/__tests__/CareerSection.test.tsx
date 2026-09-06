import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../../dev/previewFixtures";
import { CareerSection, connectionSummary } from "../CareerSection";
import { FrequentTeammates } from "../FrequentTeammates";
import { MatchesSection } from "../MatchesSection";

describe("Player Drawer sections", () => {
  it("keeps connection totals consistent for draw, pending, and legacy data", () => {
    expect(connectionSummary(5, 2, 1, 1, 1)).toBe("5 matches · 2W–1L–1D · 1 result unavailable");
    expect(connectionSummary(5, 2, 1)).toBe("5 matches · 2W–1L–0D · 2 results unavailable");
    expect(connectionSummary(2, 3, 1, 0, 0)).toBe("4 matches · 3W–1L–0D");
  });
  it("renders grouped overview copy and truthful loadout fallbacks", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const player = snapshot.board.players[0];
    const weapons = player.weapons
      .filter((weapon) => weapon.weapon !== "Melee")
      .map((weapon) => weapon.weapon === "Phantom" ? { ...weapon, skin: null } : weapon);
    const html = renderToStaticMarkup(
      <CareerSection
        player={{ ...player, weapons, encounter: { withCount: 2, againstCount: 3, winsWith: 1, lossesWith: 1, winsAgainst: 2, lossesAgainst: 1 } }}
        career={snapshot.career}
        careerUsable
        loading={false}
        error={null}
        mapSplashes={new Map()}
        previousRankIcon={null}
        previousRankColor="#A1A1AA"
      />,
    );

    expect(html).toContain("Recent performance");
    expect(html).toContain("This act");
    expect(html).toContain("Rank history");
    expect(html).toContain("Most played agents");
    expect(html).toContain("Most played maps");
    expect(html).toContain('class="sr-only"> win rate</span>');
    expect(html).toContain("Jett");
    expect(html).toContain("grid-cols-[repeat(auto-fit,minmax(132px,1fr))]");
    expect(html).toContain("Frequent teammates");
    expect(html).toContain("Connections");
    expect(html).toContain("Together");
    expect(html).toContain("Against");
    expect(html).toContain("Loadout");
    expect(html).toContain("Unavailable");
    expect(html).not.toContain("Standard");

    expect(html.indexOf("Recent performance")).toBeLessThan(html.indexOf("This act"));
    expect(html.indexOf("This act")).toBeLessThan(html.indexOf("Rank history"));
    expect(html.indexOf("Rank history")).toBeLessThan(html.indexOf("Most played agents"));
    expect(html.indexOf("Most played agents")).toBeLessThan(html.indexOf("Frequent teammates"));
    expect(html.indexOf("Frequent teammates")).toBeLessThan(html.indexOf("Connections"));
    expect(html.indexOf("Loadout")).toBeLessThan(html.indexOf("Recent performance"));
  });

  it("renders aligned teammate names, fallbacks, agents, and party state", () => {
    const teammates = Array.from({ length: 6 }, (_, index) => ({
      puuid: index === 1 ? "8f1c2a7e9d4b6083" : `teammate-${index}-abcdefgh`,
      name: index === 1 ? null : index === 0 ? "A Very Long Teammate Name That Must Truncate" : `Player ${index}`,
      sharedMatches: index + 1,
      agents: index === 2 ? [] : ["Jett", "Raze"],
      isParty: index % 2 === 0,
    }));
    const html = renderToStaticMarkup(<FrequentTeammates teammates={teammates} />);

    expect(html.match(/<li/g)).toHaveLength(6);
    expect(html).toContain("Player 8f1c2a7e");
    expect(html).not.toContain("Jett · Raze");
    expect(html).not.toContain("Agents unavailable");
    expect(html).toContain("Party");
    expect(html).toContain("1 match");
    expect(html).toContain("6 matches");
  });

  it("covers match loading, unavailable, empty, and populated states", () => {
    const career = makeSnapshot("INGAME", 1).career;

    expect(renderToStaticMarkup(<MatchesSection career={null} careerUsable={false} loading error={null} onOpenMatch={() => undefined} />)).toContain("drawer-matches-loading");
    expect(renderToStaticMarkup(<MatchesSection career={null} careerUsable={false} loading={false} error="offline" onOpenMatch={() => undefined} />)).toContain("Match history is unavailable right now.");
    expect(renderToStaticMarkup(<MatchesSection career={{ ...career, matches: [] }} careerUsable loading={false} error={null} onOpenMatch={() => undefined} />)).toContain("No recent matches available.");
    const populated = renderToStaticMarkup(<MatchesSection career={career} careerUsable loading={false} error={null} onOpenMatch={() => undefined} />);
    expect(populated.match(/data-testid="drawer-match-(?!list)/g)).toHaveLength(8);
    expect(populated).toContain("/splash.png");
    expect(populated).toContain('title="Ascendant 2 · 30 RR"');
    expect(populated).toContain('aria-label="Ending rank Ascendant 2 · 30 RR"');
    expect(populated).not.toContain("grayscale");
    expect(populated).toContain("recent-map-art");
  });

  it("renders Avg K/D/A using career.averages (3 numbers) with W/L record above the bar", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const player = snapshot.board.players[0];
    const html = renderToStaticMarkup(
      <CareerSection
        player={player}
        career={snapshot.career}
        careerUsable
        loading={false}
        error={null}
        mapSplashes={new Map()}
        previousRankIcon={null}
        previousRankColor="#A1A1AA"
      />,
    );

    expect(html).toContain("Recent performance");
    expect(html).toContain('aria-label="Average K/D/A"');
    for (const [field, label] of [["kills", "Avg kills"], ["deaths", "Avg deaths"], ["assists", "Avg assists"]] as const) {
      expect(html).toContain(`<strong>${snapshot.career.averages[field].toFixed(1)}</strong><span>${label}</span>`);
    }
    // W/L record stays above the bar
    expect(html).toContain("Last 8 matches");
    expect(html).toContain("4W – 4L");
  });
});
