import { Button, Dialog, Icon, Stack, Text, border } from "@linky-fit/ui";
import React from "react";

import type { Translate } from "../i18n";

interface NfcWriteModalProps {
  kind: "profile" | "token";
  onCancel: () => void;
  t: Translate;
}

function NfcWriteIllustration(): React.ReactElement {
  return (
    <Stack
      aria-hidden
      width="$qr"
      height="$qr"
      alignSelf="center"
      alignItems="center"
      justifyContent="center"
      borderRadius="$pill"
      borderWidth={border.focus}
      borderColor="$info"
      backgroundColor="$infoSoft"
    >
      <Stack
        width="$controlLg"
        height="$hero"
        padding="$sm"
        borderRadius="$card"
        backgroundColor="$background"
      >
        <Stack flex={1} borderRadius="$sm" backgroundColor="$infoSoft" />
      </Stack>
      <Stack position="absolute">
        <Icon name="Radio" size="xl" color="$info" />
      </Stack>
    </Stack>
  );
}

export function NfcWriteModal({
  kind,
  onCancel,
  t,
}: NfcWriteModalProps): React.ReactElement {
  const detailKey =
    kind === "profile" ? "nfcWriteReadyProfileBody" : "nfcWriteReadyTokenBody";
  const actionKey =
    kind === "profile" ? "nfcWriteProfileLabel" : "nfcWriteTokenLabel";

  return (
    <Dialog
      open
      onOpenChange={onCancel}
      title={t("nfcWriteReadyTitle")}
      hideTitle
      closeLabel={t("close")}
      actions={
        <Button variant="ghost" onPress={onCancel}>
          {t("payCancel")}
        </Button>
      }
    >
      <Stack alignItems="center" gap="$sm">
        <Text variant="display" textAlign="center">
          {t("nfcWriteReadyTitle")}
        </Text>
        <Text variant="title" fontWeight="$regular" textAlign="center">
          {t("nfcWriteReadySubtitle")}
        </Text>
      </Stack>
      <Stack paddingVertical="$xxl">
        <NfcWriteIllustration />
      </Stack>
      <Stack alignItems="center" gap="$sm" paddingBottom="$lg">
        <Text eyebrow color="$infoText" textAlign="center">
          {t(actionKey)}
        </Text>
        <Text
          variant="label"
          fontWeight="$regular"
          color="$colorMuted"
          textAlign="center"
        >
          {t(detailKey)}
        </Text>
      </Stack>
    </Dialog>
  );
}
