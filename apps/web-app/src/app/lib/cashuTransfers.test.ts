import { StoredProof, TokenTransfer } from "@linky/linkshu";
import type { ProofState } from "@linky/linkshu";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { isUnclaimedSend } from "./cashuTransfers";

const decodeTransfer = Schema.decodeUnknownSync(TokenTransfer);
const decodeProof = Schema.decodeUnknownSync(StoredProof);

const transfer = (
  kind: TokenTransfer["kind"],
  status: TokenTransfer["status"],
) =>
  decodeTransfer({
    id: "op-1",
    kind,
    status,
    tokenText: "cashuBtoken",
    mint: "https://mint.example",
    unit: "sat",
    amount: 21,
    error: null,
    createdAt: 1,
  });

const proofOf = (operationId: string, state: ProofState) =>
  decodeProof({
    id: `proof-${operationId}-${state}`,
    mint: "https://mint.example",
    unit: "sat",
    keysetId: "009a1f293253e41e",
    amount: 21,
    secret: `secret-${state}`,
    C: `02${"ab".repeat(32)}`,
    dleq: null,
    state,
    operationId,
    createdAt: 1,
  });

describe("isUnclaimedSend", () => {
  it.each(["issued", "externalized", "done"] as const)(
    "is a %s send with a proof of its own still handed out",
    (status) => {
      expect(
        isUnclaimedSend(transfer("send", status), [
          proofOf("op-1", "handedOut"),
        ]),
      ).toBe(true);
      expect(
        isUnclaimedSend(transfer("send", status), [
          proofOf("op-1", "externalized"),
        ]),
      ).toBe(true);
    },
  );

  it("leaves a delivery in flight alone", () => {
    expect(
      isUnclaimedSend(transfer("send", "pending"), [
        proofOf("op-1", "handedOut"),
      ]),
    ).toBe(false);
  });

  it("is not a claimed or returned send, a receive, or another send's proofs", () => {
    expect(
      isUnclaimedSend(transfer("send", "done"), [proofOf("op-1", "spent")]),
    ).toBe(false);
    expect(isUnclaimedSend(transfer("send", "done"), [])).toBe(false);
    expect(
      isUnclaimedSend(transfer("send", "returned"), [
        proofOf("op-1", "handedOut"),
      ]),
    ).toBe(false);
    expect(
      isUnclaimedSend(transfer("receive", "done"), [
        proofOf("op-1", "handedOut"),
      ]),
    ).toBe(false);
    expect(
      isUnclaimedSend(transfer("send", "issued"), [
        proofOf("op-2", "handedOut"),
      ]),
    ).toBe(false);
  });
});
