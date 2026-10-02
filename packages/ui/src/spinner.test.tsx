import { describe, expect, it } from "vitest";
import { render } from "../test/render";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("exposes a single labelled progressbar", async () => {
    const container = await render(<Spinner accessibilityLabel="Loading" />);
    const bars = container.querySelectorAll("[role=progressbar]");
    expect(bars).toHaveLength(1);
    expect(bars[0]?.getAttribute("aria-label")).toBe("Loading");
  });
});
