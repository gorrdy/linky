import { Button, Notice, Pressable, Stack, Text } from "@linky-fit/ui";
import { useState, type Dispatch, type FC, type SetStateAction } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { AmountKeypad } from "../components/AmountKeypad";
import { useAmountInputKeypad } from "../components/useAmountInputKeypad";

interface CashuTokenEmitPageProps {
  cashuBalance: number;
  cashuBalanceAfterMelt: number;
  cashuEmitAmount: string;
  cashuIsBusy: boolean;
  cashuMeltToMainMintButtonLabel: string | null;
  cashuHasMultipleAcceptedMints: boolean;
  displayUnit: string;
  emitCashuToken: () => Promise<void>;
  meltLargestForeignMintToMainMint: () => Promise<void>;
  setCashuEmitAmount: Dispatch<SetStateAction<string>>;
}

export const CashuTokenEmitPage: FC<CashuTokenEmitPageProps> = ({
  cashuBalance,
  cashuBalanceAfterMelt,
  cashuEmitAmount,
  cashuIsBusy,
  cashuHasMultipleAcceptedMints,
  cashuMeltToMainMintButtonLabel,
  emitCashuToken,
  meltLargestForeignMintToMainMint,
  setCashuEmitAmount,
}) => {
  const { formatDisplayedAmountText, t } = useAppShellCore();
  const [mintWarningDismissed, setMintWarningDismissed] = useState(false);
  const amountSat = Number.parseInt(cashuEmitAmount.trim(), 10);
  const invalid =
    !Number.isFinite(amountSat) ||
    amountSat <= 0 ||
    amountSat > cashuBalance ||
    cashuIsBusy;
  const canUseFullAvailableAmount = cashuBalance > 0 && !cashuIsBusy;
  const availableAmountText = `${t("availablePrefix")} ${formatDisplayedAmountText(
    cashuBalance,
  )}`;
  const showMintWarning =
    cashuHasMultipleAcceptedMints &&
    Boolean(cashuMeltToMainMintButtonLabel) &&
    Number.isFinite(amountSat) &&
    amountSat > cashuBalance &&
    amountSat <= cashuBalanceAfterMelt &&
    !mintWarningDismissed;
  const amountInput = useAmountInputKeypad({
    amount: cashuEmitAmount,
    onAmountChange: (nextAmount) => setCashuEmitAmount(nextAmount),
  });

  return (
    <Stack gap="$lg">
      {showMintWarning ? (
        <Notice
          tone="warning"
          title={t("cashuMultipleMintsWarningTitle")}
          dismiss={{
            label: t("close"),
            onPress: () => setMintWarningDismissed(true),
          }}
          description={
            <Stack gap="$sm">
              <Text variant="caption" color="$colorSubtle">
                {t("cashuMultipleMintsWarningBody")}
              </Text>
              <Button
                variant="secondary"
                onPress={() => void meltLargestForeignMintToMainMint()}
                disabled={cashuIsBusy}
              >
                {cashuMeltToMainMintButtonLabel}
              </Button>
            </Stack>
          }
        />
      ) : null}

      <Stack gap="$xxs">
        <Text variant="title">{t("cashuEmit")}</Text>
        <Pressable
          alignSelf="flex-start"
          disabled={!canUseFullAvailableAmount}
          onPress={() => {
            if (!canUseFullAvailableAmount) return;
            setCashuEmitAmount(String(cashuBalance));
          }}
        >
          <Text color="$colorMuted">{availableAmountText}</Text>
        </Pressable>
      </Stack>

      <AmountKeypad
        amount={cashuEmitAmount}
        input={amountInput}
        disabled={cashuIsBusy}
      />

      <Button
        onPress={() => {
          void emitCashuToken();
        }}
        disabled={invalid}
        tooltip={amountSat > cashuBalance ? t("payInsufficient") : undefined}
      >
        {t("cashuEmit")}
      </Button>
    </Stack>
  );
};
