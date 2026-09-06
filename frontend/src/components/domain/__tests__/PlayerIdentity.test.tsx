import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlayerIdentity } from "../PlayerIdentity";

describe("PlayerIdentity", () => {
  it.each(["NovaFlux#MOCK", "اسم طويل جدًا#1234", "A Very Long Player Name#EU1"])("preserves the full identity and isolates the tag: %s", (name) => {
    const html = renderToStaticMarkup(<PlayerIdentity name={name} />);
    expect(html).toContain(`title="${name}"`);
    expect(html).toContain(`<bdi class="min-w-0 truncate">${name.slice(0, name.lastIndexOf("#"))}</bdi>`);
    expect(html).toContain("shrink-0 font-mono");
    expect(html).toContain(`${name.slice(name.lastIndexOf("#"))}</span>`);
  });
  it.each(["Player 12345678", "", "HiddenPlayer", "Name#"])("does not invent missing tags: %s", (name) => {
    expect(renderToStaticMarkup(<PlayerIdentity name={name} />)).not.toContain("font-mono");
  });
});
