import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import styles from "../../../styles/index.css?raw";
import { PlayerRow } from "../PlayerRow";

function renderPlayerRow(playerIndex = 0, showLoadouts = false) {
  const player = { ...makeSnapshot("INGAME", 1).board.players[playerIndex], role: "Duelist" };
  return renderToStaticMarkup(<PlayerRow player={player} pregame={false} showLoadouts={showLoadouts} onSelect={() => undefined} />);
}

describe("PlayerRow hierarchy", () => {
  it("switches loadouts in place of statistics without changing player identity", () => {
    const stats = renderPlayerRow();
    const skins = renderPlayerRow(0, true);
    expect(stats).toContain('data-testid="player-row-kd"');
    expect(stats).not.toContain('data-testid="weapon-loadout"');
    expect(skins).toContain('data-testid="weapon-loadout"');
    expect(skins).not.toContain('data-testid="player-row-kd"');
    expect(skins).toContain("NovaFlux");
    expect(skins.match(/data-testid="weapon-slot-/g)).toHaveLength(4);
  });
  it("shows four real featured skins without inventing a standard skin", () => {
    const html = renderPlayerRow(0, true);
    expect(html.match(/data-testid="weapon-slot-/g)).toHaveLength(4);
    expect(html).toContain('alt="Vandal: Araxys Vandal"');
    const player = { ...makeSnapshot("INGAME", 1).board.players[0], weapons: [] };
    const missing = renderToStaticMarkup(<PlayerRow player={player} showLoadouts pregame={false} onSelect={() => undefined} />);
    expect(missing).not.toContain("Standard");
    expect(missing).toContain("Unavailable");
  });
  it("keeps two rosters of horizontal player rows with responsive secondary statistics", () => {
    expect(styles).toContain(".player-row");
    expect(styles).toContain('"avatar identity rank"');
    expect(styles).toContain('"avatar stats form"');
    expect(styles).toContain("background: var(--bg-card);");
    expect(styles).not.toContain('[data-team-tone="defeat"] .player-row');
    expect(styles).toContain("grid-template-rows: repeat(var(--live-player-count), 90px);");
    expect(styles).toContain(".matchup-board { gap: 12px;");
    expect(styles).toContain("@container (max-width: 520px)");
    expect(styles).toContain("@container (max-width: 440px)");
    expect(renderPlayerRow()).toContain('data-testid="player-row-kd"');
    expect(renderPlayerRow()).toContain('data-testid="player-row-hs"');
    expect(styles).toContain(".recent-result");
  });

  it("uses an opaque solid surface with the player's real artwork", () => {
    const html = renderPlayerRow();

    expect(html).toContain("live-player-art");
    expect(html).toContain("live-player-matte");
    expect(html).not.toContain("opacity-20");
    expect(html).not.toContain("weapon-icon");
    expect(html).not.toContain("live-player-loadout");
    expect(styles).toContain("opacity: 1;");
    expect(styles).not.toContain("filter: saturate(0.65)");
  });

  it("renders match chips with win and loss tokens", () => {
    const html = renderPlayerRow();

    expect(html).toContain("recent-result");
  });

  it("keeps the role out of the card while giving the player name useful room", () => {
    const html = renderPlayerRow();

    expect(html).not.toContain("Duelist");
    expect(html).toContain("max-w-full");
    expect(html).toContain("#MOCK");
  });

  it("reserves threat classes for smurf and boosting", () => {
    const smurfHtml = renderPlayerRow(4);

    expect(smurfHtml).toContain("live-alert-smurf");
    expect(smurfHtml).toContain("live-alert-boosting");
    expect(smurfHtml).toContain("Possible boosting");
  });

  it("formats combat KPIs with readable tabular numbers", () => {
    const html = renderPlayerRow();

    expect(html).toContain('data-testid="player-row-kd"');
    expect(html).toContain('data-testid="player-row-wr"');
    expect(styles).toContain("font-variant-numeric: tabular-nums");
    expect(html).toContain("Act WR");
    expect(html).toContain("text-[17px]");
  });

  it("renders an accessible profile opener", () => {
    const html = renderPlayerRow();

    expect(html).toContain("player-row");
    expect(html).toContain('aria-label="View profile for');
    expect(html).toContain('data-testid="player-row-open-');
  });

  it("keeps heuristic labels explicit and preserves actual party colors", () => {
    expect(styles).toContain(".live-alert-smurf");
    expect(renderPlayerRow(4)).toContain("Possible smurf");
    expect(renderPlayerRow(4)).toContain("Possible boosting");
    expect(styles).not.toContain("[data-window-density=\"compact\"]");
  });
});
