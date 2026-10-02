import {
  CashuTokenHandoff,
  type CashuTokenHandoffProps,
} from "../components/CashuTokenHandoff";
import { tokenChatMessages } from "../app/lib/pendingTokenTransfers";
import type { LocalNostrMessage } from "../app/types/appTypes";
import { useLatest } from "../hooks/useLatest";
import type { StoredProof, TokenTransfer } from "@linky-fit/linkshu";
import { Button, Stack, Text } from "@linky-fit/ui";
import type { FC } from "react";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { CashuTokenQr } from "../components/CashuTokenQr";
import { formatStoredCashuError } from "../app/lib/cashuStoredError";
import { canReturnTransfer } from "../app/lib/cashuTransfers";

import { getMintDisplay } from "../app/lib/tokenMessageInfo";
import { WalletBalance } from "../components/WalletBalance";
import { CashuTokenProofStatus } from "../components/CashuTokenProofStatus";
import type { InspectCashuProofStates } from "../app/hooks/composition/useLinkshuComposition";
import type { CashuOperationId } from "../evolu";
import { navigateTo } from "../hooks/useRouting";
import type { I18nKey } from "../i18n";
import { buildCashuShareUrl } from "../utils/deepLinks";

interface CashuTokenPageProps {
  contacts: CashuTokenHandoffProps["contacts"];
  messages: readonly LocalNostrMessage[];
  reclaimCashuTransfer: (id: CashuOperationId) => Promise<void>;
  inspectCashuProofStates: InspectCashuProofStates | null;
  canSendToContact: boolean;
  canWriteToNfc: boolean;
  cashuIsBusy: boolean;
  cashuProofs: readonly StoredProof[];
  cashuTransfers: readonly TokenTransfer[];
  checkAndRefreshCashuToken: (
    id: CashuOperationId,
  ) => Promise<"ok" | "invalid" | "transient" | "skipped">;
  checkSingleIssuedCashuTokenIsClaimed: (
    id: CashuOperationId,
  ) => Promise<boolean>;
  copyText: (text: string) => Promise<void>;
  pendingCashuDeleteId: CashuOperationId | null;
  requestDeleteCashuToken: (id: CashuOperationId) => void;
  returnCashuTokenToWallet: (id: CashuOperationId) => Promise<void>;
  routeId: CashuOperationId;
  shareTokenText: (id: CashuOperationId, text: string) => Promise<void>;
  showPaidOverlay: (title?: string) => void;
  startSendCashuTokenToContact: (id: CashuOperationId) => Promise<void>;
  writeToNfc: (id: CashuOperationId, tokenText: string) => Promise<void>;
}

/** What the status line says for a transfer that is not in an error. */
const statusKeyOf = (transfer: TokenTransfer): I18nKey | null => {
  if (transfer.kind === "send") {
    switch (transfer.status) {
      case "issued":
        return "cashuTransferIssued";
      case "pending":
        return "cashuPendingHint";
      case "externalized":
        return "cashuOnNfc";
      case "returned":
        return "cashuTransferReturned";
      case "done":
        return "cashuTransferClaimed";
      default:
        return null;
    }
  }
  switch (transfer.status) {
    case "pending":
      return "cashuReceivePending";
    case "done":
      return "cashuTransferReceived";
    default:
      return null;
  }
};

