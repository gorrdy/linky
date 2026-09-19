import {
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from "../../utils/storage";
import type { LocalNostrMessage } from "../types/appTypes";
import { getLinkyBankPaymentOfferInfo } from "./bankPaymentOffer";

const BANK_OFFER_PAID_KEY_PREFIX = "linky.bank_payment_offer_paid.v1.";

const bankOfferPaidKey = (offerId: string): string =>
  `${BANK_OFFER_PAID_KEY_PREFIX}${offerId.trim()}`;

/**
 * Whether a settlement payment for this offer has already been started on this
 * device. Set before the payment goes out and kept even when it is only
 * queued (offline), so a second "Mark done" tap — the case where the offerer
 * saw the settled-snapshot publish fail and tapped again — cannot pay twice.
 * Persisted, so it also survives a reload. Cleared only when the payment fails
 * outright, which leaves the offer retryable.
 */
export const wasBankPaymentOfferPaid = (offerId: string): boolean =>
  offerId.trim() !== "" &&
  safeLocalStorageGet(bankOfferPaidKey(offerId)) === "1";

export const markBankPaymentOfferPaid = (offerId: string): void => {
  if (offerId.trim()) safeLocalStorageSet(bankOfferPaidKey(offerId), "1");
};

export const clearBankPaymentOfferPaid = (offerId: string): void => {
  if (offerId.trim()) safeLocalStorageRemove(bankOfferPaidKey(offerId));
};

export const getAuthorizedBankOffer = (
  requested: LocalNostrMessage,
  authorizedMessages: readonly LocalNostrMessage[],
): LocalNostrMessage | null =>
  authorizedMessages.find(
    (message) =>
      message.id === requested.id &&
      message.contactId === requested.contactId &&
      message.content === requested.content &&
      message.rumorId === requested.rumorId,
  ) ?? null;

export const getBankOfferForSettlement = (
  requested: LocalNostrMessage,
  authorizedMessages: readonly LocalNostrMessage[],
  myPubkey: string | null,
): LocalNostrMessage | null => {
  if (!myPubkey) return null;
  const current = getAuthorizedBankOffer(requested, authorizedMessages);
  if (!current || current.direction !== "out") return null;
  const info = getLinkyBankPaymentOfferInfo(current.content);
  return info?.status === "bank_paid" && info.offererPublicKey === myPubkey
    ? current
    : null;
};
