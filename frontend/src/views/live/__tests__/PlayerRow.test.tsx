import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { PlayerRow } from "../PlayerRow";

function renderPlayerRow(playerIndex = 0) {
  const player = { ...makeSnapshot("INGAME", 1).board.players[playerIndex], role: "Duelist" };
  return renderToStaticMarkup(<PlayerRow player={player} pregame={false} onSelect={() => undefined} />);
}

describe("PlayerRow hierarchy", () => {
  it("keeps four padded black weapon surfaces with contained artwork", () => {
    const html = renderPlayerRow();

    expect(html.match(/live-weapon-slot/g)).toHaveLength(4);
    expect(html).toContain("h-8 min-w-0 items-center justify-center overflow-hidden rounded-sm border border-edge/60 bg-ink/90 p-1");
    expect(html).toContain("max-h-6 w-[88%] object-contain");
  });

  it("renders aligned identity and stats zones with the expanded hierarchy", () => {
    const html = renderPlayerRow();

    expect(html).toContain("live-player-grid");
    expect(html).toContain("live-player-identity");
    expect(html).toContain("live-player-stats");
    expect(html).toContain("live-primary-stats");
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
    expect(html).toContain("live-signal-streak");
    expect(html).toContain('title="NovaFlux"');
  });

  it("reserves threat classes for smurf and boosting while streak uses amber signal styling", () => {
    const smurfHtml = renderPlayerRow(4);
    const lossHtml = renderPlayerRow(5);

    expect(smurfHtml).toContain("live-alert-smurf");
    expect(smurfHtml).toContain("live-alert-boosting");
    expect(smurfHtml).toContain("BOOSTING");
    expect(lossHtml).toContain("live-signal-streak");
    expect(lossHtml).not.toContain("live-alert-loss");
    expect(smurfHtml).not.toContain("live-current-rank-name live-alert");
  });

  it("keeps win rate typographically stronger than supporting K/D and headshots", () => {
    const html = renderPlayerRow();

    expect(html).toContain('text-[14px] font-black text-zinc-100');
    expect(html.match(/text-\[11px\] font-semibold text-zinc-400/g)).toHaveLength(2);
  });
});
