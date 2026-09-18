import { Amount, getEncodedToken, getTokenMetadata } from "@cashu/cashu-ts";
import { Schema } from "effect";

export interface ParsedCashuToken {
  readonly amount: number;
  readonly mint: string | null;
  readonly unit: string | null;
}

/**
 * Metadata of a standard encoded cashu token (`cashuA`/`cashuB`), or null when
 * the text is not one. Non-standard shapes (legacy cashu.me JSON bundles,
 * tokens embedded in longer text) are an app-level concern, not part of the
 * wire classification.
 */
export const parseCashuToken = (rawToken: string): ParsedCashuToken | null => {
  const raw = rawToken.trim();
  if (!raw.startsWith("cashu")) return null;
  try {
    const metadata = getTokenMetadata(raw);
    const amount = metadata.amount.toNumber();
    if (amount <= 0) return null;
    return {
      amount,
      mint: metadata.mint.trim() || null,
      unit: metadata.unit.trim() || null,
    };
  } catch {
    return null;
  }
};

const CASHU_URI_PREFIX = /^(web\+)?cashu:(\/\/)?/i;

export const extractWholeCashuToken = (text: string): string | null => {
  const candidate = text.trim().replace(CASHU_URI_PREFIX, "").trim();
  return parseCashuToken(candidate) === null ? null : candidate;
};

const PaymentRequestDleq = Schema.Struct({
  e: Schema.String,
  s: Schema.String,
  r: Schema.optional(Schema.String),
});

/** A NUT-00 proof as it travels in a NUT-18 payload: full keyset id, plain amount. */
export const PaymentRequestProof = Schema.Struct({
  id: Schema.String,
  amount: Schema.Number,
  secret: Schema.String,
  C: Schema.String,
  dleq: Schema.optional(PaymentRequestDleq),
  witness: Schema.optional(Schema.String),
});
export type PaymentRequestProof = typeof PaymentRequestProof.Type;

/** NUT-18 `PaymentRequestPayload`: the body a payer sends over a transport. */
export const PaymentRequestPayloadFields = {
  /** The request's `i`, echoed back so the payee can match the payment. */
  id: Schema.optional(Schema.String),
  memo: Schema.optional(Schema.String),
  mint: Schema.String,
  unit: Schema.String,
  proofs: Schema.NonEmptyArray(PaymentRequestProof),
};
const PaymentRequestPayloadStruct = Schema.Struct(PaymentRequestPayloadFields);
type PaymentRequestPayloadShape = typeof PaymentRequestPayloadStruct.Type;

const isPaymentRequestPayload = Schema.is(PaymentRequestPayloadStruct);

export interface ParsedPaymentRequestPayload {
  /** The payload's proofs re-encoded as a standard cashu token. */
  readonly token: string;
  readonly id: string | null;
  readonly memo: string | null;
  readonly mint: string;
  readonly unit: string;
}

/**
 * The wire content of a nostr-transport payment: the payload as JSON. The
 * proofs must carry full keyset ids (a v4 token shortens v2 ids), which is
 * why the caller supplies them instead of the encoder decoding the token.
 */
export const encodePaymentRequestPayload = (
  payload: PaymentRequestPayloadShape,
): string => {
  const id = payload.id?.trim();
  const memo = payload.memo?.trim();
  return JSON.stringify({
    ...(id ? { id } : {}),
    ...(memo ? { memo } : {}),
    mint: payload.mint,
    unit: payload.unit,
    proofs: payload.proofs.map((proof) => ({
      id: proof.id,
      amount: proof.amount,
      secret: proof.secret,
      C: proof.C,
      ...(proof.dleq === undefined
        ? {}
        : {
            dleq: {
              e: proof.dleq.e,
              s: proof.dleq.s,
              ...(proof.dleq.r === undefined ? {} : { r: proof.dleq.r }),
            },
          }),
      ...(proof.witness === undefined ? {} : { witness: proof.witness }),
    })),
  });
};

/**
 * A NUT-18 payment payload in `text`, with its proofs re-encoded as a token
 * the rest of the wallet understands; null when the text is anything else.
 */
export const parsePaymentRequestPayload = (
  text: string,
): ParsedPaymentRequestPayload | null => {
  const raw = text.trim();
  if (!raw.startsWith("{")) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPaymentRequestPayload(json)) return null;
  try {
    const memo = json.memo?.trim() || null;
    const token = getEncodedToken({
      mint: json.mint,
      unit: json.unit,
      ...(memo === null ? {} : { memo }),
      proofs: json.proofs.map((proof) => ({
        id: proof.id,
        amount: Amount.from(proof.amount),
        secret: proof.secret,
        C: proof.C,
        ...(proof.dleq === undefined
          ? {}
          : {
              dleq: {
                e: proof.dleq.e,
                s: proof.dleq.s,
                ...(proof.dleq.r === undefined ? {} : { r: proof.dleq.r }),
              },
            }),
        ...(proof.witness === undefined ? {} : { witness: proof.witness }),
      })),
    });
    if (parseCashuToken(token) === null) return null;
    return {
      token,
      id: json.id?.trim() || null,
      memo,
      mint: json.mint,
      unit: json.unit,
    };
  } catch {
    return null;
  }
};
