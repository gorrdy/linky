import { Button, Dialog, TextField } from "@linky-fit/ui";
import React from "react";
import type { Translate } from "../i18n";

interface ShareOptionsModalProps {
  onClose: () => void;
  onCopy: () => void;
  onEmail: () => void;
  onSms: () => void;
  onWhatsApp: () => void;
  shareText: string;
  t: Translate;
}

export function ShareOptionsModal({
  onClose,
  onCopy,
  onEmail,
  onSms,
  onWhatsApp,
  shareText,
  t,
}: ShareOptionsModalProps): React.ReactElement {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("shareOptionsTitle")}
      description={t("shareOptionsBody")}
      closeLabel={t("close")}
      actions={
        <>
          <Button onPress={onWhatsApp}>{t("shareViaWhatsApp")}</Button>
          <Button variant="secondary" onPress={onSms}>
            {t("shareViaSms")}
          </Button>
          <Button variant="secondary" onPress={onEmail}>
            {t("shareViaEmail")}
          </Button>
          <Button variant="secondary" onPress={onCopy}>
            {t("copy")}
          </Button>
          <Button variant="secondary" onPress={onClose}>
            {t("close")}
          </Button>
        </>
      }
    >
      <TextField
        multiline
        label={t("shareOptionsPreviewLabel")}
        hideLabel
        readOnly
        value={shareText}
      />
    </Dialog>
  );
}
