import { describe, expect, it } from "vitest";
import {
  addContactLinkDismissal,
  isContactLinkSuggestionDismissed,
} from "./contactLinkDismissals";

const DAY_SEC = 24 * 60 * 60;

describe("contact link dismissals", () => {
  const dismissal = { atSec: 1_000, contactId: "alice", senderNpub: "npub1x" };

  it("keeps a dismissed sender and contact pair dismissed", () => {
    expect(
      isContactLinkSuggestionDismissed(
        [dismissal],
        "npub1x",
        "alice",
        1_000 + 30 * DAY_SEC,
      ),
    ).toBe(true);
  });

  it("stops offering the same contact for other senders for a week", () => {
    expect(
      isContactLinkSuggestionDismissed(
        [dismissal],
        "npub1y",
        "alice",
        1_000 + 6 * DAY_SEC,
      ),
    ).toBe(true);
    expect(
      isContactLinkSuggestionDismissed(
        [dismissal],
        "npub1y",
        "alice",
        1_000 + 8 * DAY_SEC,
      ),
    ).toBe(false);
    expect(
      isContactLinkSuggestionDismissed([dismissal], "npub1y", "bob", 1_000),
    ).toBe(false);
  });

  it("drops entries of deleted contacts and caps the list", () => {
    const many = Array.from({ length: 250 }, (_v, index) => ({
      atSec: index,
      contactId: "alice",
      senderNpub: `npub1s${index}`,
    }));
    const next = addContactLinkDismissal(
      [...many, { atSec: 0, contactId: "gone", senderNpub: "npub1z" }],
      { atSec: 999, contactId: "alice", senderNpub: "npub1new" },
      new Set(["alice"]),
    );

    expect(next).toHaveLength(200);
    expect(next.some((entry) => entry.contactId === "gone")).toBe(false);
    expect(next.at(-1)?.senderNpub).toBe("npub1new");
  });
});
