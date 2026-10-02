import { Amount, Pressable, Stack } from "@linky-fit/ui";
import React from "react";
import {
  useAppShellActions,
  useAppShellCore,
} from "../app/context/AppShellContexts";

interface AmountDisplayProps {
  amount: string;
  cycleOnClick?: boolean;
  inputDisplayValue?: string | null;
}

const frame = {
  testID: "amount-display",
  "aria-live": "polite",
  justifyContent: "center",
  padding: "$lg",
  borderRadius: "$card",
  backgroundColor: "$surface",
} as const;

export function AmountDisplay({
  amount,
  cycleOnClick = false,
  inputDisplayValue = null,
}: AmountDisplayProps): React.ReactElement {
  const { allowedDisplayCurrencies, formatDisplayedAmountParts, lang, t } =
    useAppShellCore();
  const { cycleDisplayCurrency } = useAppShellActions();
  const amountSat = Number.parseInt(amount.trim(), 10);
  const display = Number.isFinite(amountSat) && amountSat > 0 ? amountSat : 0;
  const displayAmount = formatDisplayedAmountParts(display);
  const displayedInputValue =
    inputDisplayValue === null
      ? null
      : lang === "en"
        ? inputDisplayValue
        : inputDisplayValue.replace(".", ",");
  const amountText = displayedInputValue ?? displayAmount.amountText;
  const approxPrefix =
    displayedInputValue === null ||
    Number(displayedInputValue.replace(",", ".")) > 0
      ? displayAmount.approxPrefix
      : "";
  const value = (
    <Amount
      value={`${approxPrefix}${amountText}`}
      unit={displayAmount.unitLabel}
    />
  );

  if (!cycleOnClick || allowedDisplayCurrencies.length <= 1) {
    return <Stack {...frame}>{value}</Stack>;
  }

  return (
    <Pressable
      {...frame}
      tooltip={t("unitCycleAction")}
      onPress={cycleDisplayCurrency}
    >
      {value}
    </Pressable>
  );
}
