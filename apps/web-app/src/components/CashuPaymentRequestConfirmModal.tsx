import { encodeNpub, Pubkey } from "@linky-fit/linkstr";
import { Notice, Stack, Text } from "@linky-fit/ui";
import { Schema } from "effect";
import type { CashuPaymentRequestMessageInfo } from "../app/lib/paymentRequestMessage";
import type { Translate } from "../i18n";
import { formatShortNpub } from "../utils/formatting";
import { PaymentConfirmDialog } from "./PaymentConfirmDialog";

const isPubkey = Schema.is(Pubkey);

interface CashuPaymentRequestConfirmModalProps {
  cashuBalance: number;
  cashuIsBusy: boolean;
  confirmation: CashuPaymentRequestMessageInfo;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  t: Translate;
}

const hostOf = (rawUrl: string): string | null => {
  try {
    return new URL(rawUrl).host || null;
  } catch {
    return null;
  }
};

export function CashuPaymentRequestConfirmModal({
  cashuBalance,
  cashuIsBusy,
  confirmation,
  onClose,
  onConfirm,
  t,
}: CashuPaymentRequestConfirmModalProps) {
  const recipient = (() => {
    const pubkeyHex = (confirmation.transportPubkeyHex ?? "").trim();
    if (pubkeyHex && isPubkey(pubkeyHex)) {
      return formatShortNpub(encodeNpub(pubkeyHex));
    }
    const postUrl = (confirmation.transportPostUrl ?? "").trim();
    if (postUrl) return hostOf(postUrl) ?? postUrl;
    return null;
  })();

  const mintHost = (() => {
    const firstMint = confirmation.mintUrls.find((mintUrl) => mintUrl.trim());
    return firstMint ? (hostOf(firstMint) ?? firstMint) : null;
  })();

  const insecureTransport =
    (confirmation.transportPubkeyHex ?? "").trim() === "" &&
    (confirmation.transportPostUrl ?? "")
      .trim()
      .toLowerCase()
      .startsWith("http://");

  const insufficientBalance = confirmation.amount > cashuBalance;

  const meta = (
    <Stack alignItems="center" gap="$xxs">
      {recipient ? (
        <Text variant="caption" bold color="$colorMuted" textAlign="center">
          {t("paymentRequestConfirmRecipient").replace(
            "{recipient}",
            recipient,
          )}
        </Text>
      ) : null}
      {mintHost ? (
        <Text variant="caption" bold color="$colorMuted" textAlign="center">
          {t("paymentRequestConfirmMint").replace("{mint}", mintHost)}
        </Text>
      ) : null}
      {insecureTransport ? (
        <Notice
          tone="danger"
          title={t("paymentRequestInsecureTransportWarning")}
        />
      ) : null}
    </Stack>
  );

  return (
    <PaymentConfirmDialog
      amountSat={confirmation.amount}
      label={t("paymentRequestConfirmTitle")}
      confirmLabel={t("paySend")}
      cancelLabel={t("payCancel")}
      description={confirmation.description}
      meta={meta}
      isBusy={cashuIsBusy}
      disabled={insufficientBalance}
      {...(insufficientBalance ? { disabledReason: t("payInsufficient") } : {})}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
