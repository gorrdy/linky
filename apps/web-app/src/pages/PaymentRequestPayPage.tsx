import type { FC } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import {
  parseCashuPaymentRequestMessage,
  withPaymentRequestAmount,
  type PayableCashuPaymentRequest,
} from "../app/lib/paymentRequestMessage";
import { Avatar } from "../components/Avatar";
import { PaymentAmountPanel } from "../components/PaymentAmountPanel";
import { formatMiddleDots, getInitials } from "../utils/formatting";

interface PaymentRequestPayKnownContact {
  name?: string | null;
}

interface PaymentRequestPayPageProps {
  canPayWithCashu: boolean;
  cashuBalance: number;
  cashuBalanceAfterMelt: number;
  cashuIsBusy: boolean;
  displayUnit: string;
  encodedRequest: string;
  knownContact: PaymentRequestPayKnownContact | null;
  knownContactPictureUrl: string | null;
  payCashuPaymentRequest: (
    request: PayableCashuPaymentRequest,
  ) => Promise<void>;
  paymentRequestPayAmount: string;
  setPaymentRequestPayAmount: (
    value: string | ((prev: string) => string),
  ) => void;
}

/**
 * Amount entry for a NUT-18 request that leaves the amount to the payer
 * (`a` absent). A request that states its amount never lands here.
 */
export const PaymentRequestPayPage: FC<PaymentRequestPayPageProps> = ({
  canPayWithCashu,
  cashuBalance,
  cashuBalanceAfterMelt,
  cashuIsBusy,
  displayUnit,
  encodedRequest,
  knownContact,
  knownContactPictureUrl,
  payCashuPaymentRequest,
  paymentRequestPayAmount,
  setPaymentRequestPayAmount,
}) => {
  const { formatDisplayedAmountText, t } = useAppShellCore();
  const request = parseCashuPaymentRequestMessage(encodedRequest);

  if (request === null) {
    return (
      <section className="panel">
        <h3>{t("paymentRequestPayTitle")}</h3>
        <p className="muted">{t("paymentRequestPayInvalid")}</p>
      </section>
    );
  }

  const amountSat = Number.parseInt(paymentRequestPayAmount.trim(), 10);
  const target =
    knownContact?.name ??
    request.transportNprofile ??
    request.transportPostUrl ??
    request.requestId ??
    "";
  const canCoverAnything = cashuBalance > 0;
  const availableAmountText = `${t("availablePrefix")} ${formatDisplayedAmountText(
    cashuBalance,
  )}`;
  const invalid =
    !canPayWithCashu ||
    !Number.isFinite(amountSat) ||
    amountSat <= 0 ||
    amountSat > cashuBalanceAfterMelt;

  return (
    <PaymentAmountPanel
      amount={paymentRequestPayAmount}
      cashuIsBusy={cashuIsBusy}
      displayUnit={displayUnit}
      header={
        <div className="contact-header">
          {knownContact ? (
            <div className="contact-avatar is-large" aria-hidden="true">
              <Avatar
                pictureUrl={knownContactPictureUrl}
                fallback={getInitials(knownContact.name ?? "")}
                fallbackClassName="contact-avatar-fallback"
                loading="lazy"
              />
            </div>
          ) : null}
          <div className="contact-header-text">
            {knownContact?.name ? <h3>{knownContact.name}</h3> : null}
            {target ? (
              <p className="muted">{formatMiddleDots(target, 36)}</p>
            ) : null}
            {request.description ? (
              <p className="muted">{request.description}</p>
            ) : null}
            {request.amount === null ? (
              <p className="muted">{t("paymentRequestPayChooseAmount")}</p>
            ) : null}
            <p className="muted">
              <button
                type="button"
                className="copyable available-amount-button muted"
                disabled={!canCoverAnything}
                onClick={() => {
                  if (!canCoverAnything) return;
                  setPaymentRequestPayAmount(String(cashuBalance));
                }}
              >
                {availableAmountText}
              </button>
            </p>
          </div>
        </div>
      }
      onAmountChange={setPaymentRequestPayAmount}
      onSubmit={() => {
        if (invalid) return;
        void payCashuPaymentRequest(
          withPaymentRequestAmount(request, amountSat),
        );
      }}
      submitBusy={cashuIsBusy}
      submitDisabled={invalid}
      submitTitle={
        amountSat > cashuBalanceAfterMelt ? t("payInsufficient") : undefined
      }
      t={t}
    />
  );
};
