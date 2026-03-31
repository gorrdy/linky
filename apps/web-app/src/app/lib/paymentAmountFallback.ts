const FULL_BALANCE_PAYMENT_RETRY_FEE_RESERVES = [0, 1, 5];

export const buildPaymentAmountAttempts = (
  requestedAmountSat: number,
  availableBalanceSat: number,
): number[] => {
  const normalizedRequestedAmount = Math.trunc(requestedAmountSat);
  const normalizedAvailableBalance = Math.trunc(availableBalanceSat);

  if (
    !Number.isFinite(normalizedRequestedAmount) ||
    normalizedRequestedAmount <= 0
  ) {
    return [];
  }

  if (normalizedRequestedAmount !== normalizedAvailableBalance) {
    return [normalizedRequestedAmount];
  }

  const attempts: number[] = [];
  for (const feeReserveSat of FULL_BALANCE_PAYMENT_RETRY_FEE_RESERVES) {
    const candidateAmount = normalizedRequestedAmount - feeReserveSat;
    if (candidateAmount <= 0 || attempts.includes(candidateAmount)) continue;
    attempts.push(candidateAmount);
  }

  return attempts;
};

export const getPaymentAmountReserveCap = (
  requestedAmountSat: number,
  availableBalanceSat: number,
): number => {
  const amountAttempts = buildPaymentAmountAttempts(
    requestedAmountSat,
    availableBalanceSat,
  );
  if (amountAttempts.length === 0) return 0;
  return requestedAmountSat - amountAttempts[amountAttempts.length - 1];
};

export const isRetryablePaymentAmountFailure = (
  errorMessage: string,
): boolean => {
  const normalizedMessage = errorMessage.trim().toLowerCase();
  return (
    normalizedMessage.includes("insufficient funds") ||
    normalizedMessage.includes("not enough funds") ||
    normalizedMessage.includes("not enough balance") ||
    normalizedMessage.includes("amount out of lnurl range")
  );
};

export const getNextRemainingRequestedPaymentAmount = (
  remainingAmountSat: number,
  requestedAmountSat: number,
): number => {
  return Math.max(0, remainingAmountSat - requestedAmountSat);
};
