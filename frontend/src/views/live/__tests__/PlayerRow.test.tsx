import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import styles from "../../../styles/index.css?raw";
import { PlayerRow } from "../PlayerRow";

function renderPlayerRow(playerIndex = 0, pregame = false) {
  const player = { ...makeSnapshot("INGAME", 1).board.players[playerIndex], role: "Duelist" };
  return renderToStaticMarkup(<PlayerRow player={player} pregame={pregame} onSelect={() => undefined} />);
}

describe("PlayerRow hierarchy", () => {
  it("shows four real featured skins without inventing a standard skin", () => {
    const html = renderPlayerRow();
    expect(html.match(/data-testid="weapon-slot-/g)).toHaveLength(4);
    expect(html).toContain('alt="Vandal: Araxys Vandal"');
    const player = { ...makeSnapshot("INGAME", 1).board.players[0], weapons: [] };
    const missing = renderToStaticMarkup(<PlayerRow player={player} pregame={false} onSelect={() => undefined} />);
    expect(missing).not.toContain("Standard");
    expect(missing).toContain("Unavailable");
  });

  it("keeps rectangular player cards in a 5v5 matchup grid with a full-width loadout strip", () => {
    expect(styles).toContain(".player-row");
    expect(styles).toContain('"avatar identity rank stats"');
    expect(styles).toContain('"loadout loadout loadout loadout"');
    expect(styles).toContain("background: var(--bg-card);");
    expect(styles).toContain("grid-template-rows: repeat(var(--live-player-count), minmax(92px, 1fr));");
    expect(styles).toContain(".matchup-board {");
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(styles).toContain("@container (max-width: 520px)");
    expect(styles).toContain("@container (max-width: 440px)");
    const html = renderPlayerRow();
    expect(html).toContain('data-testid="player-row-kd"');
    expect(html).toContain('data-testid="player-row-hs"');
    expect(html).toContain('data-testid="player-row-wr"');
    // The loadout strip spans the full card width below the telemetry row
    expect(styles).toContain(".live-player-loadout");
    expect(html).toContain("live-player-loadout");
    expect(html).toContain('data-testid="weapon-loadout"');
  });

  it("uses an opaque solid surface with the player's real artwork", () => {
    const html = renderPlayerRow();

    expect(html).toContain("live-player-art");
    expect(html).toContain("live-player-matte");
    expect(html).not.toContain("opacity-20");
    expect(html).not.toContain("weapon-icon");
    expect(html).toContain("live-player-loadout");
    expect(styles).toContain("width: 55%;");
    expect(styles).toContain("opacity: 0.16;");
    expect(styles).toContain("filter: saturate(0.6)");
  });

  it("renders the recent form strip in chronological order across five tiles", () => {
    const html = renderPlayerRow();

    expect(html).toContain("match-chip");
    expect(html.match(/data-testid="player-puuid-ally-0-recent-form-tile-\d+"/g)).toHaveLength(5);
    expect(html).toContain("recent-form-tile-newest");
    expect(html).toContain('data-testid="player-puuid-ally-0-recent-form"');
    // The "5M" scope label is gone — the tiles themselves communicate recency
    expect(html).not.toContain(">5M<");
  });

  it("keeps the role out of the card while giving the player name useful room", () => {
    const html = renderPlayerRow();

    expect(html).not.toContain("Duelist");
    expect(html).toContain('data-testid="streak-w"');
    expect(html).toContain("#MOCK");
    expect(html).toContain("Lv ");
  });

  it("reserves threat classes for smurf and boosting while streak uses proper state", () => {
    const smurfHtml = renderPlayerRow(4);
    const lossHtml = renderPlayerRow(5);

    expect(smurfHtml).toContain("live-alert-smurf");
    expect(smurfHtml).toContain("live-alert-boosting");
    expect(smurfHtml).toContain('data-testid="smurf-flag-puuid-ally-4"');
    expect(smurfHtml).toContain('data-testid="boosting-flag-puuid-ally-4"');
    // The flags are compact icons; reasons stay in the tooltip, never invented
    expect(smurfHtml).toContain("Possible smurf (heuristic):");
    expect(smurfHtml).toContain("Possible boosting (heuristic):");
    expect(lossHtml).toContain('data-testid="streak-l"');
  });

  it("formats combat KPIs with readable tabular numbers, one consistent typeface", () => {
    const html = renderPlayerRow();

    expect(html).toContain('data-testid="player-row-kd"');
    expect(html).toContain('data-testid="player-row-wr"');
    expect(html).toContain('data-testid="player-row-hs"');
    expect(html).toContain("tabular-nums");
    expect(html).toContain("text-[16px]");
    // Scope labels are gone; the tooltips explain the recent-sample scope
    expect(html).toContain("WR · Act");
    expect(html).toContain(">K/D<");
    expect(html).toContain(">HS%<");
    expect(html).not.toContain("5M");
    // Numbers use the body typeface, not a separate mono/display face
    expect(html).not.toContain('font-mono text-[11px]');
  });

  it("renders rank, RR, and peak rank on the card", () => {
    const html = renderPlayerRow();

    expect(html).toContain("live-current-rank-icon");
    expect(html).toContain("live-current-rank-name");
    expect(html).toContain(" RR");
    expect(html).toContain("live-player-peak");
  });

  it("shows the previous-encounter count and saved bookmark when known", () => {
    const seenHtml = renderPlayerRow(5);
    const savedHtml = renderPlayerRow(4);

    expect(seenHtml).toContain("live-player-seen");
    expect(seenHtml).toContain("16×");
    expect(savedHtml).toContain("aria-label=\"Saved player\"");
  });

  it("renders an accessible profile opener with the full Riot ID", () => {
    const html = renderPlayerRow();

    expect(html).toContain("player-row");
    expect(html).toContain('aria-label="View profile for NovaFlux#MOCK"');
    expect(html).toContain('data-testid="player-row-open-puuid-ally-0"');
  });

  it("marks locked agents in pregame with a check and picking chip", () => {
    const pregameHtml = renderPlayerRow(0, true);
    expect(pregameHtml).toContain("Agent locked");
    const pickingHtml = renderPlayerRow(3, true);
    expect(pickingHtml).toContain("Picking");
  });

  it("styles the threat flags as tinted icon chips (smurf accent, boosting warn)", () => {
    expect(styles).toContain(".live-alert-smurf");
    expect(styles).toContain(".live-alert-boosting");
    expect(styles).toContain("background: var(--accent-soft)");
    expect(styles).toContain("color: var(--warn)");
    expect(styles).not.toContain('[data-window-density="compact"]');
  });
});
