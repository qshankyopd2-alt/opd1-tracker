import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { nextDrawerTabIndex, PlayerDrawer } from "../PlayerDrawer";

describe("PlayerDrawer tab navigation", () => {
  it.each([
    { current: 0, key: "ArrowRight", expected: 1 },
    { current: 1, key: "ArrowRight", expected: 0 },
    { current: 0, key: "ArrowLeft", expected: 1 },
    { current: 1, key: "ArrowLeft", expected: 0 },
    { current: 1, key: "Home", expected: 0 },
    { current: 0, key: "End", expected: 1 },
    { current: 0, key: "Enter", expected: null },
  ])("maps $key from $current to $expected", ({ current, key, expected }) => {
    expect(nextDrawerTabIndex(current, key)).toBe(expected);
  });
});

describe("PlayerDrawer alert hierarchy", () => {
  it("renders filled smurf, boosting, and streak alerts ahead of the overview", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const player = { ...snapshot.board.players[4], streak: { type: "L" as const, count: 4 } };
    const html = renderToStaticMarkup(createElement(PlayerDrawer, {
      player,
      accountPuuid: snapshot.board.selfPuuid ?? null,
      onSavedChange: () => undefined,
      onClose: () => undefined,
    }));

    expect(html).toContain("live-alert-smurf");
    expect(html).toContain("live-alert-boosting");
    expect(html).toContain("live-signal-streak");
    expect(html).not.toContain("live-alert-loss");
    expect(html.indexOf("drawer-smurf-reasons")).toBeLessThan(html.indexOf("drawer-career"));
  });
});
