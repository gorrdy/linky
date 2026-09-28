import { Banknote, Euro, PencilLine, ScanLine } from "lucide-react";
import React from "react";
import {
  useAppShellActions,
  useAppShellCore,
} from "../app/context/AppShellContexts";
import { useAdvancedSettingsContext } from "../app/context/SystemSettingsContexts";
import { usePushNotificationsSetting } from "../app/hooks/usePushNotificationsSetting";
import { SettingsToggleRow } from "../components/SettingsRows";
import { navigateTo } from "../hooks/useRouting";
import type { I18nKey } from "../i18n";
import {
  PROFILE_STATUS_CURRENCIES,
  type ProfileStatusCurrency,
} from "../nostrStatus";

const CURRENCY_LABEL_KEYS: Record<ProfileStatusCurrency, I18nKey> = {
  CZK: "proxyPaymentsProvideCzk",
  EUR: "proxyPaymentsProvideEur",
};

const CURRENCY_ICONS: Record<ProfileStatusCurrency, React.ReactNode> = {
  CZK: <Banknote size={18} />,
  EUR: <Euro size={18} />,
};

export function ProxyPaymentsPage(): React.ReactElement {
  const {
    currentNsec,
    profileStatusIsSaving,
    selectedProfileStatusCurrencies,
    t,
  } = useAppShellCore();
  const { openWalletScan, toggleProfileStatusCurrency } = useAppShellActions();
  const { pushToast } = useAdvancedSettingsContext();
  const notifications = usePushNotificationsSetting();
  // The currency whose switch waits for the user to confirm enabling
  // notifications first.
  const [pendingCurrency, setPendingCurrency] =
    React.useState<ProfileStatusCurrency | null>(null);

  const setCurrencyEnabled = (
    currency: ProfileStatusCurrency,
    enabled: boolean,
  ) => {
    if (enabled === selectedProfileStatusCurrencies.includes(currency)) return;
    // Friends ask for a payment through a push notification, so offering to
    // pay without notifications would only produce missed offers.
    if (enabled && !notifications.enabled) {
      setPendingCurrency(currency);
      return;
    }
    void toggleProfileStatusCurrency(currency);
  };

  const confirmNotifications = async () => {
    const currency = pendingCurrency;
    setPendingCurrency(null);
    if (!currency) return;
    const notificationsEnabled = await notifications.setEnabled(true);
    if (!notificationsEnabled) {
      pushToast(t("proxyPaymentsNotificationsRequired"));
      return;
    }
    await toggleProfileStatusCurrency(currency);
  };

  return (
    <section className="panel settings-page">
      <div className="settings-section">
        <h2 className="settings-section-title">
          {t("proxyPaymentsEarnTitle")}
        </h2>
        <p className="muted settings-note">{t("proxyPaymentsEarnIntro")}</p>

        {PROFILE_STATUS_CURRENCIES.map((currency) => (
          <SettingsToggleRow
            key={currency}
            icon={CURRENCY_ICONS[currency]}
            label={t(CURRENCY_LABEL_KEYS[currency])}
            checked={selectedProfileStatusCurrencies.includes(currency)}
            disabled={
              !currentNsec || profileStatusIsSaving || notifications.isBusy
            }
            onChange={(checked) => setCurrencyEnabled(currency, checked)}
          />
        ))}
      </div>

      <div className="settings-section proxy-payments-pay-section">
        <h2 className="settings-section-title">{t("proxyPaymentsPayTitle")}</h2>
        <p className="muted settings-note">{t("proxyPaymentsPayIntro")}</p>

        <div className="actions">
          <button type="button" className="btn-wide" onClick={openWalletScan}>
            <span className="btn-label-with-icon">
              <span className="btn-label-icon" aria-hidden="true">
                <ScanLine size={16} />
              </span>
              <span>{t("proxyPaymentsScanBankQr")}</span>
            </span>
          </button>
          <button
            type="button"
            className="secondary btn-wide"
            onClick={() => navigateTo({ route: "bankPaymentNew" })}
          >
            <span className="btn-label-with-icon">
              <span className="btn-label-icon" aria-hidden="true">
                <PencilLine size={16} />
              </span>
              <span>{t("proxyPaymentsEnterManually")}</span>
            </span>
          </button>
        </div>
      </div>

      {pendingCurrency ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("notifications")}
          onClick={() => setPendingCurrency(null)}
        >
          <div
            className="modal-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-title">{t("notifications")}</div>
            <div className="modal-body">
              {t("proxyPaymentsNotificationsHint")}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-wide"
                onClick={() => void confirmNotifications()}
              >
                {t("enable")}
              </button>
              <button
                type="button"
                className="btn-wide secondary"
                onClick={() => setPendingCurrency(null)}
              >
                {t("payCancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
