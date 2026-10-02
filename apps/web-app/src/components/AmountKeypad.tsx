import { Card, Keypad } from "@linky-fit/ui";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { DisplayAmount } from "./DisplayAmount";
import type { AmountInput } from "./useAmountInputKeypad";

interface AmountKeypadProps {
  /** Sat, as `useAmountInputKeypad` keeps it. */
  amount: string;
  input: AmountInput;
  disabled?: boolean | undefined;
}

/** The typed amount above the keypad that edits it. */
export function AmountKeypad({ amount, input, disabled }: AmountKeypadProps) {
  const { displayUnit, t } = useAppShellCore();
  const amountSat = Number.parseInt(amount.trim(), 10);
  return (
    <>
      <Card testID="amount-display" aria-live="polite">
        <DisplayAmount
          amount={Number.isFinite(amountSat) && amountSat > 0 ? amountSat : 0}
          typedValue={input.inputDisplayValue}
          size="lg"
        />
      </Card>
      <Keypad
        accessibilityLabel={`${t("payAmount")} (${displayUnit})`}
        decimal={input.decimalKeyEnabled}
        disabled={disabled}
        onKeyPress={input.onKeyPress}
        labels={{
          clear: t("clearForm"),
          decimal: t("decimalPoint"),
          delete: t("delete"),
        }}
      />
    </>
  );
}
