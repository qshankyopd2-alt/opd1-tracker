import { describe, expect, it } from "vitest";
import matchModalSource from "../../history/MatchDetailModal.tsx?raw";
import styles from "../../../styles/index.css?raw";
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

  it("opens the profile as a full-height 640px side drawer without squeezing the roster", () => {
    expect(playerDrawerSource).toContain("modal-backdrop player-profile-layer");
    expect(playerDrawerSource).toContain("modal drawer-slide");
    expect(styles).toContain(".player-profile-layer .modal");
    expect(styles).toContain("width: min(640px, 100vw);");
    expect(styles).toContain("max-height: 100%;");
    expect(styles).toContain("justify-content: flex-end;");
    expect(playerDrawerSource).toContain("drawer-player-card-art");
  });
});

describe("PlayerDrawer alert hierarchy", () => {
  it("renders filled smurf, boosting, and streak alerts ahead of the overview", () => {
    expect(playerDrawerSource).toContain("live-alert-smurf");
    expect(playerDrawerSource).toContain("live-alert-boosting");
    expect(playerDrawerSource).toContain("<StreakBadge");
    expect(playerDrawerSource).toContain('data-alert-kind={hasThreatAlerts ? "threat" : "streak"}');
  });

  it("uses no callout surface when streak is the only signal", () => {
    expect(playerDrawerSource).toContain('hasThreatAlerts ? "mb-2.5 border-l-[3px] border-rose-500 bg-[#241217] px-3 py-2" : "mb-2.5"');
    expect(playerDrawerSource).not.toContain("border-amber-400/45");
  });
});
