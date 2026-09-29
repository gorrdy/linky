import React from "react";
import type { I18nKey, Translate } from "../i18n";
import type { LnurlAuthAction, LnurlAuthPreview } from "../lnurlAuth";

const DONE_TITLE_KEY_BY_ACTION: Record<LnurlAuthAction, I18nKey> = {
  auth: "lnurlAuthDoneAuth",
  link: "lnurlAuthDoneLink",
  login: "lnurlAuthDoneLogin",
  register: "lnurlAuthDoneRegister",
};

export type LnurlAuthPhase = "confirm" | "busy" | "done";

interface LnurlAuthModalProps {
  confirmation: LnurlAuthPreview;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  phase: LnurlAuthPhase;
  t: Translate;
}

/** A closed padlock; the `is-done` sheet swings its shackle open and draws a check. */
function LockIllustration(): React.ReactElement {
  return (
    <svg
      className="lnurl-auth-lock"
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        className="lnurl-auth-lock-shackle"
        d="M36 44V34a12 12 0 0 1 24 0v10"
      />
      <rect
        className="lnurl-auth-lock-body"
        x="28"
        y="44"
        width="40"
        height="32"
        rx="7"
      />
      <path className="lnurl-auth-lock-check" d="M40 60l6 6 12-12" />
    </svg>
  );
}

/**
 * One sheet for the whole login: it names the domain and asks for consent,
 * shows the request in flight, and then plays the unlock animation once the
 * domain confirmed. Tapping outside does nothing — the user either confirms or
 * cancels.
 */
export function LnurlAuthModal({
  confirmation,
  onClose,
  onConfirm,
  phase,
  t,
}: LnurlAuthModalProps): React.ReactElement {
  const isDone = phase === "done";
  const isBusy = phase === "busy";
  const title = isDone
    ? t(DONE_TITLE_KEY_BY_ACTION[confirmation.action])
    : confirmation.domain;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`modal-sheet lnurl-auth-sheet${isDone ? " is-done" : ""}`}
      >
        <div className="lnurl-auth-badge">
          <LockIllustration />
        </div>
        <div
          className={`modal-title${isDone ? " lnurl-auth-done-title" : ""}`}
          {...(isDone ? { role: "status", "aria-live": "assertive" } : {})}
        >
          {title}
        </div>
        {isDone ? (
          <>
            <div className="lnurl-auth-domain lnurl-auth-done-domain">
              {confirmation.domain}
            </div>
            <div className="lnurl-auth-done-hint">{t("lnurlAuthDoneHint")}</div>
          </>
        ) : (
          <>
            <div className="modal-actions">
              <button
                className="btn-wide"
                disabled={isBusy}
                onClick={() => void onConfirm()}
              >
                {isBusy ? (
                  <span className="btn-label-with-icon">
                    <span className="btn-label-icon" aria-hidden="true">
                      <span className="btn-spinner" />
                    </span>
                    {t("lnurlAuthConfirm")}
                  </span>
                ) : (
                  t("lnurlAuthConfirm")
                )}
              </button>
              <button
                className="btn-wide secondary"
                disabled={isBusy}
                onClick={onClose}
              >
                {t("payCancel")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
