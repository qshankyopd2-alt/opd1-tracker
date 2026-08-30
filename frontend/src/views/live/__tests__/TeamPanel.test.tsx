import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { TeamPanel } from "../TeamPanel";

describe("TeamPanel compact metadata", () => {
  it("uses plain-language party sizes and includes abbreviated team K/D and WR", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const players = snapshot.board.teams.Blue;
    const html = renderToStaticMarkup(
      <TeamPanel
        label="Your Team"
        accent="#10B981"
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

    expect(html).toContain("Party of 2");
    expect(html).toContain("2-player party");
    expect(html).not.toContain("4/5");
    expect(html).not.toContain("detected</span>");
    expect(html).toContain("team-stats-compact");
    expect(html).toContain("Team average K/D");
  });
});
