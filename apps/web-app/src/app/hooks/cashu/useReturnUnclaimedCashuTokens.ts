import type { StoredProof, TokenTransfer } from "@linky/linkshu";
import { Either } from "effect";
import React from "react";
import type { Translate } from "../../../i18n";
import { reportCashuUnclaimedReturned } from "../../lib/cashuSendInspector";
import { isUnclaimedSend } from "../../lib/cashuTransfers";
import type { CashuTransferLifecycle } from "../composition/useLinkshuComposition";

interface UseReturnUnclaimedCashuTokensParams {
  cashuIsBusy: boolean;
  cashuProofs: ReadonlyArray<StoredProof>;
  cashuTransfers: ReadonlyArray<TokenTransfer>;
  pushToast: (message: string) => void;
  /** Null until the linkshu runtime is composed (seed + owners resolved). */
  returnCashuTransfer: CashuTransferLifecycle["returnToWallet"] | null;
  setCashuIsBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setStatus: React.Dispatch<React.SetStateAction<string | null>>;
  t: Translate;
}

export interface ReturnUnclaimedTally {
  returned: number;
  claimed: number;
  failed: number;
}

const fillTally = (text: string, tally: ReturnUnclaimedTally): string =>
  text
    .replace("{returned}", String(tally.returned))
    .replace("{claimed}", String(tally.claimed))
    .replace("{failed}", String(tally.failed));

/**
 * One pass of `Tokens.returnToWallet` over every unclaimed send
 * (`isUnclaimedSend`): each token is re-received, so the copy its recipient
 * holds dies at the mint. A token the recipient claimed meanwhile answers
 * `TokenAlreadySpent` and linkshu closes it as claimed; the pass stops at the
 * first unreachable mint or counter lock timeout because the rest would fail
 * the same way.
 */
export const useReturnUnclaimedCashuTokens = ({
  cashuIsBusy,
  cashuProofs,
  cashuTransfers,
  pushToast,
  returnCashuTransfer,
  setCashuIsBusy,
  setStatus,
  t,
}: UseReturnUnclaimedCashuTokensParams) => {
  const unclaimedCashuTokens = React.useMemo(
    () =>
      cashuTransfers.filter((transfer) =>
        isUnclaimedSend(transfer, cashuProofs),
      ),
    [cashuProofs, cashuTransfers],
  );

  const returnUnclaimedCashuTokens = React.useCallback(async () => {
    if (returnCashuTransfer === null) {
      pushToast(t("errorPrefix"));
      return;
    }
    if (cashuIsBusy || unclaimedCashuTokens.length === 0) return;
    setCashuIsBusy(true);
    setStatus(t("cashuReturningUnclaimed"));
    const tally: ReturnUnclaimedTally = { returned: 0, claimed: 0, failed: 0 };
    const returnedOperationIds: string[] = [];
    let interrupted = false;
    try {
      for (const transfer of unclaimedCashuTokens) {
        const outcome = await returnCashuTransfer(transfer.id);
        if (Either.isRight(outcome)) {
          tally.returned += 1;
          returnedOperationIds.push(transfer.id);
          continue;
        }
        const tag = outcome.left._tag;
        if (tag === "TokenAlreadySpent") {
          tally.claimed += 1;
          continue;
        }
        if (tag === "MintUnreachable" || tag === "CounterLockTimeout") {
          interrupted = true;
          break;
        }
        tally.failed += 1;
      }
    } finally {
      setCashuIsBusy(false);
    }
    reportCashuUnclaimedReturned({
      candidates: unclaimedCashuTokens.length,
      interrupted,
      returnedOperationIds,
      ...tally,
    });
    setStatus(null);
    pushToast(
      fillTally(
        t(
          interrupted
            ? "cashuReturnUnclaimedInterrupted"
            : "cashuReturnUnclaimedDone",
        ),
        tally,
      ),
    );
  }, [
    cashuIsBusy,
    pushToast,
    returnCashuTransfer,
    setCashuIsBusy,
    setStatus,
    t,
    unclaimedCashuTokens,
  ]);

  return {
    returnUnclaimedCashuTokens,
    unclaimedCashuTokenCount: unclaimedCashuTokens.length,
  };
};
