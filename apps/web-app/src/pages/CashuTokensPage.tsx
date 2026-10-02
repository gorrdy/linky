import { CashuOperationId } from "@linky-fit/linksync";
import type {
  StoredProof,
  TokenTransfer,
  RestoreProgress,
} from "@linky-fit/linkshu";
import {
  Button,
  DataTable,
  EmptyState,
  Icon,
  Pressable,
  Progress,
  Row,
  Spinner,
  Stack,
  Text,
  border,
  space,
} from "@linky-fit/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import {
  pendingTokenTransfers,
  tokenChatMessages,
} from "../app/lib/pendingTokenTransfers";
import { getMintDisplay } from "../app/lib/tokenMessageInfo";
import type { LocalNostrMessage } from "../app/types/appTypes";
import {
  CashuTokenHandoff,
  type CashuTokenHandoffProps,
} from "../components/CashuTokenHandoff";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { navigateTo } from "../hooks/useRouting";
import { nowSeconds } from "../utils/time";

interface CashuTokensPageProps {
  cashuIsBusy: boolean;
  canRestoreTokens: boolean;
  tokensRestoreIsBusy: boolean;
  tokensRestoreProgress: RestoreProgress | null;
  restoreMissingTokens: () => Promise<void>;
  cashuBulkCheckIsBusy: boolean;
  cashuProofs: readonly StoredProof[];
  cashuTransfers: readonly TokenTransfer[];
  contacts: CashuTokenHandoffProps["contacts"];
  messages: readonly LocalNostrMessage[];
  checkIssuedCashuTokensAndDeleteClaimed: () => Promise<{
    claimed: ReadonlyArray<{ amount: number; id: string }>;
  }>;
}

