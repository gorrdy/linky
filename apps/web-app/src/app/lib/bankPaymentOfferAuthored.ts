import { Schema } from "effect";
import {
  safeLocalStorageGetJson,
  safeLocalStorageSetJson,
} from "../../utils/storage";

// Offers this device genuinely created, keyed by offerId → the sat amount we
// offered, plus the ids we have already settled. An attacker who gift-wraps a
// forged "bank_paid" snapshot claiming offerer === us cannot write here, so
// this is the trustworthy source for "is this my offer?" and "how much did I
// offer?" — the message store keeps only the latest snapshot per contact and
// so cannot tell a real offer awaiting settlement from a forgery.
const AUTHORED_KEY = "linky.bank_offer_authored";
const SETTLED_KEY = "linky.bank_offer_settled";

const AuthoredMap = Schema.Record({
  key: Schema.String,
  value: Schema.Number,
});
const SettledList = Schema.Array(Schema.String);

const readAuthored = (): Record<string, number> => ({
  ...safeLocalStorageGetJson(AUTHORED_KEY, AuthoredMap, {}),
});

const readSettled = (): Set<string> =>
  new Set(safeLocalStorageGetJson(SETTLED_KEY, SettledList, []));

export const recordAuthoredBankPaymentOffer = (
  offerId: string,
  amountSat: number,
): void => {
  const id = offerId.trim();
  if (!id || !Number.isInteger(amountSat) || amountSat <= 0) return;
  const authored = readAuthored();
  if (authored[id] === amountSat) return;
  authored[id] = amountSat;
  safeLocalStorageSetJson(AUTHORED_KEY, authored);
};

export const getAuthoredBankPaymentOfferAmount = (
  offerId: string,
): number | null => {
  const amount = readAuthored()[offerId.trim()];
  return typeof amount === "number" && amount > 0 ? amount : null;
};

export const isAuthoredBankPaymentOffer = (offerId: string): boolean =>
  Object.prototype.hasOwnProperty.call(readAuthored(), offerId.trim());

export const getAuthoredBankPaymentOfferIds = (): Set<string> =>
  new Set(Object.keys(readAuthored()));

export const isBankPaymentOfferSettled = (offerId: string): boolean =>
  readSettled().has(offerId.trim());

export const getSettledBankPaymentOfferIds = (): Set<string> => readSettled();

export const markBankPaymentOfferSettled = (offerId: string): void => {
  const id = offerId.trim();
  if (!id) return;
  const settled = readSettled();
  if (settled.has(id)) return;
  settled.add(id);
  safeLocalStorageSetJson(SETTLED_KEY, [...settled]);
};
