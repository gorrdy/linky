import { Button, CodeBlock, EmptyState, QRCode, Stack } from "@linky-fit/ui";
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
        <EmptyState title={t("topupNoAmountMissingAddress")} />
      )}
    </Stack>
  );
}
