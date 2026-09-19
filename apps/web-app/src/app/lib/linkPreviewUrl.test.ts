import { describe, expect, it } from "vitest";
import { linkPreviewUrl } from "./linkPreviewUrl";

describe("linkPreviewUrl", () => {
  it("strips the fragment and userinfo before previewing", () => {
    expect(linkPreviewUrl("https://user:pw@example.com/a?b=1#frag")).toBe(
      "https://example.com/a?b=1",
    );
  });

  it("refuses a Linky cashu share link (token lives in the fragment)", () => {
    const token = "cashuBo2Ft=abc";
    expect(
      linkPreviewUrl(`https://linky.fit/cashu/#${encodeURIComponent(token)}`),
    ).toBeNull();
    expect(linkPreviewUrl("https://app.linky.fit/cashu/")).toBeNull();
  });

  it("refuses any link that carries a cashu token", () => {
    expect(
      linkPreviewUrl(
        "https://evil.example/x#cashuBo2F0abcdefghijklmnopqrstuvwxyz012345",
      ),
    ).toBeNull();
  });

  it("previews an ordinary link unchanged", () => {
    expect(linkPreviewUrl("https://example.com/article")).toBe(
      "https://example.com/article",
    );
  });

  it("rejects non-http(s) and unparseable input", () => {
    expect(linkPreviewUrl("javascript:alert(1)")).toBeNull();
    expect(linkPreviewUrl("not a url")).toBeNull();
  });
});
