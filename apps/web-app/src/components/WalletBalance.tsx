import { Amount, Pressable, Stack } from "@linky-fit/ui";
import React from "react";
import {
  useAppShellActions,
  useAppShellCore,
} from "../app/context/AppShellContexts";
import { tooltip } from "../utils/tooltip";

interface WalletBalanceProps {
  ariaLabel: string;
  balance: number;
  size?: "md" | "lg";
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
  ariaLabel,
  balance,
  size = "md",
}) => {
  const { allowedDisplayCurrencies, formatDisplayedAmountParts, t } =
    useAppShellCore();
  const { cycleDisplayCurrency } = useAppShellActions();
  const displayAmount = formatDisplayedAmountParts(balance);
  const amount = (
    <Amount
      value={`${displayAmount.approxPrefix}${displayAmount.amountText}`}
      unit={displayAmount.unitLabel}
      size={size}
    />
  );

  if (allowedDisplayCurrencies.length <= 1) {
    return (
      <Stack alignSelf="center" aria-label={ariaLabel}>
        {amount}
      </Stack>
    );
  }

  return (
    <Pressable
      alignSelf="center"
      aria-label={ariaLabel}
      {...tooltip(t("unitCycleAction"))}
      onPress={cycleDisplayCurrency}
    >
      {amount}
    </Pressable>
  );
};
