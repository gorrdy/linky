import { sqliteTrue } from "@linky-fit/linksync";

interface LightningAddressContact {
  readonly lnAddress?: unknown;
}

export const normalizeContactLightningAddress = (value: unknown): string => {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
};

export const findUniqueContactByLightningAddress = <
  TContact extends LightningAddressContact,
>(
  contacts: readonly TContact[],
  lightningAddress: unknown,
): TContact | null => {
  const normalizedAddress = normalizeContactLightningAddress(lightningAddress);
  if (!normalizedAddress) return null;

  let match: TContact | null = null;
  for (const contact of contacts) {
    if (
      normalizeContactLightningAddress(contact.lnAddress) !== normalizedAddress
    ) {
      continue;
    }
    if (match) return null;
    match = contact;
  }
  return match;
};

interface LinkCandidateContact extends LightningAddressContact {
  readonly archivedAtSec?: number | null;
  readonly lnAddressSetByUser?: number | null;
  readonly npub?: string | null;
}

const isArchived = (contact: LinkCandidateContact): boolean => {
  const archivedAtSec = contact.archivedAtSec ?? 0;
  return Number.isFinite(archivedAtSec) && archivedAtSec > 0;
};

const hasNpub = (contact: LinkCandidateContact): boolean =>
  Boolean((contact.npub ?? "").trim());

export const findContactLinkSuggestion = <
  TContact extends LinkCandidateContact,
>(
  contacts: readonly TContact[],
  senderLightningAddress: unknown,
): TContact | null => {
  const match = findUniqueContactByLightningAddress(
    contacts.filter((contact) => hasNpub(contact) || !isArchived(contact)),
    senderLightningAddress,
  );
  if (!match || hasNpub(match)) return null;
  return match;
};

export const findContactForScannedLightningAddress = <
  TContact extends LinkCandidateContact,
>(
  contacts: readonly TContact[],
  scannedLightningAddress: unknown,
): TContact | null =>
  findUniqueContactByLightningAddress(
    contacts.filter(
      (contact) =>
        !hasNpub(contact) || contact.lnAddressSetByUser === sqliteTrue,
    ),
    scannedLightningAddress,
  );
