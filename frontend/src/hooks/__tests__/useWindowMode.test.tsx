import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import ReactDOM from "react-dom/client";
import { useWindowMode, FIXED_WIDTH, FIXED_HEIGHT } from "../useWindowMode";
import capabilitySource from "../../../src-tauri/capabilities/default.json?raw";

// Configure React act environment
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { mockWindow } = vi.hoisted(() => {
  return {
    mockWindow: {
      isMaximized: vi.fn(),
      setResizable: vi.fn(),
      onResized: vi.fn(),
      unmaximize: vi.fn(),
      maximize: vi.fn(),
      setSize: vi.fn(),
      center: vi.fn(),
    },
  };
});

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => mockWindow,
  LogicalSize: class LogicalSize {
    constructor(public width: number, public height: number) {}
  },
}));

interface MockDom {
  win: Record<string, unknown> & {
    innerWidth: number;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    dispatchEvent: (event: { type: string }) => void;
  };
  doc: Record<string, unknown>;
  screen: { availWidth: number };
  container: Record<string, unknown>;
  windowListeners: Map<string, Set<(evt: unknown) => void>>;
}

function createMockDom(initialWidth = 1920, availWidth = 1920): MockDom {
  const windowListeners = new Map<string, Set<(evt: unknown) => void>>();

  const win = {
    innerWidth: initialWidth,
    addEventListener: vi.fn((event: string, handler: (evt: unknown) => void) => {
      if (!windowListeners.has(event)) {
        windowListeners.set(event, new Set());
      }
      windowListeners.get(event)!.add(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: (evt: unknown) => void) => {
      windowListeners.get(event)?.delete(handler);
    }),
    dispatchEvent: (event: { type: string }) => {
      const handlers = windowListeners.get(event.type);
      if (handlers) {
        handlers.forEach((h) => h(event));
      }
    },
    HTMLIFrameElement: class {},
  };

  const doc = {
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
  };

  const screen = {
    availWidth,
  };

  const container = {
    nodeType: 1,
    tagName: "DIV",
    ownerDocument: doc,
    appendChild: () => {},
    removeChild: () => {},
    insertBefore: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  return { win, doc, screen, container, windowListeners };
}

interface HookHandle<T> {
  readonly current: T;
  unmount: () => void;
  rerender: () => void;
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
    rerender: () => {
      act(() => {
        root.render(React.createElement(Harness));
      });
    },
  };
}

describe("useWindowMode", () => {
  let dom: MockDom;
  const originalWindow = (globalThis as unknown as Record<string, unknown>).window;
  const originalDocument = (globalThis as unknown as Record<string, unknown>).document;
  const originalScreen = (globalThis as unknown as Record<string, unknown>).screen;
  const originalHTMLIFrameElement = (globalThis as unknown as Record<string, unknown>).HTMLIFrameElement;

  beforeEach(() => {
    vi.clearAllMocks();
    dom = createMockDom(1920, 1920);
    (globalThis as unknown as Record<string, unknown>).window = dom.win;
    (globalThis as unknown as Record<string, unknown>).document = dom.doc;
    (globalThis as unknown as Record<string, unknown>).screen = dom.screen;
    (globalThis as unknown as Record<string, unknown>).HTMLIFrameElement = dom.win.HTMLIFrameElement;
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      (globalThis as unknown as Record<string, unknown>).window = originalWindow;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).window;
    }
    if (originalDocument !== undefined) {
      (globalThis as unknown as Record<string, unknown>).document = originalDocument;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).document;
    }
    if (originalScreen !== undefined) {
      (globalThis as unknown as Record<string, unknown>).screen = originalScreen;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).screen;
    }
    if (originalHTMLIFrameElement !== undefined) {
      (globalThis as unknown as Record<string, unknown>).HTMLIFrameElement = originalHTMLIFrameElement;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).HTMLIFrameElement;
    }
    vi.restoreAllMocks();
  });

  it("defines strict fixed dimensions of 1200x700", () => {
    expect(FIXED_WIDTH).toBe(1200);
    expect(FIXED_HEIGHT).toBe(700);
  });

  describe("browser / non-Tauri environment", () => {
    it("computes maximized mode correctly based on available width", async () => {
      dom.win.innerWidth = 1920;
      dom.screen.availWidth = 1920;
      const hook = await renderHook(() => useWindowMode(), dom.container);
      expect(hook.current.isTauri).toBe(false);
      expect(hook.current.mode).toBe("maximized");
      expect(hook.current.isMaximized).toBe(true);
      hook.unmount();
    });

    it("computes fixed mode correctly when window is smaller", async () => {
      dom.win.innerWidth = 1200;
      dom.screen.availWidth = 1920;
      const hook = await renderHook(() => useWindowMode(), dom.container);
      expect(hook.current.isTauri).toBe(false);
      expect(hook.current.mode).toBe("fixed");
      expect(hook.current.isMaximized).toBe(false);
      hook.unmount();
    });

    it("toggles window mode state seamlessly in fallback mode", async () => {
      dom.win.innerWidth = 1920;
      const hook = await renderHook(() => useWindowMode(), dom.container);
      expect(hook.current.isMaximized).toBe(true);

      await act(async () => {
        await hook.current.toggleMode();
      });
      expect(hook.current.isMaximized).toBe(false);

      await act(async () => {
        await hook.current.toggleMode();
      });
      expect(hook.current.isMaximized).toBe(true);
      hook.unmount();
    });

    it("updates mode upon window resize and tears down listener on unmount", async () => {
      dom.win.innerWidth = 1920;
      const hook = await renderHook(() => useWindowMode(), dom.container);
      expect(hook.current.isMaximized).toBe(true);
      expect(dom.win.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));

      // Trigger resize event to smaller width
      dom.win.innerWidth = 1000;
      await act(async () => {
        dom.win.dispatchEvent({ type: "resize" });
      });
      expect(hook.current.isMaximized).toBe(false);
      expect(hook.current.mode).toBe("fixed");

      // Unmount and verify listener removal
      hook.unmount();
      expect(dom.win.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });
  });

  describe("Tauri environment", () => {
    beforeEach(() => {
      (dom.win as Record<string, unknown>).__TAURI_INTERNALS__ = {};
      mockWindow.isMaximized.mockResolvedValue(false);
      mockWindow.setResizable.mockResolvedValue(undefined);
      mockWindow.onResized.mockResolvedValue(vi.fn());
      mockWindow.unmaximize.mockResolvedValue(undefined);
      mockWindow.maximize.mockResolvedValue(undefined);
      mockWindow.setSize.mockResolvedValue(undefined);
      mockWindow.center.mockResolvedValue(undefined);
    });

    it("initializes Tauri window state and locks resize when not maximized", async () => {
      mockWindow.isMaximized.mockResolvedValue(false);
      const hook = await renderHook(() => useWindowMode(), dom.container);

      expect(hook.current.isTauri).toBe(true);
      expect(mockWindow.isMaximized).toHaveBeenCalled();
      expect(mockWindow.setResizable).toHaveBeenCalledWith(false);
      expect(mockWindow.onResized).toHaveBeenCalled();
      hook.unmount();
    });

    it("initializes Tauri window state when already maximized", async () => {
      mockWindow.isMaximized.mockResolvedValue(true);
      const hook = await renderHook(() => useWindowMode(), dom.container);

      expect(hook.current.isTauri).toBe(true);
      expect(hook.current.isMaximized).toBe(true);
      expect(hook.current.mode).toBe("maximized");
      expect(mockWindow.setResizable).not.toHaveBeenCalled();
      hook.unmount();
    });

    it("handles native resize events and updates state", async () => {
      let resizeCallback: (() => Promise<void>) | undefined;
      mockWindow.onResized.mockImplementation(async (cb: () => Promise<void>) => {
        resizeCallback = cb;
        return vi.fn();
      });

      const hook = await renderHook(() => useWindowMode(), dom.container);
      expect(hook.current.isMaximized).toBe(false);

      // Window becomes maximized
      mockWindow.isMaximized.mockResolvedValue(true);
      await act(async () => {
        await resizeCallback?.();
      });
      expect(hook.current.isMaximized).toBe(true);
      expect(hook.current.mode).toBe("maximized");

      // Window returns to unmaximized
      mockWindow.isMaximized.mockResolvedValue(false);
      await act(async () => {
        await resizeCallback?.();
      });
      expect(hook.current.isMaximized).toBe(false);
      expect(mockWindow.setResizable).toHaveBeenCalledWith(false);

      hook.unmount();
    });

    it("tears down listener on unmount (normal cleanup)", async () => {
      const unsubscribeSpy = vi.fn();
      mockWindow.onResized.mockResolvedValue(unsubscribeSpy);

      const hook = await renderHook(() => useWindowMode(), dom.container);
      expect(unsubscribeSpy).not.toHaveBeenCalled();

      hook.unmount();
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });

    it("performs delayed subscription cleanup if unmounted before onResized resolves", async () => {
      let resolveOnResized!: (unsub: () => void) => void;
      mockWindow.onResized.mockReturnValue(
        new Promise<() => void>((resolve) => {
          resolveOnResized = resolve;
        }),
      );

      const hook = await renderHook(() => useWindowMode(), dom.container);
      // Unmount while onResized promise is still pending
      hook.unmount();

      const unsubscribeSpy = vi.fn();
      // Resolve onResized after component was unmounted
      await act(async () => {
        resolveOnResized(unsubscribeSpy);
      });

      // The hook must detect !isMounted and cleanly call unsubscribe immediately
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });

    it("toggles mode from maximized to fixed", async () => {
      mockWindow.isMaximized.mockResolvedValue(true);
      const hook = await renderHook(() => useWindowMode(), dom.container);

      await act(async () => {
        await hook.current.toggleMode();
      });

      expect(mockWindow.unmaximize).toHaveBeenCalled();
      expect(mockWindow.setSize).toHaveBeenCalledWith(expect.objectContaining({ width: 1200, height: 700 }));
      expect(mockWindow.setResizable).toHaveBeenCalledWith(false);
      expect(mockWindow.center).toHaveBeenCalled();
      expect(hook.current.isMaximized).toBe(false);

      hook.unmount();
    });

    it("toggles mode from fixed to maximized", async () => {
      mockWindow.isMaximized.mockResolvedValue(false);
      const hook = await renderHook(() => useWindowMode(), dom.container);

      await act(async () => {
        await hook.current.toggleMode();
      });

      expect(mockWindow.setResizable).toHaveBeenCalledWith(true);
      expect(mockWindow.maximize).toHaveBeenCalled();
      expect(hook.current.isMaximized).toBe(true);

      hook.unmount();
    });
  });

  it("grants every native window command used by the toggle", () => {
    const permissions = JSON.parse(capabilitySource).permissions as string[];
    expect(permissions).toEqual(
      expect.arrayContaining([
        "core:window:allow-center",
        "core:window:allow-maximize",
        "core:window:allow-set-resizable",
        "core:window:allow-set-size",
        "core:window:allow-unmaximize",
      ]),
    );
  });
});
