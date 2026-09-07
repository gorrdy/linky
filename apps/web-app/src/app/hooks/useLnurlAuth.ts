import React from "react";
import { reportAppLog } from "../../devtools/inspector/appLog";
import type { Translate } from "../../i18n";
import { submitLnurlAuth, type LnurlAuthPreview } from "../../lnurlAuth";
import { getUnknownErrorMessage } from "../../utils/unknown";

interface UseLnurlAuthParams {
  currentNsec: string | null;
  setStatus: React.Dispatch<React.SetStateAction<string | null>>;
  t: Translate;
}

export interface LnurlAuthResult {
  closeLnurlAuthConfirmation: () => void;
  confirmLnurlAuth: () => Promise<void>;
  lnurlAuthIsBusy: boolean;
  pendingLnurlAuthConfirmation: LnurlAuthPreview | null;
  requestLnurlAuthConfirmation: (preview: LnurlAuthPreview) => void;
}

/**
 * LUD-04 signer: a scanned login request waits for the user to approve it, then
 * Linky signs the challenge with the domain's linking key and reports the
 * result. Nothing about the login is stored — the domain owns the session.
 */
export const useLnurlAuth = ({
  currentNsec,
  setStatus,
  t,
}: UseLnurlAuthParams): LnurlAuthResult => {
  const [pendingLnurlAuthConfirmation, setPendingLnurlAuthConfirmation] =
    React.useState<LnurlAuthPreview | null>(null);
  const [lnurlAuthIsBusy, setLnurlAuthIsBusy] = React.useState(false);

  const requestLnurlAuthConfirmation = React.useCallback(
    (preview: LnurlAuthPreview) => {
      reportAppLog({
        tag: "lnurlAuth.requested",
        summary: `LNURL-auth ${preview.action} requested by ${preview.domain}`,
        links: { lnurlAuthChallenge: preview.k1 },
        payload: { action: preview.action, domain: preview.domain },
      });
      setPendingLnurlAuthConfirmation(preview);
    },
    [],
  );

  const closeLnurlAuthConfirmation = React.useCallback(() => {
    if (lnurlAuthIsBusy) return;
    setPendingLnurlAuthConfirmation(null);
  }, [lnurlAuthIsBusy]);

  const confirmLnurlAuth = React.useCallback(async () => {
    const pending = pendingLnurlAuthConfirmation;
    if (!pending || lnurlAuthIsBusy) return;

    if (!currentNsec) {
      setStatus(`${t("errorPrefix")}: ${t("lnurlAuthUnavailable")}`);
      return;
    }

    setLnurlAuthIsBusy(true);
    try {
      setStatus(t("lnurlAuthInProgress"));
      await submitLnurlAuth({ nsec: currentNsec, preview: pending });
      setPendingLnurlAuthConfirmation(null);
      setStatus(t("lnurlAuthSucceeded").replace("{domain}", pending.domain));
      reportAppLog({
        tag: "lnurlAuth.approved",
        summary: `LNURL-auth ${pending.action} accepted by ${pending.domain}`,
        links: { lnurlAuthChallenge: pending.k1 },
        payload: { action: pending.action, domain: pending.domain },
      });
    } catch (error) {
      const message = getUnknownErrorMessage(error, t("lnurlAuthFailed"));
      setStatus(`${t("errorPrefix")}: ${message}`);
      reportAppLog({
        tag: "lnurlAuth.failed",
        summary: `LNURL-auth ${pending.action} failed at ${pending.domain}`,
        links: { lnurlAuthChallenge: pending.k1 },
        payload: {
          action: pending.action,
          domain: pending.domain,
          error: message,
        },
      });
    } finally {
      setLnurlAuthIsBusy(false);
    }
  }, [
    currentNsec,
    lnurlAuthIsBusy,
    pendingLnurlAuthConfirmation,
    setStatus,
    t,
  ]);

  return {
    closeLnurlAuthConfirmation,
    confirmLnurlAuth,
    lnurlAuthIsBusy,
    pendingLnurlAuthConfirmation,
    requestLnurlAuthConfirmation,
  };
};
