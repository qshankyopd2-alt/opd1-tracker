import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import ReactDOM from "react-dom/client";
import { useWindowMode, FIXED_WIDTH, FIXED_HEIGHT } from "../useWindowMode";
import capabilitySource from "../../../src-tauri/capabilities/default.json?raw";

// Configure React act environment
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface MockDom {
  win: Record<string, unknown>;
  container: Record<string, unknown>;
}

function createMockDom(tauri = false): MockDom {
  const win: Record<string, unknown> = {};
  if (tauri) win.__TAURI_INTERNALS__ = {};
  win.HTMLIFrameElement = class HTMLIFrameElement {};
  win.HTMLElement = class HTMLElement {};
  const container = {
    nodeType: 1,
    tagName: "DIV",
    ownerDocument: {
      nodeType: 9,
      createElement: () => ({
        nodeType: 1,
        style: {},
        setAttribute: () => {},
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
      createElementNS: () => ({
        nodeType: 1,
        style: {},
        setAttribute: () => {},
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
      createTextNode: () => ({ nodeType: 3 }),
      createComment: () => ({ nodeType: 8 }),
      addEventListener: () => {},
      removeEventListener: () => {},
      defaultView: win,
      activeElement: null,
    },
    appendChild: () => {},
    removeChild: () => {},
    insertBefore: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  return { win, container };
}

interface HookHandle<T> {
  readonly current: T;
  unmount: () => void;
}

async function renderHook<T>(hookFn: () => T, container: unknown): Promise<HookHandle<T>> {
  let currentResult!: T;
  const root = ReactDOM.createRoot(container as Element);

  function Harness() {
    currentResult = hookFn();
    return null;
  }

  await act(async () => {
    root.render(React.createElement(Harness));
  });

  return {
    get current() {
      return currentResult;
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("useWindowMode — fixed 1200×800, never maximized", () => {
  let dom: MockDom;
  const originalWindow = (globalThis as unknown as Record<string, unknown>).window;

  const originalHTMLIFrameElement = (globalThis as unknown as Record<string, unknown>).HTMLIFrameElement;

  beforeEach(() => {
    dom = createMockDom();
    (globalThis as unknown as Record<string, unknown>).window = dom.win;
    (globalThis as unknown as Record<string, unknown>).HTMLIFrameElement = dom.win.HTMLIFrameElement;
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      (globalThis as unknown as Record<string, unknown>).window = originalWindow;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).window;
    }
    if (originalHTMLIFrameElement !== undefined) {
      (globalThis as unknown as Record<string, unknown>).HTMLIFrameElement = originalHTMLIFrameElement;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).HTMLIFrameElement;
    }
    vi.restoreAllMocks();
  });

  it("defines the single supported tracker size: 1200x800", () => {
    expect(FIXED_WIDTH).toBe(1200);
    expect(FIXED_HEIGHT).toBe(800);
  });

  it("is always in fixed mode and never reports a maximized window", async () => {
    const hook = await renderHook(() => useWindowMode(), dom.container);
    expect(hook.current.isTauri).toBe(false);
    expect(hook.current.mode).toBe("fixed");
    expect(hook.current.isMaximized).toBe(false);
    expect(hook.current.fixedWidth).toBe(1200);
    expect(hook.current.fixedHeight).toBe(800);
    hook.unmount();
  });

  it("detects the Tauri environment but still exposes no maximize mode", async () => {
    dom = createMockDom(true);
    (globalThis as unknown as Record<string, unknown>).window = dom.win;
    const hook = await renderHook(() => useWindowMode(), dom.container);
    expect(hook.current.isTauri).toBe(true);
    expect(hook.current.mode).toBe("fixed");
    expect(hook.current.isMaximized).toBe(false);
    hook.unmount();
  });

  it("grants no maximize or resize window permissions", () => {
    const permissions = JSON.parse(capabilitySource).permissions as string[];
    expect(permissions).toEqual(["core:default"]);
    expect(permissions.join(" ")).not.toContain("maximize");
    expect(permissions.join(" ")).not.toContain("set-size");
    expect(permissions.join(" ")).not.toContain("set-resizable");
  });
});
