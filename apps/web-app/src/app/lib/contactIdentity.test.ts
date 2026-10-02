import { describe, expect, it } from "vitest";
import {
  findContactForScannedLightningAddress,
  findContactLinkSuggestion,
  findUniqueContactByLightningAddress,
  normalizeContactLightningAddress,
} from "./contactIdentity";

describe("contact identity", () => {
  it("normalizes lightning addresses case-insensitively", () => {
    expect(normalizeContactLightningAddress(" Alice@Linky.Fit ")).toBe(
      "alice@linky.fit",
    );
  });

  it("returns a contact only for an unambiguous lightning-address match", () => {
    const alice = { id: "alice", lnAddress: "alice@linky.fit" };
    const bob = { id: "bob", lnAddress: "bob@linky.fit" };

    expect(
      findUniqueContactByLightningAddress([alice, bob], "ALICE@LINKY.FIT"),
    ).toBe(alice);
    expect(
      findUniqueContactByLightningAddress(
        [alice, { id: "alice-copy", lnAddress: "Alice@Linky.Fit" }],
        "alice@linky.fit",
      ),
    ).toBeNull();
  });

  it("never suggests a contact that already has an npub", () => {
    const alice = {
      id: "alice",
      lnAddress: "alice@linky.fit",
      npub: "npub1alice",
    };

    expect(findContactLinkSuggestion([alice], "alice@linky.fit")).toBeNull();
  });

  it("suggests only an unambiguous active contact without an npub", () => {
    const alice = { id: "alice", lnAddress: "alice@linky.fit", npub: null };

    expect(findContactLinkSuggestion([alice], "ALICE@linky.fit")).toBe(alice);
    expect(
      findContactLinkSuggestion(
        [alice, { id: "other", lnAddress: "alice@linky.fit", npub: "npub1x" }],
        "alice@linky.fit",
      ),
    ).toBeNull();
    expect(
      findContactLinkSuggestion(
        [{ ...alice, archivedAtSec: 10 }],
        "alice@linky.fit",
      ),
    ).toBeNull();
  });

  it("treats an archived contact with an npub as a competing claim", () => {
    const alice = { id: "alice", lnAddress: "alice@linky.fit", npub: null };
    const archived = {
      id: "archived",
      lnAddress: "alice@linky.fit",
      npub: "npub1old",
      archivedAtSec: 10,
    };

    expect(
      findContactLinkSuggestion([alice, archived], "alice@linky.fit"),
    ).toBeNull();
  });

  it("matches a scanned address only to a contact whose address the user entered", () => {
    const mallory = {
      id: "mallory",
      lnAddress: "alice@linky.fit",
      npub: "npub1mallory",
    };
    const alice = { id: "alice", lnAddress: "alice@linky.fit", npub: null };
    const bob = {
      id: "bob",
      lnAddress: "bob@linky.fit",
      npub: "npub1bob",
      lnAddressSetByUser: 1,
    };

    expect(
      findContactForScannedLightningAddress([mallory], "alice@linky.fit"),
    ).toBeNull();
    expect(
      findContactForScannedLightningAddress(
        [mallory, alice],
        "alice@linky.fit",
      ),
    ).toBe(alice);
    expect(findContactForScannedLightningAddress([bob], "BOB@linky.fit")).toBe(
      bob,
    );
  });
});