export const CashuTokensPage = ({
  cashuIsBusy,
  canRestoreTokens,
  tokensRestoreIsBusy,
  tokensRestoreProgress,
  restoreMissingTokens,
  cashuBulkCheckIsBusy,
  cashuProofs,
  cashuTransfers,
  contacts,
  messages,
  checkIssuedCashuTokensAndDeleteClaimed,
}: CashuTokensPageProps) => {
  const { formatDisplayedAmountText, t } = useAppShellCore();
  const scanProgress =
    tokensRestoreProgress?.phase === "scanning" &&
    tokensRestoreProgress.totalKeysets > 0
      ? tokensRestoreProgress
      : null;

  const [now, setNow] = useState(nowSeconds);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(nowSeconds()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const transfers = useMemo(
    () => pendingTokenTransfers(cashuTransfers, cashuProofs),
    [cashuTransfers, cashuProofs],
  );
  const chatsByToken = useMemo(() => tokenChatMessages(messages), [messages]);
  const hasHandedOut = cashuProofs.some(
    (proof) => proof.state === "handedOut" || proof.state === "externalized",
  );
  const balancesByMint = useMemo(() => {
    const balances = new Map<
      StoredProof["mint"],
      { available: number; pending: number }
    >();
    for (const proof of cashuProofs) {
      if (
        proof.state !== "available" &&
        proof.state !== "handedOut" &&
        proof.state !== "externalized"
      )
        continue;
      const balance = balances.get(proof.mint) ?? { available: 0, pending: 0 };
      if (proof.state === "available") balance.available += proof.amount;
      else balance.pending += proof.amount;
      balances.set(proof.mint, balance);
    }
    return [...balances].sort(([a], [b]) => a.localeCompare(b));
  }, [cashuProofs]);
  const availableBalance = balancesByMint.reduce(
    (total, [, balance]) => total + balance.available,
    0,
  );
  const pendingBalance = balancesByMint.reduce(
    (total, [, balance]) => total + balance.pending,
    0,
  );
  const autoCheckedRef = useRef(false);
  useEffect(() => {
    if (!hasHandedOut || autoCheckedRef.current) return;
    autoCheckedRef.current = true;
    void checkIssuedCashuTokensAndDeleteClaimed();
  }, [hasHandedOut, checkIssuedCashuTokensAndDeleteClaimed]);

  const ageText = (createdAt: number) => {
    const minutes = Math.max(0, Math.floor((now - createdAt) / 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.max(0, Math.floor((now - createdAt) / 86_400));
    if (minutes < 1) return t("cashuJustCreated");
    if (hours < 1)
      return t("cashuPendingMinutes").replace("{minutes}", String(minutes));
    if (days < 1)
      return t("cashuPendingHours").replace("{hours}", String(hours));
    if (days === 1) return t("cashuPendingOneDay");
    return t("cashuPendingDays").replace("{days}", String(days));
  };

  const restoreStatusText =
    tokensRestoreProgress?.phase === "refreshing"
      ? t("cashuRestoreRefreshing")
      : tokensRestoreProgress?.phase === "scanning"
        ? t("cashuRestoreScanProgress")
            .replace(
              "{completed}",
              String(tokensRestoreProgress.completedKeysets),
            )
            .replace("{total}", String(tokensRestoreProgress.totalKeysets))
            .replace("{mints}", String(tokensRestoreProgress.totalMints))
        : t("cashuRestorePreparing");

  const balanceColumn = (label: string, amount: number) => (
    <Stack flex={1} gap="$xs">
      <Text variant="label" color="$colorMuted">
        {label}
      </Text>
      <Text variant="heading" testID="cashu-token-balance">
        {formatDisplayedAmountText(amount)}
      </Text>
    </Stack>
  );

  const strong = (text: string) => (
    <Text variant="caption" bold>
      {text}
    </Text>
  );

  return (
    <>
      <Stack gap="$lg" paddingBottom={space.huge * 2}>
        {balancesByMint.length <= 1 ? (
          <Row gap="$lg" alignItems="flex-start">
            {balanceColumn(t("cashuBalance"), availableBalance)}
            {balanceColumn(t("cashuPendingBalance"), pendingBalance)}
          </Row>
        ) : (
          <DataTable
            fill
            accessibilityLabel={t("mintBalance")}
            columns={[
              { key: "mint", label: t("cashuProofsColumnMint") },
              { key: "available", label: t("cashuBalance") },
              { key: "pending", label: t("cashuPendingBalance") },
            ]}
            rows={[
              ...balancesByMint.map(([mint, balance]) => ({
                key: mint,
                cells: [
                  getMintDisplay(mint),
                  formatDisplayedAmountText(balance.available),
                  formatDisplayedAmountText(balance.pending),
                ],
              })),
              {
                key: "total",
                cells: [
                  strong(t("cashuTotalBalance")),
                  strong(formatDisplayedAmountText(availableBalance)),
                  strong(formatDisplayedAmountText(pendingBalance)),
                ],
              },
            ]}
          />
        )}
        <Row justifyContent="space-between" flexWrap="wrap">
          <Button
            variant="secondary"
            onPress={() => navigateTo({ route: "cashuProofs" })}
          >
            {t("cashuInspectProofs")}
          </Button>
          <Button
            disabled={cashuIsBusy}
            onPress={() => navigateTo({ route: "cashuTokenEmit" })}
          >
            {t("cashuEmit")}
          </Button>
        </Row>
        <Stack gap="$none">
          <Row justifyContent="space-between">
            <Text flexShrink={1}>
              {t("cashuPendingTransfers")} · {transfers.length}
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => void checkIssuedCashuTokensAndDeleteClaimed()}
              disabled={!hasHandedOut || cashuIsBusy || cashuBulkCheckIsBusy}
            >
              {t("cashuCheckIssuedTokens")}
            </Button>
          </Row>
          {transfers.length === 0 ? (
            <EmptyState title={t("cashuTransfersEmpty")} />
          ) : (
            <Stack
              role="list"
              aria-label={t("cashuPendingTransfers")}
              gap="$none"
            >
              {transfers.map((transfer) => {
                const chats = (
                  chatsByToken.get(transfer.tokenText) ?? []
                ).filter((message) => message.direction === "out");
                const partiallyClaimed = cashuProofs.some(
                  (proof) =>
                    proof.operationId === transfer.id &&
                    proof.state === "spent",
                );
                const state = t(
                  partiallyClaimed
                    ? "cashuPartiallyClaimed"
                    : transfer.status === "pending"
                      ? "cashuAwaitingDelivery"
                      : "cashuAwaitingClaim",
                );
                return (
                  <Stack
                    key={transfer.id}
                    testID="cashu-transfer-row"
                    role="listitem"
                    gap="$sm"
                    paddingVertical="$xl"
                    borderBottomWidth={border.hairline}
                    borderColor="$borderColor"
                  >
                    <Pressable
                      gap="$md"
                      aria-label={`${t("cashuToken")}: ${formatDisplayedAmountText(transfer.amount)}`}
                      onPress={() => {
                        const id = CashuOperationId.fromUnknown(transfer.id);
                        if (id.ok)
                          navigateTo({ route: "cashuToken", id: id.value });
                      }}
                    >
                      <Text variant="title" flex={1}>
                        {formatDisplayedAmountText(transfer.amount)}
                      </Text>
                      <Text variant="caption" color="$colorMuted">
                        {state}
                      </Text>
                      <Icon name="ChevronRight" size="sm" />
                    </Pressable>
                    <CashuTokenHandoff
                      transfer={transfer}
                      chats={chats}
                      contacts={contacts}
                    />
                    <Row justifyContent="space-between" flexWrap="wrap">
                      <Text variant="caption" color="$colorMuted">
                        {getMintDisplay(transfer.mint)}
                      </Text>
                      <Text variant="caption" color="$colorMuted">
                        {ageText(transfer.createdAt)}
                      </Text>
                    </Row>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Stack>
        <Button
          variant="secondary"
          onPress={() => void restoreMissingTokens()}
          disabled={
            !canRestoreTokens ||
            tokensRestoreIsBusy ||
            cashuIsBusy ||
            cashuBulkCheckIsBusy
          }
        >
          {tokensRestoreIsBusy ? t("restoring") : t("restoreTokens")}
        </Button>
        {tokensRestoreIsBusy && (
          <Stack gap="$sm">
            {scanProgress ? (
              <Progress
                value={scanProgress.completedKeysets}
                max={scanProgress.totalKeysets}
                accessibilityLabel={t("restoring")}
              />
            ) : (
              <Spinner accessibilityLabel={t("restoring")} />
            )}
            <Text color="$colorMuted" role="status">
              {restoreStatusText}
            </Text>
          </Stack>
        )}
        <Text color="$colorMuted">{t("cashuMissingRestoreHint")}</Text>
      </Stack>
      <FloatingActionButton
        icon="CirclePlus"
        label={t("cashuAddToken")}
        onPress={() => navigateTo({ route: "cashuTokenNew" })}
      />
    </>
  );
};
