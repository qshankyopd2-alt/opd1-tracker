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
  it("keeps the drawer below match detail", () => {
    expect(playerDrawerSource).toContain("<Dialog.Root");
    expect(playerDrawerSource).toContain("z-[60]");
    expect(matchModalSource).toContain("<Dialog.Root");
    expect(matchModalSource).toContain("z-[70]");
    expect(playerDrawerSource).toContain("bg-black/70");
    expect(matchModalSource).toContain("bg-black/70");
  });

  it("uses Radix focus management and restores the row opener", () => {
    expect(playerDrawerSource).toContain("onCloseAutoFocus");
    expect(playerDrawerSource).toContain("restoreFocus.focus()");
    expect(matchModalSource).toContain("onCloseAutoFocus");
    // Closing the embedded match restores focus to the match row that opened it
    expect(playerDrawerSource).toContain("onEscapeKeyDown");
    expect(playerDrawerSource).toContain("opener?.isConnected");
    expect(playerDrawerSource).toContain("opener.focus()");
  });

  it("opens a wide profile workspace over the unchanged roster", () => {
    expect(playerDrawerSource).toContain("modal-backdrop player-profile-layer");
    expect(playerDrawerSource).toContain("modal drawer-slide");
    expect(styles).toContain(".player-profile-layer .modal");
    expect(styles).toContain("width: min(1120px, calc(100vw - 32px));");
    expect(styles).toContain("max-height: 960px;");
    expect(styles).toContain("justify-content: center;");
    expect(playerDrawerSource).toContain("drawer-player-card-art");
  });

  it("sets explicit aria-labelledby and unsets aria-describedby on Dialog.Content", () => {
    expect(playerDrawerSource).toContain('aria-labelledby={openMatch ? "match-detail-title" : "player-drawer-title"}');
    expect(playerDrawerSource).toContain("aria-describedby={undefined}");
    expect(matchModalSource).toContain('aria-labelledby="match-detail-title"');
    expect(matchModalSource).toContain("aria-describedby={undefined}");
  });

  it("handles remote playerCard loading failure with reset on player/card change", () => {
    expect(playerDrawerSource).toContain("cardFailed");
    expect(playerDrawerSource).toContain("setCardFailed(false)");
    expect(playerDrawerSource).toContain("contourTexture");
    expect(playerDrawerSource).toContain("[player.puuid, player.playerCard]");
  });
});

describe("PlayerDrawer alert hierarchy", () => {
  it("renders filled smurf, boosting, and streak alerts ahead of the overview", () => {
    expect(playerDrawerSource).toContain("live-alert-smurf");
    expect(playerDrawerSource).toContain("live-alert-boosting");
    expect(playerDrawerSource).toContain("<StreakBadge");
    expect(playerDrawerSource).toContain('data-alert-kind={hasThreatAlerts ? "threat" : "streak"}');
    // Reasons are shown as heuristic indicators, never as fact
    expect(playerDrawerSource).toContain("Heuristic indicators");
    expect(playerDrawerSource).toContain("smurfReasons.join");
  });

  it("uses no callout surface when streak is the only signal", () => {
    expect(playerDrawerSource).toContain('"mb-3 border-l-[3px] border-accent bg-[#2a1418] px-3 py-2"');
    expect(playerDrawerSource).toContain('"mb-3 border-l-[3px] border-edge bg-card px-3 py-2"');
    expect(playerDrawerSource).not.toContain("border-rose-500");
  });
});
