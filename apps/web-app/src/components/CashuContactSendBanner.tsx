import React from "react";
import type { Translate } from "../i18n";
import { TopBanner } from "./TopBanner";

interface CashuContactSendBannerProps {
  amountText: string | null;
  onCancel: () => void;
  t: Translate;
}

export const CashuContactSendBanner: React.FC<CashuContactSendBannerProps> = ({
  amountText,
  onCancel,
  t,
}) => {
  if (!amountText) return null;

  return (
    <TopBanner
      title={t("cashuContactSendPendingBanner").replace("{amount}", amountText)}
      icon="Send"
      action={{ label: t("cancel"), onPress: onCancel }}
    />
  );
};
