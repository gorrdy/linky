import { describe, expect, it } from "vitest";
import { extractMessageLinks, normalizeMessageLinkMatch } from "./messageLinks";

describe("messageLinks", () => {
  it("finds http links and trims sentence punctuation", () => {
    expect(
      extractMessageLinks("See https://example.com/docs?q=1, please."),
    ).toEqual([
      {
        displayText: "https://example.com/docs?q=1",
        end: 33,
        start: 4,
        trailingText: ",",
        url: "https://example.com/docs?q=1",
      },
    ]);
  });

  it("normalizes bare www links to https", () => {
    expect(normalizeMessageLinkMatch("www.linky.fit/cashu")).toEqual({
      displayText: "www.linky.fit/cashu",
      trailingText: "",
      url: "https://www.linky.fit/cashu",
    });
  });

  it("processes a pathological trailing-bracket flood quickly", () => {
    // A short URL followed by tens of thousands of ")" used to be one giant
    // match whose O(n^2) normalization froze the chat for tens of seconds.
    const flood = `see https://a.bc/${")".repeat(60_000)}`;
    const started = performance.now();
    const links = extractMessageLinks(flood);
    const elapsedMs = performance.now() - started;

    expect(links).toHaveLength(1);
    // The match is capped, so the closers past the cap are left as plain text.
    expect(links[0]?.url.length).toBeLessThanOrEqual(2049);
    expect(elapsedMs).toBeLessThan(200);
  });

  it("keeps balanced parentheses inside a URL", () => {
    expect(
      normalizeMessageLinkMatch("https://example.com/wiki/Link_(film))."),
    ).toEqual({
      displayText: "https://example.com/wiki/Link_(film)",
      trailingText: ").",
      url: "https://example.com/wiki/Link_(film)",
    });
  });
});
