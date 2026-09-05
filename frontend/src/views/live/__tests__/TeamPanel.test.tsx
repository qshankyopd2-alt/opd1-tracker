import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { TeamPanel } from "../TeamPanel";

describe("TeamPanel", () => {
  it("keeps team averages above a separate party rail and five player rows", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const players = snapshot.board.teams.Blue;
    const html = renderToStaticMarkup(
      <TeamPanel
        label="Your Team"
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

    // Compact header
    expect(html).toContain("live-team-header");
    expect(html).toContain("live-party-rail");
    expect(html.indexOf("</header>")).toBeLessThan(html.indexOf('data-testid="team-parties"'));
    expect(html).toContain('data-team-tone="victory"');
    expect(html).toContain("--team-accent:var(--accent-team-a)");

    // Party labels stay readable without competing with team statistics.
    expect(html).toContain('data-testid="team-parties"');
    expect(html).toContain("P1");
    expect(html).toContain("P2");
    expect(html).toContain("2 players on this team detected in party");
    expect(html).toContain("party of 2");
    expect(html).not.toContain("4/5");
    expect(html).not.toContain("detected</span>");

    // Team averages & stats
    expect(html).toContain("team-stats-compact");
    expect(html).toContain("Team average K/D");
    expect(html).toContain("Avg");
    expect(html).toContain("K/D");
    expect(html).toContain("WR");

    // Token alignment & surfaces
    expect(html).toContain("border-edge");
    expect(html).not.toContain("backdrop-blur-md");
    expect(html.match(/class="live-player-slot /g)).toHaveLength(5);
  });

  it("renders enemy team with defeat token and displays smurf alerts", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const players = snapshot.board.teams.Red;
    const html = renderToStaticMarkup(
      <TeamPanel
        label="Enemy Team"
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
    expect(html).toContain("bg-defeat");
    expect(html).toContain("data-testid=\"enemy-team-smurf-count\"");
    expect(html).toContain("smurf");
  });
});
