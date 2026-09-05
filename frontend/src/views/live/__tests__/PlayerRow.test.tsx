import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import styles from "../../../styles/index.css?raw";
import { PlayerRow } from "../PlayerRow";

function renderPlayerRow(playerIndex = 0) {
  const player = { ...makeSnapshot("INGAME", 1).board.players[playerIndex], role: "Duelist" };
  return renderToStaticMarkup(<PlayerRow player={player} pregame={false} onSelect={() => undefined} />);
}

describe("PlayerRow hierarchy", () => {
  it("keeps two rosters of horizontal player rows with responsive secondary statistics", () => {
    expect(styles).toContain(".player-row");
    expect(styles).toContain('"avatar identity rank stats"');
    expect(styles).toContain('"avatar alerts detail detail"');
    expect(styles).toContain("background: var(--bg-card);");
    expect(styles).not.toContain('[data-team-tone="defeat"] .player-row');
    expect(styles).toContain("grid-template-rows: repeat(var(--live-player-count), minmax(0, 1fr));");
    expect(styles).toContain(".matchup-board { grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(styles).toContain("@container (max-width: 520px)");
    expect(styles).toContain("@container (max-width: 440px)");
    expect(styles).toContain('[data-testid="player-row-kd"]');
    expect(styles).toContain('[data-testid="player-row-hs"]');
    expect(styles).toContain(".match-chip");
    expect(styles).toContain(".match-chip.win");
    expect(styles).toContain(".match-chip.loss");
  });

  it("uses an opaque solid surface with the player's real artwork", () => {
    const html = renderPlayerRow();

    expect(html).toContain("live-player-art");
    expect(html).toContain("live-player-matte");
    expect(html).not.toContain("opacity-20");
    expect(html).not.toContain("weapon-icon");
    expect(html).toContain("live-player-loadout");
    expect(styles).toContain("width: 58%;");
    expect(styles).toContain("opacity: 0.2;");
    expect(styles).toContain("filter: saturate(0.65)");
  });

  it("renders match chips with win and loss tokens", () => {
    const html = renderPlayerRow();

    expect(html).toContain("match-chip");
  });

  it("keeps the role out of the card while giving the player name useful room", () => {
    const html = renderPlayerRow();

    expect(html).not.toContain("Duelist");
    expect(html).toContain('data-testid="streak-w"');
    expect(html).toContain("max-width:100%");
  });

  it("reserves threat classes for smurf and boosting while streak uses proper state", () => {
    const smurfHtml = renderPlayerRow(4);
    const lossHtml = renderPlayerRow(5);

    expect(smurfHtml).toContain("live-alert-smurf");
    expect(smurfHtml).toContain("live-alert-boosting");
    expect(smurfHtml).toContain("BOOSTING");
    expect(lossHtml).toContain('data-testid="streak-l"');
  });

  it("formats combat KPIs with readable tabular numbers", () => {
    const html = renderPlayerRow();

    expect(html).toContain('data-testid="player-row-kd"');
    expect(html).toContain('data-testid="player-row-wr"');
    expect(html).toContain("font-mono");
    expect(html).toContain("tabular-nums");
    expect(html).toContain("text-[20px]");
    expect(html).toContain("text-[17px]");
  });

  it("renders an accessible profile opener", () => {
    const html = renderPlayerRow();

    expect(html).toContain("player-row");
    expect(html).toContain('aria-label="View profile for');
    expect(html).toContain('data-testid="player-row-open-');
  });

  it("keeps threat fills stronger than rank, party, form, and streak styling", () => {
    expect(styles).toContain(".live-alert-smurf");
    expect(styles).toContain("background: var(--accent-gold)");
    expect(styles).toContain("color: #ffffff");
    expect(styles).not.toContain("[data-window-density=\"compact\"]");
  });
});
