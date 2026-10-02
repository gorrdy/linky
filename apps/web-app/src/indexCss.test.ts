import { themes } from "@linky-fit/ui/tokens";
import { describe, expect, it } from "vitest";
import css from "./index.css?raw";

describe("index.css", () => {
  it("repeats the dark theme colors it paints before the JS bundle loads", () => {
    expect(css).toContain(`--app-flat-bg: ${themes.dark.background};`);
    expect(css).toContain(`--app-color: ${themes.dark.color};`);
    expect(css).toContain(`--app-accent: ${themes.dark.accent};`);
  });
});
