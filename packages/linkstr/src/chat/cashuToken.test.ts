import { Amount, getEncodedToken } from "@cashu/cashu-ts";
import {
  encodePaymentRequestPayload,
  extractWholeCashuToken,
  parseCashuToken,
  parsePaymentRequestPayload,
} from "./cashuToken";

const toBase64Url = (value: string): string =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const v3Token = (value: unknown): string =>
  `cashuA${toBase64Url(JSON.stringify(value))}`;

const proof = (amount: number, index: number) => ({
  amount,
  id: "009a1f293253e41e",
  secret: `secret-${index}`,
  C: `c-${index}`,
});

describe("parseCashuToken", () => {
  it("sums v3 proofs and extracts the mint and unit", () => {
    const token = v3Token({
      token: [
        { mint: "https://mint.test", proofs: [proof(2, 1), proof(4, 2)] },
      ],
      unit: "sat",
    });

    expect(parseCashuToken(token)).toEqual({
      amount: 6,
      mint: "https://mint.test",
      unit: "sat",
    });
  });

  it("decodes a v4 token produced by cashu-ts", () => {
    const binaryProof = (amount: number, index: number) => ({
      amount: Amount.from(amount),
      id: "009a1f293253e41e",
      secret: `secret-${index}`,
      C: `02${"ab".repeat(32)}`,
    });
    const token = getEncodedToken({
      mint: "https://mint.test",
      unit: "sat",
      proofs: [binaryProof(4, 1), binaryProof(16, 2)],
    });

    expect(token.startsWith("cashuB")).toBe(true);
    expect(parseCashuToken(token)).toEqual({
      amount: 20,
      mint: "https://mint.test",
      unit: "sat",
    });
  });

  it.each([
    ["prose starting with cashu", "cashually speaking"],
    ["invalid payload", "cashuA hello"],
    ["empty string", ""],
    [
      "zero amount",
      `cashuA${toBase64Url(
        JSON.stringify({
          token: [{ mint: "https://mint.test", proofs: [] }],
        }),
      )}`,
    ],
    [
      "multi-entry v3",
      `cashuA${toBase64Url(
        JSON.stringify({
          token: [
            { mint: "https://mint-a.test", proofs: [proof(1, 1)] },
            { mint: "https://mint-b.test", proofs: [proof(2, 2)] },
          ],
        }),
      )}`,
    ],
    [
      "raw JSON proof bundle",
      JSON.stringify({
        mint: "https://mint.test",
        unit: "sat",
        proofs: [proof(32, 1)],
      }),
    ],
  ])("rejects %s", (_name, value) => {
    expect(parseCashuToken(value)).toBeNull();
  });
});

describe("extractWholeCashuToken", () => {
  const token = v3Token({
    token: [{ mint: "https://mint.test", proofs: [proof(1, 1)] }],
    unit: "sat",
  });

  it.each([token, `cashu:${token}`, `web+cashu://${token}`])(
    "accepts the whole token from %j",
    (value) => {
      expect(extractWholeCashuToken(value)).toBe(token);
    },
  );

  it("does not search inside longer text", () => {
    expect(extractWholeCashuToken(`here is ${token} thanks`)).toBeNull();
  });
});

describe("NUT-18 payment payload", () => {
  it("round-trips proofs through the payload JSON, keeping DLEQ and id", () => {
    const encoded = encodePaymentRequestPayload({
      id: "req-1",
      mint: "https://mint.test",
      unit: "sat",
      proofs: [
        {
          id: "009a1f293253e41e",
          amount: 4,
          secret: "secret-1",
          C: `02${"ab".repeat(32)}`,
          dleq: { e: "ee".repeat(32), s: "55".repeat(32), r: "aa".repeat(32) },
        },
        {
          id: "009a1f293253e41e",
          amount: 16,
          secret: "secret-2",
          C: `02${"ab".repeat(32)}`,
        },
      ],
    });
    expect(JSON.parse(encoded)).toEqual({
      id: "req-1",
      mint: "https://mint.test",
      unit: "sat",
      proofs: [
        expect.objectContaining({
          amount: 4,
          dleq: {
            e: "ee".repeat(32),
            s: "55".repeat(32),
            r: "aa".repeat(32),
          },
        }),
        expect.objectContaining({ amount: 16 }),
      ],
    });

    const parsed = parsePaymentRequestPayload(encoded);
    expect(parsed).toMatchObject({
      id: "req-1",
      memo: null,
      mint: "https://mint.test",
      unit: "sat",
    });
    expect(parseCashuToken(parsed?.token ?? "")).toEqual({
      amount: 20,
      mint: "https://mint.test",
      unit: "sat",
    });
  });

  it("rejects text that is not a payload", () => {
    expect(parsePaymentRequestPayload("hello")).toBeNull();
    expect(parsePaymentRequestPayload("{not json")).toBeNull();
    expect(
      parsePaymentRequestPayload(JSON.stringify({ mint: "x", unit: "sat" })),
    ).toBeNull();
    expect(
      parsePaymentRequestPayload(
        JSON.stringify({ mint: "https://mint.test", unit: "sat", proofs: [] }),
      ),
    ).toBeNull();
  });
});
