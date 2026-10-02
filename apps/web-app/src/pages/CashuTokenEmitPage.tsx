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
  const insufficient = amountSat > cashuBalance;
  const invalid =
    !Number.isFinite(amountSat) ||
    amountSat <= 0 ||
    insufficient ||
    cashuIsBusy;
  const canUseFullAvailableAmount = cashuBalance > 0 && !cashuIsBusy;
  const availableAmountText = `${t("availablePrefix")} ${formatDisplayedAmountText(
    cashuBalance,
  )}`;
  const meltLabel =
    cashuHasMultipleAcceptedMints &&
    insufficient &&
    amountSat <= cashuBalanceAfterMelt &&
    !mintWarningDismissed
      ? cashuMeltToMainMintButtonLabel
      : null;
  const amountInput = useAmountInputKeypad({
    amount: cashuEmitAmount,
    onAmountChange: (nextAmount) => setCashuEmitAmount(nextAmount),
  });

  return (
    <Stack gap="$lg">
      {meltLabel ? (
        <Notice
          tone="accent"
          icon="CircleAlert"
          title={t("cashuMultipleMintsWarningTitle")}
          description={t("cashuMultipleMintsWarningBody")}
          action={{
            label: meltLabel,
            onPress: () => void meltLargestForeignMintToMainMint(),
          }}
          dismiss={{
            label: t("close"),
            onPress: () => setMintWarningDismissed(true),
          }}
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

      {insufficient && !meltLabel ? (
        <Notice tone="accent" icon="CircleAlert" title={t("payInsufficient")} />
      ) : null}

      <Button
        onPress={() => {
          void emitCashuToken();
        }}
        disabled={invalid}
        tooltip={insufficient ? t("payInsufficient") : undefined}
      >
        {t("cashuEmit")}
      </Button>
    </Stack>
  );
};
