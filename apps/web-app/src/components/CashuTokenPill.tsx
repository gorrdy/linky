import type { OperationId, TokenTransfer } from "@linky-fit/linkshu";
import { Avatar, Pill, Text } from "@linky-fit/ui";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import type { MintIcon } from "../utils/mint";

interface TransferPillProps {
  ariaLabel: string;
  getMintIconUrl: (mint: string | null | undefined) => MintIcon;
  onMintIconError: (url: string) => void;
  onOpenTransfer: (id: OperationId) => void;
  transfer: TokenTransfer;
}

/** A token that left or entered the wallet as text; opens its detail page. */
export const TransferPill = React.memo(function TransferPill({
  ariaLabel,
  getMintIconUrl,
  onMintIconError,
  onOpenTransfer,
  transfer,
}: TransferPillProps) {
  const { formatDisplayedAmountText } = useAppShellCore();
  return (
    <CashuTokenPill
      icon={getMintIconUrl(transfer.mint)}
      amountText={formatDisplayedAmountText(transfer.amount)}
      ariaLabel={ariaLabel}
      isError={transfer.kind === "receive" && transfer.status === "failed"}
      isMuted={transfer.status !== "issued"}
      onClick={() => onOpenTransfer(transfer.id)}
      onMintIconError={onMintIconError}
    />
  );
});

interface CashuTokenPillProps {
  amountText: string;
  ariaLabel?: string;
  compact?: boolean;
  /** Short visible note after the amount. */
  hint?: string;
  icon: Pick<MintIcon, "url"> & Partial<Omit<MintIcon, "url">>;
  isError?: boolean;
  isMuted?: boolean;
  onClick?: () => void;
  onMintIconError?: (url: string) => void;
}

export function CashuTokenPill({
  amountText,
  ariaLabel,
  compact = false,
  hint,
  icon,
  isError = false,
  isMuted = false,
  onClick,
  onMintIconError,
}: CashuTokenPillProps) {
  const host = icon.host ?? null;
  return (
    <Pill
      testID="cashu-token-pill"
      label={amountText}
      {...(hint ? { hint } : {})}
      size={compact ? "sm" : "md"}
      tone={isError ? "danger" : isMuted ? "neutral" : "accent"}
      accessibilityLabel={ariaLabel}
      onPress={onClick}
      leading={
        <>
          {icon.url ? (
            <Avatar
              name={host ?? amountText}
              uri={icon.url}
              size="xs"
              onError={onMintIconError}
            />
          ) : null}
          {(icon.failed || !icon.url) && host ? (
            <Text variant="caption" color="$colorMuted">
              {host}
            </Text>
          ) : null}
        </>
      }
    />
  );
}
