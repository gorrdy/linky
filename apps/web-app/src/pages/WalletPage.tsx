import { Button, Row, Stack } from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";
import React from "react";
import { useAppShellActions } from "../app/context/AppShellContexts";
import { BottomTabBar } from "../components/BottomTabBar";
import { WalletBalance } from "../components/WalletBalance";
import { WalletPendingReceives } from "../components/WalletPendingReceives";
import { WalletWarning } from "../components/WalletWarning";
import { navigateTo } from "../hooks/useRouting";
import type { Translate } from "../i18n";

interface WalletPageProps {
  bottomTabActive: "wallet" | "contacts" | null;
  cashuTotalBalance: number;
  dismissWalletWarning: () => void;
  openScan: () => void;
  scanIsOpen: boolean;
  showWalletWarning: boolean;
  showBottomTabBar?: boolean;
  t: Translate;
}

interface WalletActionProps {
  dataGuide?: string;
  disabled?: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
}

const WalletAction = ({
  dataGuide,
  disabled = false,
  icon,
  label,
  onPress,
}: WalletActionProps) => (
  <Button
    variant="secondary"
    icon={icon}
    flexDirection="column"
    width="$column"
    paddingVertical="$xl"
    disabled={disabled}
    onPress={onPress}
    data-guide={dataGuide}
  >
    {label}
  </Button>
);

export const WalletPage: React.FC<WalletPageProps> = React.memo(
  ({
    bottomTabActive,
    cashuTotalBalance,
    dismissWalletWarning,
    openScan,
    scanIsOpen,
    showWalletWarning,
    showBottomTabBar = true,
    t,
  }) => {
    const { openFeedbackContact } = useAppShellActions();
    return (
      <Stack gap="$lg">
        <WalletWarning
          dismissed={!showWalletWarning}
          onContactSupport={openFeedbackContact}
          onDismiss={dismissWalletWarning}
          t={t}
        />
        <Stack
          alignItems="center"
          gap="$xxl"
          paddingTop="$xxl"
          paddingBottom="$xxxl"
        >
          <Stack alignItems="center" gap="$xs">
            <WalletBalance
              balance={cashuTotalBalance}
              ariaLabel={t("cashuBalance")}
              size="lg"
            />
            <WalletPendingReceives />
          </Stack>
          <Row marginTop="$xxl">
            <WalletAction
              icon="ArrowDownRight"
              label={t("walletReceive")}
              onPress={() => navigateTo({ route: "topup" })}
              dataGuide="wallet-topup"
            />
            <WalletAction
              icon="ArrowUpRight"
              label={t("walletSend")}
              onPress={openScan}
              disabled={scanIsOpen}
            />
          </Row>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => navigateTo({ route: "transactions" })}
          >
            {t("showTransactions")}
          </Button>
        </Stack>
        {showBottomTabBar ? (
          <BottomTabBar
            activeTab={bottomTabActive}
            contactsLabel={t("contactsTitle")}
            t={t}
            walletLabel={t("wallet")}
          />
        ) : null}
      </Stack>
    );
  },
);
