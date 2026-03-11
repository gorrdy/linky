import type { FC } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { AmountDisplay } from "../components/AmountDisplay";
import { Keypad } from "../components/Keypad";
import { formatMiddleDots } from "../utils/formatting";

interface LnAddressPayPageProps {
  canPayWithCashu: boolean;
  cashuBalance: number;
  cashuIsBusy: boolean;
  displayUnit: string;
  lnAddress: string;
  lnAddressPayAmount: string;
  payLightningAddressWithCashu: (
    lnAddress: string,
    amountSat: number,
  ) => Promise<void>;
  setLnAddressPayAmount: (value: string | ((prev: string) => string)) => void;
  t: (key: string) => string;
}

export const LnAddressPayPage: FC<LnAddressPayPageProps> = ({
  canPayWithCashu,
  cashuBalance,
  cashuIsBusy,
  displayUnit,
  lnAddress,
  lnAddressPayAmount,
  payLightningAddressWithCashu,
  setLnAddressPayAmount,
  t,
}) => {
  const { applyAmountInputKey, formatDisplayedAmountText } = useAppShellCore();
  const amountSat = Number.parseInt(lnAddressPayAmount.trim(), 10);
  const invalid =
    !canPayWithCashu ||
    !Number.isFinite(amountSat) ||
    amountSat <= 0 ||
    amountSat > cashuBalance;

  return (
    <section className="panel">
      <div className="contact-header">
        <div className="contact-avatar is-large" aria-hidden="true">
          <span className="contact-avatar-fallback">⚡</span>
        </div>
        <div className="contact-header-text">
          <h3>{t("payTo")}</h3>
          <p className="muted">{formatMiddleDots(lnAddress, 36)}</p>
          <p className="muted">
            {t("availablePrefix")} {formatDisplayedAmountText(cashuBalance)}
          </p>
        </div>
      </div>

      {!canPayWithCashu && <p className="muted">{t("payInsufficient")}</p>}

      <AmountDisplay amount={lnAddressPayAmount} />

      <Keypad
        ariaLabel={`${t("payAmount")} (${displayUnit})`}
        disabled={cashuIsBusy}
        onKeyPress={(key: string) => {
          if (cashuIsBusy) return;
          setLnAddressPayAmount((v) => applyAmountInputKey(v, key));
        }}
        translations={{
          clearForm: t("clearForm"),
          delete: t("delete"),
        }}
      />

      <div className="actions">
        <button
          className="btn-wide"
          onClick={() => {
            if (invalid) return;
            void payLightningAddressWithCashu(lnAddress, amountSat);
          }}
          disabled={cashuIsBusy || invalid}
          title={amountSat > cashuBalance ? t("payInsufficient") : undefined}
        >
          <span className="btn-label-with-icon">
            <span className="btn-label-icon" aria-hidden="true">
              ₿
            </span>
            <span>{t("paySend")}</span>
          </span>
        </button>
      </div>
    </section>
  );
};
