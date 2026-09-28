import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useDesktopSplitView } from "../hooks/useDesktopSplitView";
import { BottomTabBar, type BottomTabKey } from "./BottomTabBar";

interface MobileBottomNavProps {
  activeTab: BottomTabKey;
}

export const MobileBottomNav = ({
  activeTab,
}: MobileBottomNavProps): React.ReactElement | null => {
  const { t } = useAppShellCore();
  const isDesktopSplitView = useDesktopSplitView();
  if (isDesktopSplitView) return null;
  return (
    <BottomTabBar
      activeTab={activeTab}
      contactsLabel={t("contactsTitle")}
      t={t}
      walletLabel={t("wallet")}
    />
  );
};
