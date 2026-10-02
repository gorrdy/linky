import { Stack, Row, Button, TextField } from "@linky-fit/ui";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useRelaySettingsContext } from "../app/context/SystemSettingsContexts";

export function NostrRelayNewPage(): React.ReactElement {
  const { canSaveNewRelay, newRelayUrl, saveNewRelay, setNewRelayUrl } =
    useRelaySettingsContext();
  const { t } = useAppShellCore();
  return (
    <Stack>
      <TextField
        label={t("relayUrl")}
        id="relayUrl"
        value={newRelayUrl}
        onChangeText={setNewRelayUrl}
        placeholder="wss://..."
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />

      <Row justifyContent="flex-end">
        {canSaveNewRelay ? (
          <Button onPress={saveNewRelay}>{t("saveChanges")}</Button>
        ) : null}
      </Row>
    </Stack>
  );
}
