import { Button, CodeBlock, QRCode, Stack, Text } from "@linky-fit/ui";
import React from "react";
import {
  useAppShellActions,
  useAppShellCore,
} from "../app/context/AppShellContexts";

export function TopupNoAmountPage(): React.ReactElement {
  const { copyText } = useAppShellActions();
  const { effectiveMyLightningAddress, t } = useAppShellCore();
  const target = (effectiveMyLightningAddress ?? "").trim();

  return (
    <Stack gap="$lg">
      <Text variant="title" textAlign="center">
        {t("topupNoAmountTitle")}
      </Text>

      {target ? (
        <Stack gap="$lg">
          <QRCode
            value={target}
            accessibilityLabel={t("copy")}
            badge="Copy"
            onPress={() => void copyText(target)}
          />
          <CodeBlock>{target}</CodeBlock>
          <Button
            variant="secondary"
            icon="Copy"
            testID="topup-invoice-copy"
            onPress={() => void copyText(target)}
          >
            {t("copy")}
          </Button>
        </Stack>
      ) : (
        <Text color="$colorMuted">{t("topupNoAmountMissingAddress")}</Text>
      )}
    </Stack>
  );
}
