import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { TeamPanel } from "../TeamPanel";

describe("TeamPanel", () => {
  it("keeps team averages in a header above a separate party rail and five player rows", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const players = snapshot.board.teams.Blue;
    const html = renderToStaticMarkup(
      <TeamPanel
        label="Your team"
        accent="victory"
        players={players}
        stats={snapshot.board.teamStats.Blue}
        parties={snapshot.board.parties}
        partyDetection={snapshot.board.partyDetection?.teams.Blue}
        savedOverrides={{}}
        pregame={false}
        onSelect={() => undefined}
        recentDetailsByPlayer={{}}
        onRequestRecentDetails={() => undefined}
        testId="team"
      />,
    );

    // Compact command header with averages, then the party rail, then the roster
    expect(html).toContain("live-team-header");
    expect(html).toContain("live-party-rail");
    expect(html).toContain("live-team-stats");
    expect(html.indexOf("</header>")).toBeLessThan(html.indexOf('data-testid="team-parties"'));
    expect(html).toContain('data-team-tone="victory"');
    expect(html).toContain("--team-accent:var(--ally)");

    // Team averages are labeled, not implied
    expect(html).toContain("Avg rank");
    expect(html).toContain("K/D");
    expect(html).toContain("Act WR");
    expect(html).toContain('data-testid="team-smurf-count"');

    // Party rail lists detected parties with per-team sizes and a coverage caveat
    expect(html).toContain('data-testid="team-parties"');
    expect(html).toContain("P1");
    expect(html).toContain("P2");
    expect(html).toContain("2 players on this team detected in party");
    expect(html).toContain("Complete");
    expect(html).toContain("best-effort");

    // Party members are rendered adjacent to each other (five slots total)
    expect(html.match(/class="live-player-slot /g)).toHaveLength(5);
    // Opaque panel surface, no glass
    expect(html).not.toContain("backdrop-blur-md");
  });

  it("keeps detected parties adjacent in the roster order", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const players = snapshot.board.teams.Blue;
    const html = renderToStaticMarkup(
      <TeamPanel
        label="Your team"
        accent="victory"
        players={players}
        stats={snapshot.board.teamStats.Blue}
        parties={snapshot.board.parties}
        partyDetection={snapshot.board.partyDetection?.teams.Blue}
        savedOverrides={{}}
        pregame={false}
        onSelect={() => undefined}
        recentDetailsByPlayer={{}}
        onRequestRecentDetails={() => undefined}
        testId="team"
      />,
    );

    // P1 members (ally 1, ally 2) sit next to each other
    const p1a = html.indexOf('data-testid="player-row-puuid-ally-1"');
    const p1b = html.indexOf('data-testid="player-row-puuid-ally-2"');
    expect(html.indexOf('data-testid="player-row-puuid-ally-0"')).toBeLessThan(p1a);
    expect(p1b - p1a).toBeLessThan(20_000);
    // P2 members follow, still adjacent
    const p2a = html.indexOf('data-testid="player-row-puuid-ally-3"');
    const p2b = html.indexOf('data-testid="player-row-puuid-ally-4"');
    expect(p2a).toBeGreaterThan(p1b);
    expect(p2b - p2a).toBeLessThan(20_000);
  });

  it("renders enemy team with defeat token and displays smurf alerts", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const players = snapshot.board.teams.Red;
    const html = renderToStaticMarkup(
      <TeamPanel
        label="Enemy team"
        accent="defeat"
        players={players}
        stats={snapshot.board.teamStats.Red}
        parties={snapshot.board.parties}
        partyDetection={snapshot.board.partyDetection?.teams.Red}
        savedOverrides={{}}
        pregame={false}
        onSelect={() => undefined}
        recentDetailsByPlayer={{}}
        onRequestRecentDetails={() => undefined}
        testId="enemy-team"
      />,
    );

    expect(html).toContain('data-team-tone="defeat"');
    expect(html).toContain("--team-accent:var(--enemy)");
    expect(html).toContain('data-testid="enemy-team-smurf-count"');
    expect(html).toContain("smurf");
    // Hidden names stay visibly hidden, not fabricated
    expect(html).toContain('aria-label="streamer mode name"');
  });
});
