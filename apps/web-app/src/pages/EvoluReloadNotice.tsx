import { Text, Stack, Button } from "@linky-fit/ui";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useEvoluSettingsContext } from "../app/context/SystemSettingsContexts";
import { reportAppLog } from "../devtools/inspector/appLog";

export function EvoluReloadNotice(): React.ReactElement | null {
  const { evoluErrorType, evoluServersReloadRequired } =
    useEvoluSettingsContext();
  const { t } = useAppShellCore();
  if (!evoluServersReloadRequired && evoluErrorType !== "ProtocolQuotaError") {
    return null;
  }
  return (
    <>
      <Text color="$colorMuted" variant="label">
        {t(
          evoluServersReloadRequired
            ? "evoluServersReloadHint"
            : "evoluQuotaRecoveryHint",
        )}
      </Text>
      <Stack>
        <Button
          type="button"
          variant="secondary"
          onPress={() => {
            reportAppLog({
              tag: "EvoluSyncRetry",
              summary: "Reloading to retry Evolu synchronization",
              payload: {
                errorType: evoluErrorType,
                settingsChanged: evoluServersReloadRequired,
              },
            });
            window.location.reload();
          }}
        >
          {t(
            evoluServersReloadRequired
              ? "evoluServersReloadButton"
              : "evoluRetrySync",
          )}
        </Button>
      </Stack>
    </>
  );
}
