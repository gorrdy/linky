import { describe, expect, it } from "vitest";
import {
  canMergeContactNpubs,
  groupDuplicateContacts,
  pickContactToKeep,
} from "./contactDedupe";

describe("groupDuplicateContacts", () => {
  it("merges contacts that share an npub or a user-set lightning address", () => {
    expect(
      groupDuplicateContacts([
        { npub: "npub1alice", lnAddress: null },
        {
          npub: "npub1alice",
          lnAddress: "alice@linky.fit",
          lnAddressSetByUser: 1,
        },
        { npub: null, lnAddress: "Alice@Linky.Fit" },
        { npub: "npub1bob", lnAddress: "bob@linky.fit" },
        { npub: null, lnAddress: "carol@linky.fit" },
        { npub: null, lnAddress: "carol@linky.fit" },
      ]),
    ).toEqual([
      [0, 1, 2],
      [4, 5],
    ]);
  });

  it("keeps an address-only contact apart from an npub whose address only mirrors its profile", () => {
    expect(
      groupDuplicateContacts([
        { npub: "npub1mallory", lnAddress: "alice@linky.fit" },
        { npub: null, lnAddress: "alice@linky.fit" },
      ]),
    ).toEqual([]);
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

describe("pickContactToKeep", () => {
  it("keeps the row that already has the npub, so none is written onto another row", () => {
    const withNpub = { id: "a", npub: "npub1alice" };
    const richer = {
      id: "b",
      name: "Alice",
      lnAddress: "alice@linky.fit",
      groupName: "Family",
    };
    expect(pickContactToKeep([richer, withNpub])).toBe(withNpub);
  });
});