export const CashuTokenPage: FC<CashuTokenPageProps> = ({
  contacts,
  messages,
  reclaimCashuTransfer,
  inspectCashuProofStates,
  canSendToContact,
  canWriteToNfc,
  cashuIsBusy,
  cashuProofs,
  cashuTransfers,
  checkAndRefreshCashuToken,
  checkSingleIssuedCashuTokenIsClaimed,
  copyText,
  pendingCashuDeleteId,
  requestDeleteCashuToken,
  returnCashuTokenToWallet,
  routeId,
  shareTokenText,
  showPaidOverlay,
  startSendCashuTokenToContact,
  writeToNfc,
}) => {
  const { formatDisplayedAmountText, lang, t } = useAppShellCore();

  const transfer = cashuTransfers.find(
    (candidate) => String(candidate.id) === routeId,
  );
  const tokenText = transfer?.tokenText ?? "";
  const chatsByToken = React.useMemo(
    () => tokenChatMessages(messages),
    [messages],
  );
  const chats = (chatsByToken.get(tokenText) ?? []).filter(
    (message) =>
      message.direction === (transfer?.kind === "send" ? "out" : "in"),
  );
  const tokenAmount = transfer?.amount ?? 0;
  const mintDisplay = getMintDisplay(transfer?.mint);
  const transferProofs = React.useMemo(
    () =>
      cashuProofs.filter(
        (proof) =>
          proof.operationId !== null && String(proof.operationId) === routeId,
      ),
    [cashuProofs, routeId],
  );

  const isSend = transfer?.kind === "send";
  const isIssued = isSend && transfer.status === "issued";
  const isOpenSend =
    transfer !== undefined && isSend && canReturnTransfer(transfer);
  const isFailedReceive =
    transfer?.kind === "receive" && transfer.status === "failed";
  const allProofsSpent =
    transferProofs.length > 0 &&
    transferProofs.reduce((amount, proof) => amount + proof.amount, 0) ===
      tokenAmount &&
    transferProofs.every((proof) => proof.state === "spent");
  const hasOutstandingProofs = transferProofs.some(
    (proof) => proof.state === "handedOut" || proof.state === "externalized",
  );
  const reclaimFromInventory =
    isSend &&
    transfer.status !== "returned" &&
    hasOutstandingProofs &&
    (chats.length > 0 || transfer.status === "done");
  const canReturnToWallet =
    transfer !== undefined &&
    !allProofsSpent &&
    (canReturnTransfer(transfer) || reclaimFromInventory);
  const statusKey =
    isSend && transfer?.status === "done" && hasOutstandingProofs
      ? "cashuAwaitingClaim"
      : transfer === undefined
        ? null
        : statusKeyOf(transfer);
  const shareUrl = buildCashuShareUrl(tokenText);
  const shareMessage = (() => {
    if (!shareUrl) return "";
    if (tokenAmount > 0) {
      return t("cashuShareMessageWithAmount")
        .replace("{amount}", formatDisplayedAmountText(tokenAmount))
        .replace("{url}", shareUrl);
    }
    return t("cashuShareMessage").replace("{url}", shareUrl);
  })();

  // Poll the source mint while the user is staring at the QR of an issued
  // token (issue #86): checkProofsStates is the passive NUT-07 query, so it
  // doesn't consume the proofs. Once all proofs flip to SPENT the transfer
  // closes as claimed and we navigate back to the tokens list.
  //
  // The helper's identity changes whenever the read model updates, so the
  // latest reference is stashed in a ref to keep the 10s interval from being
  // torn down + restarted on every churn.
  const checkSingleIssuedRef = useLatest(checkSingleIssuedCashuTokenIsClaimed);

  React.useEffect(() => {
    if (!isIssued) return;

    let cancelled = false;
    let inFlight = false;
    const tick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const claimed = await checkSingleIssuedRef.current(routeId);
        if (claimed && !cancelled) {
          showPaidOverlay(t("cashuTokenClaimed"));
          navigateTo({ route: "cashuTokens" });
        }
      } finally {
        inFlight = false;
      }
    };
    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isIssued, routeId, showPaidOverlay, t, checkSingleIssuedRef]);

  // The transfer list hydrates asynchronously from Evolu and is briefly empty
  // on first mount, so a missing transfer only shows the recovery panel after
  // a delay, and a transfer that vanished after loading once bounces back.
  const transferMissing = transfer === undefined;
  const loadedRouteIdRef = React.useRef<CashuOperationId | null>(null);
  const [showMissingRecovery, setShowMissingRecovery] = React.useState(false);
  if (!transferMissing) loadedRouteIdRef.current = routeId;
  React.useEffect(() => {
    setShowMissingRecovery(false);
    if (!transferMissing || loadedRouteIdRef.current === routeId) return;

    const timeoutId = window.setTimeout(() => {
      setShowMissingRecovery(true);
    }, 750);
    return () => window.clearTimeout(timeoutId);
  }, [routeId, transferMissing]);

  React.useEffect(() => {
    if (!transferMissing) return;
    if (loadedRouteIdRef.current !== routeId) return;
    navigateTo({ route: "cashuTokens" });
  }, [routeId, transferMissing]);

  if (transfer === undefined) {
    if (!showMissingRecovery) return null;

    return (
      <Stack gap="$lg">
        <Text variant="caption" color="$dangerText" textAlign="center">
          {t("cashuInvalid")}
        </Text>
      </Stack>
    );
  }

  const isClosed = transfer.status === "done" || transfer.status === "returned";
  const statusLine = (text: string | null, error = false) => (
    <Text
      variant="caption"
      color={error ? "$dangerText" : "$colorMuted"}
      textAlign="center"
    >
      {text}
    </Text>
  );

  return (
    <Stack gap="$lg">
      <Stack alignItems="center" gap="$xs">
        <WalletBalance ariaLabel={t("cashuToken")} balance={tokenAmount} />
        {mintDisplay ? (
          <Text variant="caption" color="$colorMuted">
            Mint:{" "}
            <Text variant="caption" mono color="$colorSubtle">
              {mintDisplay}
            </Text>
          </Text>
        ) : null}
      </Stack>

      <Stack gap="$sm">
        <CashuTokenHandoff
          transfer={transfer}
          chats={chats}
          contacts={contacts}
        />

        <Text color="$colorMuted">
          {`${t("cashuCreated")} ${new Date(transfer.createdAt * 1000).toLocaleString(lang)}`}
        </Text>

        {isFailedReceive
          ? statusLine(
              formatStoredCashuError(transfer.error) ?? t("cashuReceiveFailed"),
              true,
            )
          : statusKey !== null
            ? statusLine(t(statusKey))
            : null}
        {!isFailedReceive && transfer.error !== null
          ? statusLine(formatStoredCashuError(transfer.error), true)
          : null}
      </Stack>

      {isSend && transferProofs.length > 0 ? (
        <CashuTokenProofStatus
          proofs={transferProofs}
          inspect={inspectCashuProofStates}
          busy={cashuIsBusy}
        />
      ) : null}

      <CashuTokenQr key={routeId} tokenText={tokenText} copyText={copyText} />

      {isOpenSend || isFailedReceive ? (
        <Button
          onPress={() => void checkAndRefreshCashuToken(routeId)}
          disabled={cashuIsBusy}
        >
          {t("cashuCheckToken")}
        </Button>
      ) : null}

      {isIssued && canSendToContact ? (
        <Button
          onPress={() => void startSendCashuTokenToContact(routeId)}
          disabled={!tokenText.trim()}
        >
          {t("cashuSendToContact")}
        </Button>
      ) : null}

      <Button
        variant="secondary"
        onPress={() => void copyText(tokenText)}
        disabled={!tokenText.trim()}
      >
        {t("copy")}
      </Button>

      {isOpenSend ? (
        <Button
          variant="secondary"
          onPress={() => void shareTokenText(routeId, shareMessage)}
          disabled={!shareMessage}
        >
          {t("share")}
        </Button>
      ) : null}

      {isOpenSend && canWriteToNfc ? (
        <Button
          variant="secondary"
          icon="Radio"
          onPress={() => void writeToNfc(routeId, tokenText)}
          disabled={!tokenText.trim()}
        >
          {t("uploadToNfc")}
        </Button>
      ) : null}

      {canReturnToWallet ? (
        <Button
          variant="secondary"
          onPress={() =>
            void (reclaimFromInventory
              ? reclaimCashuTransfer(routeId)
              : returnCashuTokenToWallet(routeId))
          }
          disabled={cashuIsBusy}
        >
          {t("cashuReturnToWallet")}
        </Button>
      ) : null}

      {!isClosed && allProofsSpent ? (
        <Button
          variant={pendingCashuDeleteId === routeId ? "danger" : "secondary"}
          onPress={() => requestDeleteCashuToken(routeId)}
        >
          {t("delete")}
        </Button>
      ) : null}
    </Stack>
  );
};
