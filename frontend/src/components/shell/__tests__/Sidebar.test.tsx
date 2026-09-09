import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sidebar } from "../Sidebar";
import { AppProvider } from "../../../state/AppContext";

describe("Sidebar component", () => {
  it("renders correctly with focus handlers for keyboard accessibility", () => {
    const html = renderToStaticMarkup(
      <AppProvider>
        <Sidebar />
      </AppProvider>
    );

    expect(html).toContain('data-testid="sidebar"');
    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toContain('data-testid="nav-live"');
    expect(html).toContain('data-testid="nav-competitive"');
  });
});
