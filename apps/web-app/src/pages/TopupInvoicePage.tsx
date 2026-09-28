import { Copy } from "lucide-react";
import React, { type FC } from "react";
import { WalletBalance } from "../components/WalletBalance";
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
  topupInvoiceQr: string | null;
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
  topupInvoiceQr,
  topupInvoiceQrPayload,
}) => {
  const [selectedQr, setSelectedQr] = React.useState<string | null>(
    topupInvoiceQr,
  );
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

  React.useEffect(() => {
    if (!selectedPayload) {
      setSelectedQr(null);
      return;
    }

    if (selectedPayload === universalPayload && topupInvoiceQr) {
      setSelectedQr(topupInvoiceQr);
      return;
    }

    let cancelled = false;
    setSelectedQr(null);

    void (async () => {
      const QRCode = await import("qrcode");
      const qrPayload =
        selectedPayload === lightningPayload
          ? optimizeCaseInsensitiveQrPayload(selectedPayload)
          : selectedPayload;
      const qr = await QRCode.toDataURL(qrPayload, {
        margin: 1,
        width: 320,
      });
      if (!cancelled) setSelectedQr(qr);
    })();

    return () => {
      cancelled = true;
    };
  }, [lightningPayload, selectedPayload, topupInvoiceQr, universalPayload]);

  const handleCopyInvoice = () => {
    const copyValue = (selectedPayload ?? "").trim();
    if (!copyValue) return;
    void copyText(copyValue);
  };

  const copyButton = (
    <button
      type="button"
      className="btn-wide secondary topup-invoice-copy"
      onClick={handleCopyInvoice}
    >
      <span className="btn-label-with-icon">
        <span className="btn-label-icon" aria-hidden="true">
          <Copy size={16} />
        </span>
        <span>{t("copy")}</span>
      </span>
    </button>
  );

  const loadingMessage = (
    <p className="muted topup-invoice-loading">{t("topupFetchingInvoice")}</p>
  );

  return (
    <section className="panel topup-invoice-panel">
      <div className="topup-invoice-head">
        <div className="topup-invoice-balance">
          <WalletBalance
            ariaLabel={t("topupInvoiceTitle")}
            balance={
              Number.isFinite(amountSat) && amountSat > 0 ? amountSat : 0
            }
          />
        </div>

        {mintDisplay ? (
          <p className="topup-invoice-mint-note">
            Mint:{" "}
            <span className="relay-url topup-invoice-mint-value">
              {mintDisplay}
            </span>
          </p>
        ) : null}
      </div>

      {topupInvoiceIsBusy ? (
        loadingMessage
      ) : topupInvoiceQr ? (
        <div className="topup-invoice-qr-shell">
          <button
            type="button"
            className="topup-invoice-qr-button"
            onClick={handleCopyInvoice}
            title={t("copy")}
          >
            {selectedQr ? (
              <img className="qr topup-invoice-qr" src={selectedQr} alt="" />
            ) : (
              <span className="muted topup-invoice-loading">
                {t("topupFetchingInvoice")}
              </span>
            )}
          </button>

          {copyButton}
        </div>
      ) : topupInvoiceError ? (
        <p className="muted">{topupInvoiceError}</p>
      ) : topupInvoice ? (
        <div className="topup-invoice-qr-shell">
          <div className="mono-box mono-box-layout">{topupInvoice}</div>
          {copyButton}
        </div>
      ) : (
        loadingMessage
      )}
    </section>
  );
};
