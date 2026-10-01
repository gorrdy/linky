import { Stack, Row, Button, TextField } from "@linky-fit/ui";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import {
  useAdvancedSettingsContext,
  useEvoluSettingsContext,
} from "../app/context/SystemSettingsContexts";
import { normalizeEvoluServerUrl } from "../evolu";
import { navigateTo } from "../hooks/useRouting";

export function EvoluServerNewPage(): React.ReactElement {
  const {
    evoluServerUrls,
    newEvoluServerUrl,
    saveEvoluServerUrls,
    setNewEvoluServerUrl,
    setStatus,
  } = useEvoluSettingsContext();
  const { t } = useAppShellCore();
  const { pushToast } = useAdvancedSettingsContext();

  return (
    <Stack
      marginTop="$lg"
      paddingVertical="$xxl"
      $wide={{ marginTop: "$none" }}
    >
      <TextField
        label={t("evoluAddServerLabel")}
        id="evoluServerUrl"
        value={newEvoluServerUrl}
        onChangeText={setNewEvoluServerUrl}
        placeholder="wss://..."
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />

      <Row justifyContent="flex-end">
        <Button
          type="button"
          onPress={() => {
            const normalized = normalizeEvoluServerUrl(newEvoluServerUrl);
            if (!normalized) {
              pushToast(t("evoluAddServerInvalid"));
              return;
            }
            if (
              evoluServerUrls.some(
                (u) => u.toLowerCase() === normalized.toLowerCase(),
              )
            ) {
              pushToast(t("evoluAddServerAlready"));
              navigateTo({ route: "evoluServers" });
              return;
            }

            saveEvoluServerUrls([...evoluServerUrls, normalized]);
            setNewEvoluServerUrl("");
            setStatus(t("evoluAddServerSaved"));
            navigateTo({ route: "evoluServers" });
          }}
          disabled={!normalizeEvoluServerUrl(newEvoluServerUrl)}
        >
          {t("evoluAddServerButton")}
        </Button>
      </Row>
    </Stack>
  );
}
