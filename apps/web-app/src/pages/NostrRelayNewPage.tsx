import { Form, SubmitButton, TextField } from "@linky-fit/ui";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useRelaySettingsContext } from "../app/context/SystemSettingsContexts";

export function NostrRelayNewPage(): React.ReactElement {
  const { canSaveNewRelay, newRelayUrl, saveNewRelay, setNewRelayUrl } =
    useRelaySettingsContext();
  const { t } = useAppShellCore();
  return (
    <Form onSubmit={saveNewRelay}>
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
      <SubmitButton disabled={!canSaveNewRelay}>
        {t("saveChanges")}
      </SubmitButton>
    </Form>
  );
}
