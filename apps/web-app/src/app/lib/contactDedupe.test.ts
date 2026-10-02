import { describe, expect, it } from "vitest";
import { canMergeContactNpubs, groupDuplicateContacts } from "./contactDedupe";

describe("groupDuplicateContacts", () => {
  it("merges contacts that share an npub or a lightning address", () => {
    expect(
      groupDuplicateContacts([
        { npub: "npub1alice", lnAddress: null },
        { npub: "npub1alice", lnAddress: "alice@linky.fit" },
        { npub: null, lnAddress: "Alice@Linky.Fit" },
        { npub: "npub1bob", lnAddress: "bob@linky.fit" },
      ]),
    ).toEqual([[0, 1, 2]]);
  });

  it("never merges different npubs because their lightning address matches", () => {
    expect(
      groupDuplicateContacts([
        { npub: "npub1alice", lnAddress: "alice@linky.fit" },
        { npub: "npub1mallory", lnAddress: "alice@linky.fit" },
      ]),
    ).toEqual([]);
  });

  it("leaves a contact without npub alone when its lightning address is claimed by different npubs", () => {
    expect(
      groupDuplicateContacts([
        { npub: "npub1alice", lnAddress: "alice@linky.fit" },
        { npub: null, lnAddress: "alice@linky.fit" },
        { npub: "npub1mallory", lnAddress: "alice@linky.fit" },
      ]),
    ).toEqual([]);
  });

  it("does not chain different npubs through contacts sharing an npub", () => {
    expect(
      groupDuplicateContacts([
        { npub: "npub1alice", lnAddress: "alice@linky.fit" },
        { npub: "npub1alice", lnAddress: "shared@linky.fit" },
        { npub: "npub1mallory", lnAddress: "shared@linky.fit" },
      ]),
    ).toEqual([[0, 1]]);
  });
});

describe("canMergeContactNpubs", () => {
  it("allows a merge only when at most one distinct npub is involved", () => {
    expect(canMergeContactNpubs("npub1alice", null)).toBe(true);
    expect(canMergeContactNpubs(" NPUB1alice", "npub1alice")).toBe(true);
    expect(canMergeContactNpubs("npub1alice", "npub1mallory")).toBe(false);
  });
});
