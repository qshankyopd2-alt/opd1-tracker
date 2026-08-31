import { describe, expect, it } from "vitest";
import matchModalSource from "../../history/MatchDetailModal.tsx?raw";
import { nextDrawerTabIndex } from "../PlayerDrawer";
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
    expect(playerDrawerSource).toContain("<Dialog.Root");
    expect(playerDrawerSource).toContain("z-[60]");
    expect(playerDrawerSource).toContain('openMatch ? { inert: "", "aria-hidden": true }');
    expect(matchModalSource).toContain("<Dialog.Root");
    expect(matchModalSource).toContain("z-[70]");
    expect(playerDrawerSource).toContain("bg-black/70");
    expect(matchModalSource).toContain("bg-black/70");
  });

  it("uses Radix focus management and restores the row opener", () => {
    expect(playerDrawerSource).toContain("onCloseAutoFocus");
    expect(playerDrawerSource).toContain("restoreFocus.focus()");
    expect(matchModalSource).toContain("onCloseAutoFocus");
  });
});

describe("PlayerDrawer alert hierarchy", () => {
  it("renders filled smurf, boosting, and streak alerts ahead of the overview", () => {
    expect(playerDrawerSource).toContain("live-alert-smurf");
    expect(playerDrawerSource).toContain("live-alert-boosting");
    expect(playerDrawerSource).toContain("<StreakBadge");
    expect(playerDrawerSource).toContain('data-alert-kind={hasThreatAlerts ? "threat" : "streak"}');
  });

  it("uses an amber compact callout when streak is the only signal", () => {
    expect(playerDrawerSource).toContain("border-amber-400/45");
    expect(playerDrawerSource).toContain("border-rose-400/50");
  });
});
