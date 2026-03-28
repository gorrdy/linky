import React from "react";

interface WalletWarningProps {
  dismissed: boolean;
  onDismiss: () => void;
  t: (key: string) => string;
}

export function WalletWarning({
  dismissed,
  onDismiss,
  t,
}: WalletWarningProps): React.ReactElement {
  return (
    <div
      className={dismissed ? "wallet-warning is-hidden" : "wallet-warning"}
      role={dismissed ? undefined : "alert"}
      aria-hidden={dismissed}
    >
      <button
        type="button"
        className="wallet-warning-close"
        onClick={onDismiss}
        aria-label={t("close")}
        title={t("close")}
      >
        ×
      </button>
      <div className="wallet-warning-icon" aria-hidden="true">
        ⚠
      </div>
      <div className="wallet-warning-text">
        <div className="wallet-warning-title">
          {t("walletEarlyWarningTitle")}
        </div>
        <div className="wallet-warning-body">{t("walletEarlyWarningBody")}</div>
      </div>
    </div>
  );
}
