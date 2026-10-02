import { Notice } from "@linky-fit/ui";
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
    <Notice
      tone="accent"
      title={t(
        evoluServersReloadRequired
          ? "evoluServersReloadHint"
          : "evoluQuotaRecoveryHint",
      )}
      action={{
        label: t(
          evoluServersReloadRequired
            ? "evoluServersReloadButton"
            : "evoluRetrySync",
        ),
        onPress: () => {
          reportAppLog({
            tag: "EvoluSyncRetry",
            summary: "Reloading to retry Evolu synchronization",
            payload: {
              errorType: evoluErrorType,
              settingsChanged: evoluServersReloadRequired,
            },
          });
          window.location.reload();
        },
      }}
    />
  );
}
