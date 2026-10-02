import {
  Avatar,
  EmptyState,
  IconButton,
  Notice,
  Pressable,
  Row,
  Stack,
  Text,
} from "@linky-fit/ui";
import { useEffect, type FC } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { LnurlPayPreviewNotices } from "../components/LnurlPayPreviewNotices";
import { PaymentAmountPanel } from "../components/PaymentAmountPanel";
import type { ContactId } from "../evolu";
import {
  getLnurlPayAmountRangeError,
  useLnurlPayPreview,
} from "../hooks/useLnurlPayPreview";
import { getInitials } from "../utils/formatting";
import { normalizeNpubIdentifier } from "../utils/nostrNpub";

interface Contact {
  id: ContactId;
  name?: string | null;
  lnAddress?: string | null;
  npub?: string | null;
}

interface ContactPayPageProps {
  cashuBalance: number;
  cashuBalanceAfterMelt: number;
  cashuIsBusy: boolean;
  contactPaymentIntent: "pay" | "request";
  contactPayMethod: "lightning" | "cashu" | null;
  displayUnit: string;
  nostrPictureByNpub: Record<string, string | null>;
  payAmount: string;
  paySelectedContact: () => Promise<void>;
  payWithCashuEnabled: boolean;
  requestSelectedContact: () => Promise<void>;
  selectedContact: Contact | null;
  setContactPayMethod: React.Dispatch<
    React.SetStateAction<"lightning" | "cashu" | null>
  >;
  setPayAmount: (value: string | ((prev: string) => string)) => void;
}

export const ContactPayPage: FC<ContactPayPageProps> = ({
  cashuBalance,
  cashuBalanceAfterMelt,
  cashuIsBusy,
  contactPaymentIntent,
  contactPayMethod,
  nostrPictureByNpub,
  payAmount,
  paySelectedContact,
  payWithCashuEnabled,
  requestSelectedContact,
  selectedContact,
  setContactPayMethod,
  setPayAmount,
}) => {
  const { formatDisplayedAmountText, t } = useAppShellCore();

  const ln = (selectedContact?.lnAddress ?? "").trim();
  const npub = normalizeNpubIdentifier(selectedContact?.npub ?? "");
  const url = npub ? nostrPictureByNpub[npub] : null;
  const isRequestFlow = contactPaymentIntent === "request";
  const canUseCashu = payWithCashuEnabled && Boolean(npub);
  const canUseLightning = Boolean(ln);
  const showToggle = !isRequestFlow && canUseCashu && canUseLightning;
  const method = isRequestFlow
    ? "cashu"
    : contactPayMethod === "lightning" || contactPayMethod === "cashu"
      ? contactPayMethod
      : canUseCashu
        ? "cashu"
        : "lightning";

  // Load the LNURL-pay request up front so a fixed amount is prefilled and
  // min/max limits are shown before the user tries to submit.
  const lightningActive = !isRequestFlow && method === "lightning" && ln !== "";
  const lnurlPreview = useLnurlPayPreview(lightningActive ? ln : "");
  const { fixedAmountSat } = lnurlPreview;

  useEffect(() => {
    if (fixedAmountSat === null) return;
    const next = String(fixedAmountSat);
    setPayAmount((current) => (current === next ? current : next));
  }, [fixedAmountSat, setPayAmount]);

  if (!selectedContact) {
    return <EmptyState title={t("contactNotFound")} />;
  }

  const methodIcon = isRequestFlow
    ? "Request"
    : method === "lightning"
      ? "Zap"
      : "Bean";
  const methodLabel = method === "lightning" ? "Lightning" : "Cashu";

  const amountSat = Number.parseInt(payAmount.trim(), 10);
  const validAmount =
    Number.isFinite(amountSat) && amountSat > 0 ? amountSat : 0;
  const canCoverAnything = cashuBalance > 0;
  const availableAmountText = `${t("availablePrefix")} ${formatDisplayedAmountText(
    cashuBalance,
  )}`;
  const lnurlRangeError = lightningActive
    ? getLnurlPayAmountRangeError(lnurlPreview.preview, amountSat, t)
    : null;
  const invalid = isRequestFlow
    ? !npub || !Number.isFinite(amountSat) || amountSat <= 0
    : (method === "lightning" ? !ln : !canUseCashu) ||
      !Number.isFinite(amountSat) ||
      amountSat <= 0 ||
      validAmount > cashuBalanceAfterMelt ||
      (lightningActive &&
        (lnurlPreview.loading ||
          lnurlPreview.error !== null ||
          lnurlRangeError !== null));

  return (
    <PaymentAmountPanel
      amount={payAmount}
      cashuIsBusy={cashuIsBusy}
      header={
        <Row>
          <Avatar
            name={selectedContact.name ?? ""}
            uri={url ?? undefined}
            fallback={getInitials(selectedContact.name ?? "")}
            size="md"
          />
          <Stack flex={1} gap="$xxs">
            {selectedContact.name && (
              <Row gap="$sm">
                <Text variant="title" numberOfLines={1} flexShrink={1}>
                  {selectedContact.name}
                </Text>
                <IconButton
                  icon={methodIcon}
                  accessibilityLabel={methodLabel}
                  size="sm"
                  variant="secondary"
                  disabled={!showToggle}
                  onPress={() =>
                    setContactPayMethod((prev) =>
                      prev === "lightning" ? "cashu" : "lightning",
                    )
                  }
                  tooltip={showToggle ? methodLabel : undefined}
                />
              </Row>
            )}
            {isRequestFlow ? (
              <Text color="$colorMuted">{t("requestPaymentHint")}</Text>
            ) : (
              <Pressable
                alignSelf="flex-start"
                disabled={!canCoverAnything}
                onPress={() => setPayAmount(String(cashuBalance))}
              >
                <Text color="$colorMuted">{availableAmountText}</Text>
              </Pressable>
            )}
          </Stack>
        </Row>
      }
      notices={
        <>
          {!isRequestFlow && method === "cashu" && !payWithCashuEnabled && (
            <Notice tone="danger" title={t("payWithCashuDisabled")} />
          )}

          {method === "cashu" && !npub && (
            <Notice tone="danger" title={t("chatMissingContactNpub")} />
          )}

          {method === "lightning" && !ln && (
            <Notice tone="danger" title={t("payMissingLn")} />
          )}

          {lightningActive && (
            <LnurlPayPreviewNotices
              error={lnurlPreview.error}
              loading={lnurlPreview.loading}
              preview={lnurlPreview.preview}
              t={t}
            />
          )}
        </>
      }
      onAmountChange={setPayAmount}
      onSubmit={() => {
        if (isRequestFlow) {
          void requestSelectedContact();
          return;
        }
        void paySelectedContact();
      }}
      sendGuideId={isRequestFlow ? "request-send" : "pay-send"}
      stepGuideId="pay-step3"
      submitBusy={!isRequestFlow && cashuIsBusy}
      submitDisabled={invalid}
      submitIcon={isRequestFlow ? "Request" : undefined}
      submitLabel={isRequestFlow ? t("requestPaymentSend") : undefined}
      submitBlockedReason={
        !isRequestFlow && validAmount > cashuBalanceAfterMelt
          ? t("payInsufficient")
          : (lnurlRangeError ?? undefined)
      }
      t={t}
    />
  );
};
