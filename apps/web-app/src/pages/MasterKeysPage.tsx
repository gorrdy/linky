import { Stack, Row, Text, Button } from "@linky-fit/ui";
import React, { useCallback, useMemo, useState } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useAdvancedSettingsContext } from "../app/context/SystemSettingsContexts";

export function MasterKeysPage(): React.ReactElement {
  const { copySeed, pushToast, saveSeedToPasswordManager, seedMnemonic } =
    useAdvancedSettingsContext();
  const { t } = useAppShellCore();
  const [isVisible, setIsVisible] = useState(false);
  const seedWords = useMemo(
    () =>
      (seedMnemonic ?? "")
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0),
    [seedMnemonic],
  );
  const hasSeedMnemonic = seedWords.length > 0;

  const handleSaveSeed = useCallback(async () => {
    if (!hasSeedMnemonic) {
      pushToast(t("seedMissing"));
      return;
    }

    const result = await saveSeedToPasswordManager();
    if (result === "failed") {
      pushToast(t("onboardingBackupSaveFailed"));
      return;
    }

    if (result === "unsupported") {
      pushToast(t("onboardingBackupSaveUnavailable"));
      return;
    }

    if (result === "saved") {
      pushToast(t("onboardingBackupSaveRequested"));
    }
  }, [hasSeedMnemonic, pushToast, saveSeedToPasswordManager, t]);

  return (
    <Stack gap="$lg">
      <Row flexWrap="wrap" gap="$sm" aria-live="polite">
        {hasSeedMnemonic ? (
          seedWords.map((word, index) => (
            <Row
              key={index}
              width="$hero"
              minWidth="$hero"
              flexGrow={1}
              paddingHorizontal="$md"
              paddingVertical="$sm"
              borderRadius="$control"
              backgroundColor="$neutralSoft"
              gap="$sm"
            >
              <Text variant="caption" color="$colorMuted">
                {index + 1}
              </Text>
              <Text
                mono
                variant="label"
                color={isVisible ? "$colorStrong" : "$colorMuted"}
              >
                {isVisible ? word : "****"}
              </Text>
            </Row>
          ))
        ) : (
          <Text color="$colorMuted">{t("seedMissing")}</Text>
        )}
      </Row>
      <Row gap="$sm" flexWrap="wrap">
        <Button
          width="48%"
          minWidth="$column"
          paddingHorizontal="$xs"
          $wide={{ width: "30%", flexGrow: 1 }}
          variant="secondary"
          icon={isVisible ? "EyeOff" : "Eye"}
          onPress={() => setIsVisible((current) => !current)}
          disabled={!hasSeedMnemonic}
        >
          {isVisible ? t("masterKeysHide") : t("masterKeysShow")}
        </Button>
        <Button
          width="48%"
          minWidth="$column"
          paddingHorizontal="$xs"
          $wide={{ width: "30%", flexGrow: 1 }}
          icon="Copy"
          onPress={copySeed}
          disabled={!hasSeedMnemonic}
          data-guide="copy-seed"
        >
          {t("copy")}
        </Button>
        <Button
          width="48%"
          minWidth="$column"
          paddingHorizontal="$xs"
          $wide={{ width: "30%", flexGrow: 1 }}
          variant="secondary"
          icon="ShieldCheck"
          onPress={() => void handleSaveSeed()}
          disabled={!hasSeedMnemonic}
        >
          {t("onboardingBackupSave")}
        </Button>
      </Row>
    </Stack>
  );
}
