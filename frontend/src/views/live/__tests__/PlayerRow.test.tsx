import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import styles from "../../../styles/index.css?raw";
import { PlayerRow } from "../PlayerRow";
import teamPanelSource from "../TeamPanel.tsx?raw";

function renderPlayerRow(playerIndex = 0) {
  const player = { ...makeSnapshot("INGAME", 1).board.players[playerIndex], role: "Duelist" };
  return renderToStaticMarkup(<PlayerRow player={player} pregame={false} onSelect={() => undefined} />);
}

describe("PlayerRow hierarchy", () => {
  it("responds to its own container at the two specified thresholds", () => {
    expect(styles).toContain("container-name: player-row");
    expect(styles).toContain("@container player-row (max-width: 520px)");
    expect(styles).toContain("@container player-row (max-width: 440px)");
    expect(styles).not.toContain("minmax(180px, 42%)");
    expect(styles).not.toContain("minmax(44px, 1fr)");
    expect(styles).not.toContain('[data-window-density="compact"] .live-player');
    expect(styles).toContain('"identity primary"');
    expect(styles).toContain('"identity secondary"');
    expect(styles).toContain('"secondary secondary"');
    expect(styles).toContain("repeat(var(--live-player-count), clamp(92px, 14vh, 124px))");
    expect(teamPanelSource).not.toContain("minmax(0, 1fr)");
  });

  it("renders each player's card art as a right-focused matte backdrop", () => {
    const html = renderPlayerRow();

    expect(html).toContain("live-player-art");
    expect(html).toContain("w-[58%]");
    expect(html).toContain("object-[center_18%]");
    expect(html).toContain("opacity-20");
    expect(html).toContain("saturate-[0.65]");
    expect(html).toContain("group-hover/card:opacity-[0.26]");
    expect(html).toContain("live-player-matte");
  });
  it("keeps four padded black weapon surfaces with contained artwork", () => {
    const html = renderPlayerRow();

    expect(html.match(/live-weapon-slot/g)).toHaveLength(4);
    expect(html).toContain("h-8 min-w-0 items-center justify-center overflow-hidden rounded-sm border border-edge/60 bg-ink/90 p-1");
    expect(html).toContain("h-6 max-h-6 w-full object-contain");
    expect(html).toContain('draggable="false"');
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
    expect(smurfHtml).toContain("live-alert-reason");
    expect(smurfHtml).toContain('<span class="min-w-0 truncate">');
    expect(smurfHtml).toContain("Possibly boosting based on party performance gap");
  });

  it("keeps win rate typographically stronger than supporting K/D and headshots", () => {
    const html = renderPlayerRow();

    expect(html).toContain('text-[15px] font-black text-zinc-100');
    expect(html.match(/text-\[10px\] font-medium text-zinc-500/g)).toHaveLength(2);
  });
});
