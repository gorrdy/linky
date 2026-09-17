export interface CashuMessagePaymentProof {
  id: string;
  amount: number;
  secret: string;
  C: string;
}

export interface CashuMessagePaymentSendBatch {
  amount: number;
  mint: string;
  /** The token's proofs with full keyset ids, for a NUT-18 payment payload. */
  proofs: readonly CashuMessagePaymentProof[];
  token: string;
  unit: string | null;
}

interface CashuMessagePaymentPublishError {
  clientId: string;
  error: string;
  token: string;
}

export interface CashuMessagePaymentPublishingOutcome {
  hasPendingMessages: boolean;
  paymentNoticeError: string | null;
  publishErrors: CashuMessagePaymentPublishError[];
  publishedTokenTexts: string[];
  unpublishedTokenTexts: string[];
}

export interface CashuMessagePaymentHookResult {
  error?: string;
  ok: boolean;
  queued: boolean;
}
