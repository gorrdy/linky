import React from "react";
import { applyPwaUpdate, subscribePwaNeedRefresh } from "../utils/pwaUpdate";
import type { Translate } from "../i18n";
import { TopBanner } from "./TopBanner";

interface PwaUpdateBannerProps {
  t: Translate;
}

export const PwaUpdateBanner: React.FC<PwaUpdateBannerProps> = ({ t }) => {
  const [needRefresh, setNeedRefresh] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    return subscribePwaNeedRefresh((value) => {
      setNeedRefresh(value);
    });
  }, []);

  if (!needRefresh) return null;

  const onPress = () => {
    if (applying) return;
    setApplying(true);
    void applyPwaUpdate();
  };

  return (
    <TopBanner
      title={t("pwaUpdateAvailable")}
      icon="RefreshCcw"
      action={{ label: t("pwaUpdateButton"), onPress }}
    />
  );
};
