import type { StoredProof, TokenTransfer } from "@linky/linkshu";

/** A transfer the user is still waiting on: something can still happen to it. */
export const isOpenTransfer = (transfer: TokenTransfer): boolean =>
  transfer.kind === "send"
    ? transfer.status === "issued" ||
      transfer.status === "pending" ||
      transfer.status === "externalized"
    : transfer.status === "pending" || transfer.status === "failed";

/** Transfers whose funds can still come back into the wallet. */
export const canReturnTransfer = isOpenTransfer;

/** A sent token shown as a QR or link, waiting for its recipient. */
export const isIssuedTransfer = (transfer: TokenTransfer): boolean =>
  transfer.kind === "send" && transfer.status === "issued";

/**
 * A sent token nobody has claimed: shown as a QR (`issued`), written to NFC
 * (`externalized`), or already closed (`done`, e.g. a delivered chat send or
 * a token deleted before deletes refunded) while its proofs are still out
 * there. A `pending` send is a delivery in flight and stays out.
 */
export const isUnclaimedSend = (
  transfer: TokenTransfer,
  proofs: ReadonlyArray<StoredProof>,
): boolean =>
  transfer.kind === "send" &&
  (transfer.status === "issued" ||
    transfer.status === "externalized" ||
    transfer.status === "done") &&
  proofs.some(
    (proof) =>
      proof.operationId === transfer.id &&
      (proof.state === "handedOut" || proof.state === "externalized"),
  );
