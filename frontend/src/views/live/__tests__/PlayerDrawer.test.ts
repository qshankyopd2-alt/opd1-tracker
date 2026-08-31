import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSnapshot } from "../../../dev/previewFixtures";
import { dialogKeyIntent } from "../../../hooks/useDialogFocusTrap";
import focusTrapSource from "../../../hooks/useDialogFocusTrap.ts?raw";
import matchModalSource from "../../history/MatchDetailModal.tsx?raw";
import { nextDrawerTabIndex, PlayerDrawer } from "../PlayerDrawer";
import playerDrawerSource from "../PlayerDrawer.tsx?raw";

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

describe("shared modal behavior", () => {
  it("keeps the drawer below match detail and makes the drawer inert while nested", () => {
    expect(playerDrawerSource).toContain("<ModalLayer>");
    expect(playerDrawerSource).toContain("z-[60]");
    expect(playerDrawerSource).toContain('openMatch ? { inert: "", "aria-hidden": true }');
    expect(matchModalSource).toContain("<ModalLayer>");
    expect(matchModalSource).toContain("z-[70]");
    expect(playerDrawerSource).toContain("bg-black/70");
    expect(matchModalSource).toContain("bg-black/70");
  });

  it("routes Escape before tab cycling and restores the previous focus", () => {
    expect(dialogKeyIntent("Escape")).toBe("close");
    expect(dialogKeyIntent("Tab")).toBe("cycle");
    expect(dialogKeyIntent("Enter")).toBe("ignore");
    expect(focusTrapSource).toContain("event.stopPropagation()");
    expect(focusTrapSource).toContain("previousFocusRef.current?.focus()");
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
    expect(html).toContain('data-alert-kind="threat"');
    expect(html.indexOf("drawer-smurf-reasons")).toBeLessThan(html.indexOf("drawer-career"));
  });

  it("uses an amber compact callout when streak is the only signal", () => {
    const snapshot = makeSnapshot("INGAME", 1);
    const player = { ...snapshot.board.players[0], smurf: false, smurfReasons: [], streak: { type: "W" as const, count: 4 } };
    const html = renderToStaticMarkup(createElement(PlayerDrawer, {
      player,
      accountPuuid: snapshot.board.selfPuuid ?? null,
      onSavedChange: () => undefined,
      onClose: () => undefined,
    }));

    expect(html).toContain('data-alert-kind="streak"');
    expect(html).toContain("border-amber-400/45");
    expect(html).not.toContain("border-rose-400/50");
  });
});
