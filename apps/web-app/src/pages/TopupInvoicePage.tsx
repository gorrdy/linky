import { Button, LoadingState, QRCode, Stack, Text } from "@linky-fit/ui";
import { type FC } from "react";
import { DisplayAmount } from "../components/DisplayAmount";
import type { Translate } from "../i18n";
import { optimizeCaseInsensitiveQrPayload } from "../utils/qrPayload";
import type { ReceiveMethod } from "../utils/receiveMethod";

interface TopupInvoicePageProps {
  copyText: (text: string) => Promise<void>;
  receiveMethod: ReceiveMethod;
  t: Translate;
  topupAmount: string;
  topupInvoice: string | null;
  topupInvoiceCashuRequest: string | null;
  topupInvoiceError: string | null;
  topupInvoiceIsBusy: boolean;
  topupMintUrl: string | null;
  topupInvoiceQrPayload: string | null;
}

export const TopupInvoicePage: FC<TopupInvoicePageProps> = ({
  copyText,
  receiveMethod,
  t,
  topupAmount,
  topupInvoice,
  topupInvoiceCashuRequest,
  topupInvoiceError,
  topupInvoiceIsBusy,
  topupMintUrl,
  topupInvoiceQrPayload,
}) => {
  const amountSat = Number.parseInt(topupAmount.trim(), 10);
  const mintDisplay = (topupMintUrl ?? "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  const universalPayload =
    (topupInvoiceQrPayload ?? topupInvoice ?? "").trim() || null;
  const cashuPayload = (topupInvoiceCashuRequest ?? "").trim() || null;
  const lightningPayload = (topupInvoice ?? "").trim() || null;
  const preferredPayload =
    receiveMethod === "cashu"
      ? cashuPayload
      : receiveMethod === "lightning"
        ? lightningPayload
        : universalPayload;
  const selectedPayload = preferredPayload ?? universalPayload;
  const qrValue =
    selectedPayload !== null && selectedPayload === lightningPayload
      ? optimizeCaseInsensitiveQrPayload(selectedPayload)
      : selectedPayload;

  const handleCopyInvoice = () => {
    const copyValue = (selectedPayload ?? "").trim();
    if (!copyValue) return;
    void copyText(copyValue);
  };

  return (
    <Stack gap="$lg">
      <DisplayAmount
        amount={Number.isFinite(amountSat) && amountSat > 0 ? amountSat : 0}
        accessibilityLabel={t("topupInvoiceTitle")}
        caption={
          mintDisplay
            ? `${t("transactionDetailMint")}: ${mintDisplay}`
            : undefined
        }
      />

      {topupInvoiceIsBusy ? (
        <LoadingState label={t("topupFetchingInvoice")} />
      ) : qrValue ? (
        <Stack gap="$lg">
          <QRCode
            testID="topup-invoice-qr"
            value={qrValue}
            accessibilityLabel={t("copy")}
            onPress={handleCopyInvoice}
          />
          <Button
            variant="secondary"
            icon="Copy"
            testID="topup-invoice-copy"
            onPress={handleCopyInvoice}
          >
            {t("copy")}
          </Button>
        </Stack>
      ) : topupInvoiceError ? (
        <Text color="$colorMuted">{topupInvoiceError}</Text>
      ) : (
        <LoadingState label={t("topupFetchingInvoice")} />
      )}
    </Stack>
  );
};
