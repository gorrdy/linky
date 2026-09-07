import React from "react";
import type { I18nKey, Translate } from "../i18n";
import type { LnurlAuthAction, LnurlAuthPreview } from "../lnurlAuth";

const TITLE_KEY_BY_ACTION: Record<LnurlAuthAction, I18nKey> = {
  auth: "lnurlAuthTitleAuth",
  link: "lnurlAuthTitleLink",
  login: "lnurlAuthTitleLogin",
  register: "lnurlAuthTitleRegister",
};

interface LnurlAuthConfirmModalProps {
  confirmation: LnurlAuthPreview;
  isBusy: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  t: Translate;
}

export function LnurlAuthConfirmModal({
  confirmation,
  isBusy,
  onClose,
  onConfirm,
  t,
}: LnurlAuthConfirmModalProps): React.ReactElement {
  const title = t(TITLE_KEY_BY_ACTION[confirmation.action]).replace(
    "{domain}",
    confirmation.domain,
  );

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <div className="modal-body">{t("lnurlAuthBody")}</div>
        <div className="modal-actions">
          <button
            className="btn-wide"
            disabled={isBusy}
            onClick={() => void onConfirm()}
          >
            {t("lnurlAuthConfirm")}
          </button>
          <button
            className="btn-wide secondary"
            disabled={isBusy}
            onClick={onClose}
          >
            {t("payCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
