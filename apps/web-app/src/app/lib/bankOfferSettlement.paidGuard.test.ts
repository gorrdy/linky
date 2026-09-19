import { afterEach, describe, expect, it } from "vitest";
import {
  clearBankPaymentOfferPaid,
  markBankPaymentOfferPaid,
  wasBankPaymentOfferPaid,
} from "./bankOfferSettlement";

afterEach(() => localStorage.clear());

describe("bank offer paid guard", () => {
  it("marks, reads and clears a paid claim per offer id", () => {
    expect(wasBankPaymentOfferPaid("offer-1")).toBe(false);
    markBankPaymentOfferPaid("offer-1");
    expect(wasBankPaymentOfferPaid("offer-1")).toBe(true);
    expect(wasBankPaymentOfferPaid("offer-2")).toBe(false);
    clearBankPaymentOfferPaid("offer-1");
    expect(wasBankPaymentOfferPaid("offer-1")).toBe(false);
  });

  it("ignores blank offer ids", () => {
    markBankPaymentOfferPaid("   ");
    expect(wasBankPaymentOfferPaid("   ")).toBe(false);
    expect(wasBankPaymentOfferPaid("")).toBe(false);
  });
});
