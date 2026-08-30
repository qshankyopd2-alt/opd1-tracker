import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { PlayerRow } from "../PlayerRow";

function renderPlayerRow() {
  const player = { ...makeSnapshot("INGAME", 1).board.players[0], role: "Duelist" };
  return renderToStaticMarkup(<PlayerRow player={player} pregame={false} onSelect={() => undefined} />);
}

describe("PlayerRow hierarchy", () => {
  it("keeps four padded black weapon surfaces with contained artwork", () => {
    const html = renderPlayerRow();

    expect(html.match(/live-weapon-slot/g)).toHaveLength(4);
    expect(html).toContain("h-8 min-w-0 items-center justify-center overflow-hidden rounded-sm border border-edge/60 bg-ink/90 p-1");
    expect(html).toContain("max-h-6 w-[88%] object-contain");
  });

  it("renders a single compact stat rail and the complete rank hierarchy", () => {
    const html = renderPlayerRow();

    expect(html).toContain("live-player-metrics relative mb-1 flex h-7 items-center");
    expect(html).toContain("bg-ink/80");
    expect(html).toContain("Act games");
    expect(html).toContain("WR");
    expect(html).toContain("K/D");
    expect(html).toContain("HS");
    expect(html).toContain("live-current-rank-name");
    expect(html).toContain("live-player-peak");
    expect(html).toContain("Peak");
  });

  it("keeps the role out of the card while streak state stays beside the name", () => {
    const html = renderPlayerRow();

    expect(html).not.toContain("Duelist");
    expect(html).toContain("player-streak-");
  });
});
