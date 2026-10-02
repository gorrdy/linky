import { Stack, ListRow } from "@linky-fit/ui";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useAdvancedSettingsContext } from "../app/context/SystemSettingsContexts";
import {
  RECEIVE_METHOD_LABEL_KEYS,
  RECEIVE_METHODS,
} from "../utils/receiveMethod";

export function ReceiveMethodPage(): React.ReactElement {
  const { t } = useAppShellCore();
  const { receiveMethod, setReceiveMethod } = useAdvancedSettingsContext();

  return (
    <Stack>
      {RECEIVE_METHODS.map((method) => (
        <ListRow
          key={method}
          title={t(RECEIVE_METHOD_LABEL_KEYS[method])}
          selected={receiveMethod === method}
          onPress={() => setReceiveMethod(method)}
          chevron={false}
        />
      ))}
    </Stack>
  );
}
