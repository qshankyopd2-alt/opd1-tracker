import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StatusBar } from "../StatusBar";

vi.mock("../../../state/AppContext", () => ({
  useApp: () => ({
    health: { appVersion: "1.0.3", clientStatus: "ok" },
    healthError: null,
  }),
}));

vi.mock("../../../state/LiveDataContext", () => ({
  useLiveData: () => ({
    board: null,
    isLive: false,
    updatedAt: null,
  }),
}));

const mockToggleMode = vi.fn();

vi.mock("../../../hooks/useWindowMode", () => ({
  useWindowMode: vi.fn(() => ({
    isMaximized: false,
    toggleMode: mockToggleMode,
  })),
}));

describe("StatusBar component accessibility", () => {
  it("renders window mode toggle button with aria-label when unmaximized", () => {
    const html = renderToStaticMarkup(<StatusBar />);
    expect(html).toContain('data-testid="window-mode-toggle"');
    expect(html).toContain('aria-label="Maximize window"');
    expect(html).toContain('aria-hidden="true"');
  });
});
