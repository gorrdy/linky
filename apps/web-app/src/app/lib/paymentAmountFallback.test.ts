import { describe, expect, it } from "vitest";
import {
  buildPaymentAmountAttempts,
  getNextRemainingRequestedPaymentAmount,
  getPaymentAmountReserveCap,
  isRetryablePaymentAmountFailure,
} from "./paymentAmountFallback";

describe("buildPaymentAmountAttempts", () => {
  it("adds fee-reserve fallbacks when sending the full balance", () => {
    expect(buildPaymentAmountAttempts(10, 10)).toEqual([10, 9, 5]);
  });

  it("deduplicates and drops non-positive fallback attempts", () => {
    expect(buildPaymentAmountAttempts(3, 3)).toEqual([3, 2]);
    expect(buildPaymentAmountAttempts(1, 1)).toEqual([1]);
  });

  it("keeps a single attempt when not sending the full balance", () => {
    expect(buildPaymentAmountAttempts(10, 12)).toEqual([10]);
  });
});

describe("getPaymentAmountReserveCap", () => {
  it("returns the max reserved fee from the fallback ladder", () => {
    expect(getPaymentAmountReserveCap(249, 249)).toBe(5);
    expect(getPaymentAmountReserveCap(200, 249)).toBe(0);
  });
});

describe("isRetryablePaymentAmountFailure", () => {
  it("retries amount-related reserve failures", () => {
    expect(
      isRetryablePaymentAmountFailure(
        "Insufficient funds (need 101, have 100)",
      ),
    ).toBe(true);
    expect(isRetryablePaymentAmountFailure("Not enough balance to send")).toBe(
      true,
    );
    expect(isRetryablePaymentAmountFailure("Amount out of LNURL range")).toBe(
      true,
    );
  });

  it("does not retry unrelated failures", () => {
    expect(isRetryablePaymentAmountFailure("Invoice missing")).toBe(false);
  });
});

describe("getNextRemainingRequestedPaymentAmount", () => {
  it("treats reserved fee as consumed from the original request", () => {
    expect(getNextRemainingRequestedPaymentAmount(249, 249)).toBe(0);
  });

  it("keeps the rest of the requested total for later mints", () => {
    expect(getNextRemainingRequestedPaymentAmount(500, 249)).toBe(251);
  });
});
