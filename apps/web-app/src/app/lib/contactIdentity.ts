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
  readonly npub?: string | null;
}

export const findContactLinkSuggestion = <
  TContact extends LinkCandidateContact,
>(
  contacts: readonly TContact[],
  senderLightningAddress: unknown,
): TContact | null => {
  const activeContacts = contacts.filter((contact) => {
    const archivedAtSec = contact.archivedAtSec ?? 0;
    return !Number.isFinite(archivedAtSec) || archivedAtSec <= 0;
  });
  const match = findUniqueContactByLightningAddress(
    activeContacts,
    senderLightningAddress,
  );
  if (!match || (match.npub ?? "").trim()) return null;
  return match;
};
