import { describe, expect, it } from "vitest";
import { render } from "../test/render";
import { Avatar } from "./display";

const glyph = async (name: string) =>
  (await render(<Avatar name={name} />)).querySelector("[role=img]")
    ?.textContent;

describe("Avatar", () => {
  it("shows up to two initials of the name", async () => {
    expect(await glyph("ada lovelace byron")).toBe("AL");
  });

  it("shows a question mark without a name", async () => {
    expect(await glyph(" ")).toBe("?");
  });
});
