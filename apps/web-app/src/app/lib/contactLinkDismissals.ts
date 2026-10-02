import { Schema } from "effect";

export const ContactLinkDismissal = Schema.Struct({
  atSec: Schema.Number,
  contactId: Schema.String,
  senderNpub: Schema.String,
});
export type ContactLinkDismissal = typeof ContactLinkDismissal.Type;

export const ContactLinkDismissals = Schema.Array(ContactLinkDismissal);

const CONTACT_COOLDOWN_SEC = 7 * 24 * 60 * 60;
const MAX_DISMISSALS = 200;

export const isContactLinkSuggestionDismissed = (
  dismissals: readonly ContactLinkDismissal[],
  senderNpub: string,
  contactId: string,
  nowSec: number,
): boolean =>
  dismissals.some(
    (dismissal) =>
      dismissal.contactId === contactId &&
      (dismissal.senderNpub === senderNpub ||
        nowSec - dismissal.atSec < CONTACT_COOLDOWN_SEC),
  );

export const addContactLinkDismissal = (
  dismissals: readonly ContactLinkDismissal[],
  dismissal: ContactLinkDismissal,
  existingContactIds: ReadonlySet<string>,
): ContactLinkDismissal[] =>
  [
    ...dismissals.filter((entry) => existingContactIds.has(entry.contactId)),
    dismissal,
  ].slice(-MAX_DISMISSALS);
