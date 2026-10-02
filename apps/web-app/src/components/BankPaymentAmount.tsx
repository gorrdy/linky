import { Pressable, Text } from "@linky-fit/ui";
import React from "react";
import {
  useAppShellActions,
  useAppShellCore,
} from "../app/context/AppShellContexts";

interface BankPaymentAmountProps {
  canCycle?: boolean;
  text: string;
}

// The bank payment amount; tapping it switches the display unit like the
// wallet balance does. `canCycle: false` keeps a static amount (no sat value
// to convert) as plain text.
export const BankPaymentAmount: React.FC<BankPaymentAmountProps> = ({
  canCycle = true,
  text,
}) => {
  const { allowedDisplayCurrencies, t } = useAppShellCore();
  const { cycleDisplayCurrency } = useAppShellActions();
  const amount = (
    <Text testID="bank-payment-amount" variant="display" color="$colorStrong">
      {text}
    </Text>
  );

  if (!canCycle || allowedDisplayCurrencies.length <= 1) {
    return amount;
  }

  return (
    <Pressable
      testID="bank-payment-amount-button"
      alignSelf="flex-start"
      tooltip={t("unitCycleAction")}
      onPress={cycleDisplayCurrency}
    >
      {amount}
    </Pressable>
  );
};
