import { Button, Stack } from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";
import type { FC, ReactNode } from "react";
import type { Translate } from "../i18n";
import { tooltip } from "../utils/tooltip";
import { AmountDisplay } from "./AmountDisplay";
import { Keypad } from "./Keypad";
import { useAmountInputKeypad } from "./useAmountInputKeypad";

interface PaymentAmountPanelProps {
  amount: string;
  cashuIsBusy: boolean;
  displayUnit: string;
  header: ReactNode;
  notices?: ReactNode | undefined;
  onAmountChange: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  sendGuideId?: string | undefined;
  stepGuideId?: string | undefined;
  submitBusy?: boolean | undefined;
  submitDisabled: boolean;
  submitIcon?: IconName | undefined;
  submitLabel?: string | undefined;
  submitTitle?: string | undefined;
  t: Translate;
}

export const PaymentAmountPanel: FC<PaymentAmountPanelProps> = ({
  amount,
  cashuIsBusy,
  displayUnit,
  header,
  notices,
  onAmountChange,
  onSubmit,
  sendGuideId,
  stepGuideId,
  submitBusy,
  submitDisabled,
  submitIcon,
  submitLabel,
  submitTitle,
  t,
}) => {
  const isSubmitBusy = submitBusy ?? cashuIsBusy;
  const amountInput = useAmountInputKeypad({
    amount,
    onAmountChange: (nextAmount) => onAmountChange(nextAmount),
  });

  return (
    <Stack gap="$md">
      {header}
      {notices}

      <Stack gap="$md" data-guide={stepGuideId}>
        <AmountDisplay
          amount={amount}
          cycleOnClick
          inputDisplayValue={amountInput.inputDisplayValue}
        />

        <Keypad
          ariaLabel={`${t("payAmount")} (${displayUnit})`}
          decimalKeyEnabled={amountInput.decimalKeyEnabled}
          disabled={cashuIsBusy}
          onKeyPress={(key: string) => {
            if (cashuIsBusy) return;
            amountInput.onKeyPress(key);
          }}
          translations={{
            clearForm: t("clearForm"),
            decimalPoint: t("decimalPoint"),
            delete: t("delete"),
          }}
        />

        <Button
          icon={submitIcon ?? "HandCoins"}
          loading={isSubmitBusy}
          onPress={onSubmit}
          disabled={cashuIsBusy || submitDisabled}
          data-guide={sendGuideId}
          {...tooltip(submitTitle)}
        >
          {isSubmitBusy ? t("payPaying") : (submitLabel ?? t("paySend"))}
        </Button>
      </Stack>
    </Stack>
  );
};
