import { Button, Row, Stack } from "@linky-fit/ui";
import type { FC } from "react";
import { useAppShellActions } from "../app/context/AppShellContexts";
import { AmountDisplay } from "../components/AmountDisplay";

import { Keypad } from "../components/Keypad";
import { useAmountInputKeypad } from "../components/useAmountInputKeypad";
import { navigateTo } from "../hooks/useRouting";
import type { Translate } from "../i18n";

interface TopupPageProps {
  currentNpub: string | null;
  displayUnit: string;
  setTopupAmount: (value: string | ((prev: string) => string)) => void;
  t: Translate;
  topupAmount: string;
  topupInvoiceIsBusy: boolean;
}

export const TopupPage: FC<TopupPageProps> = ({
  currentNpub,
  displayUnit,
  setTopupAmount,
  t,
  topupAmount,
  topupInvoiceIsBusy,
}) => {
  const { pasteScanValue } = useAppShellActions();

  const amountSat = Number.parseInt(topupAmount.trim(), 10);
  const invalid =
    !currentNpub ||
    !Number.isFinite(amountSat) ||
    amountSat <= 0 ||
    topupInvoiceIsBusy;
  const amountInput = useAmountInputKeypad({
    amount: topupAmount,
    onAmountChange: (nextAmount) => setTopupAmount(nextAmount),
  });
  const pasteAmountOrScanValue = async () => {
    if (await amountInput.pasteFromClipboard()) return;
    await pasteScanValue();
  };

  return (
    <Stack gap="$md">
      <AmountDisplay
        amount={topupAmount}
        cycleOnClick
        inputDisplayValue={amountInput.inputDisplayValue}
      />

      <Keypad
        ariaLabel={`${t("payAmount")} (${displayUnit})`}
        decimalKeyEnabled={amountInput.decimalKeyEnabled}
        disabled={topupInvoiceIsBusy}
        onKeyPress={(key: string) => {
          if (topupInvoiceIsBusy) return;
          amountInput.onKeyPress(key);
        }}
        translations={{
          clearForm: t("clearForm"),
          decimalPoint: t("decimalPoint"),
          delete: t("delete"),
        }}
      />

      <Button
        onPress={() => {
          if (invalid) return;
          navigateTo({ route: "topupInvoice" });
        }}
        disabled={invalid}
        data-guide="topup-show-invoice"
      >
        {t("topupShowInvoice")}
      </Button>

      <Row>
        <Button
          variant="secondary"
          icon="CircleEllipsis"
          flex={1}
          onPress={() => navigateTo({ route: "topupNoAmount" })}
        >
          {t("topupNoAmount")}
        </Button>
        <Button
          variant="secondary"
          icon="Copy"
          flex={1}
          onPress={() => void pasteAmountOrScanValue()}
        >
          {t("paste")}
        </Button>
      </Row>
    </Stack>
  );
};
