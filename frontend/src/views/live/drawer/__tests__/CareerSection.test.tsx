import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../../dev/previewFixtures";
import { CareerSection } from "../CareerSection";
import { FrequentTeammates } from "../FrequentTeammates";
import { MatchesSection } from "../MatchesSection";

describe("Player Drawer sections", () => {
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

    expect(html).toContain("Rank history");
    expect(html).toContain("Performance");
    expect(html).toContain("Last 8 matches");
    expect(html).toContain("This act");
    expect(html).toContain("Most played agents");
    expect(html).toContain("Most played maps");
    expect(html).toContain("Connections");
    expect(html).toContain("Standard");
    expect(html).toContain("Unavailable");
    expect(html.indexOf("Rank history")).toBeLessThan(html.indexOf("Frequent teammates"));
    expect(html.indexOf("Frequent teammates")).toBeLessThan(html.indexOf("Performance"));
    expect(html.indexOf("Connections")).toBeLessThan(html.indexOf("Loadout"));
  });

  it("renders aligned teammate names, fallbacks, agents, and party state", () => {
    const teammates = Array.from({ length: 6 }, (_, index) => ({
      puuid: `teammate-${index}-abcdefgh`,
      name: index === 1 ? null : index === 0 ? "A Very Long Teammate Name That Must Truncate" : `Player ${index}`,
      sharedMatches: index + 1,
      agents: index === 2 ? [] : ["Jett", "Raze"],
      isParty: index % 2 === 0,
    }));
    const html = renderToStaticMarkup(<FrequentTeammates teammates={teammates} />);

    expect(html.match(/<li/g)).toHaveLength(6);
    expect(html).toContain("Player teammate");
    expect(html).toContain("Jett · Raze");
    expect(html).toContain("Agents unavailable");
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
  });
});
