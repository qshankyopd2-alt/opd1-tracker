import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { LiveDataProvider } from "../../../state/LiveDataContext";
import { LiveView } from "../LiveView";
import { MatchHeader } from "../MatchHeader";
import { TeamPanel } from "../TeamPanel";
import { splitTeams } from "../teamSplit";
import { RecapCard } from "../RecapCard";
import { LobbyQueueCard } from "../LobbyQueueCard";

describe("board states render", () => {
  for (const state of ["INGAME", "PREGAME", "MENUS"] as const) {
    it(`${state} board header + panels render`, () => {
      const board = makeSnapshot(state, 1).board;
      const { allyId, enemyId, ally, enemy } = splitTeams(board);
      const html =
        renderToString(<MatchHeader board={board} />) +
        renderToString(
          <TeamPanel
            label="Your team"
            accent="victory"
            players={ally}
            stats={allyId ? board.teamStats?.[allyId] : undefined}
            parties={board.parties ?? []}
            partyDetection={allyId ? board.partyDetection?.teams?.[allyId] : undefined}
            savedOverrides={{}}
            pregame={state === "PREGAME"}
            onSelect={() => undefined}
            recentDetailsByPlayer={{}}
            onRequestRecentDetails={() => undefined}
            testId="ally"
            lobby={state === "MENUS"}
          />,
        ) +
        (enemy.length > 0
          ? renderToString(
              <TeamPanel
                label="Enemy team"
                accent="defeat"
                players={enemy}
                stats={enemyId ? board.teamStats?.[enemyId] : undefined}
                parties={board.parties ?? []}
                partyDetection={enemyId ? board.partyDetection?.teams?.[enemyId] : undefined}
                savedOverrides={{}}
                pregame={false}
                onSelect={() => undefined}
                recentDetailsByPlayer={{}}
                onRequestRecentDetails={() => undefined}
                testId="enemy"
              />,
            )
          : "");
      expect(html.length).toBeGreaterThan(5000);
      if (state === "MENUS" && board.recap) {
        const recap = renderToString(<RecapCard recap={board.recap} />);
        expect(recap).toContain("recap-card");
      }
      const queue = renderToString(<LobbyQueueCard queue={board.queue} />);
      expect(queue).toContain("lobby-queue-card");
    });
  }

  it("LiveView loading shell renders", () => {
    const html = renderToString(
      <LiveDataProvider>
        <LiveView />
      </LiveDataProvider>,
    );
    expect(html).toContain("loading-skeleton");
  });
});
