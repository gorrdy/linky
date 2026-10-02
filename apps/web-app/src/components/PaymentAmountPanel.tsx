import { Button, Stack } from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";
import type { FC, ReactNode } from "react";
import type { Translate } from "../i18n";
import { AmountKeypad } from "./AmountKeypad";
import { useAmountInputKeypad } from "./useAmountInputKeypad";

interface PaymentAmountPanelProps {
  amount: string;
  cashuIsBusy: boolean;
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
  const amountInput = useAmountInputKeypad({ amount, onAmountChange });

  return (
    <Stack gap="$md">
      {header}
      {notices}

      <Stack gap="$md" data-guide={stepGuideId}>
        <AmountKeypad
          amount={amount}
          input={amountInput}
          disabled={cashuIsBusy}
        />

        <Button
          icon={submitIcon ?? "HandCoins"}
          loading={isSubmitBusy}
          onPress={onSubmit}
          disabled={cashuIsBusy || submitDisabled}
          data-guide={sendGuideId}
          tooltip={submitTitle}
        >
          {isSubmitBusy ? t("payPaying") : (submitLabel ?? t("paySend"))}
        </Button>
      </Stack>
    </Stack>
  );
};
