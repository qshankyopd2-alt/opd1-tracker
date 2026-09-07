import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

it("never sends unsupported design operations to the real backend", async () => {
  vi.resetModules();
  vi.stubEnv("VITE_DESIGN_MODE", "true");
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const { backend } = await import("./client");
  await expect(backend.sessionStart()).rejects.toThrow("Design harness has no mapping");
  expect(fetch).not.toHaveBeenCalled();
});
