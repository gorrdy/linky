import { reportInspectorRows } from "../../devtools/inspector/reportInspectorRows";
import { getInspectorEmissionEnabled } from "../../devtools/inspector/inspectorEnabled";

/**
 * App-only fact linkshu cannot see: a `pending` send was closed because its
 * token verifiably reached the recipient (published chat message, POSTed
 * payment request). Without this row the transfer's trail would end on the
 * pending insert.
 */
export const reportCashuSendForgotten = (args: {
  mint: string;
  reason: "message-published" | "payment-request-posted";
  operationId: string;
}): void => {
  if (!getInspectorEmissionEnabled()) return;
  reportInspectorRows([
    {
      at: Date.now(),
      channel: "cashu",
      tag: "send.forgotten",
      summary: `pending send closed — ${args.reason}`,
      links: { operation: args.operationId },
      context: { mint: args.mint },
      payload: args,
    },
  ]);
};

/**
 * One "return unclaimed tokens" pass from the Tokens page: how many sends
 * qualified and how each ended. The operation links lead to the
 * `tokens.returnToWallet` rows linkshu emitted for the tokens it took back.
 */
export const reportCashuUnclaimedReturned = (args: {
  candidates: number;
  returned: number;
  claimed: number;
  failed: number;
  interrupted: boolean;
  returnedOperationIds: ReadonlyArray<string>;
}): void => {
  if (!getInspectorEmissionEnabled()) return;
  const { returnedOperationIds, ...tally } = args;
  reportInspectorRows([
    {
      at: Date.now(),
      channel: "cashu",
      tag: "send.returnUnclaimed",
      summary: `${tally.returned}/${tally.candidates} unclaimed sends returned${tally.interrupted ? " — interrupted" : ""}`,
      links: { operation: [...returnedOperationIds] },
      context: {},
      payload: tally,
    },
  ]);
};
