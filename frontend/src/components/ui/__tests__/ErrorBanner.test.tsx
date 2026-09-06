import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorBanner } from "../ErrorBanner";

describe("ErrorBanner", () => {
  it("renders message and default testid", () => {
    const html = renderToStaticMarkup(<ErrorBanner message="Failed to load matches" />);
    expect(html).toContain('data-testid="error-banner"');
    expect(html).toContain("Failed to load matches");
    expect(html).not.toContain("error-retry-button");
  });

  it("renders retry button with ARIA attributes and focus ring when onRetry is provided", () => {
    const html = renderToStaticMarkup(<ErrorBanner message="Network error" onRetry={() => {}} />);
    expect(html).toContain('data-testid="error-retry-button"');
    expect(html).toContain('aria-label="Retry operation"');
    expect(html).toContain('type="button"');
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("aria-hidden=\"true\"");
  });
});
