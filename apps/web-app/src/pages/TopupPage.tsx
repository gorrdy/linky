import { Button, Row, Stack } from "@linky-fit/ui";
import type { FC } from "react";
import { useAppShellActions } from "../app/context/AppShellContexts";
import { AmountKeypad } from "../components/AmountKeypad";
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
      <AmountKeypad
        amount={topupAmount}
        input={amountInput}
        disabled={topupInvoiceIsBusy}
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
          icon="ClipboardPaste"
          flex={1}
          onPress={() => void pasteAmountOrScanValue()}
        >
          {t("paste")}
        </Button>
      </Row>
    </Stack>
  );
};
