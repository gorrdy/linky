import {
  Button,
  ListRow,
  Notice,
  Stack,
  StatusDot,
  Switch,
  Text,
} from "@linky-fit/ui";
import { evoluSyncStatus } from "../utils/connectionStatus";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useEvoluSettingsContext } from "../app/context/SystemSettingsContexts";
import { deriveEvoluServerState } from "../app/lib/evoluServerState";
import { navigateTo } from "../hooks/useRouting";
import { EvoluReloadNotice } from "./EvoluReloadNotice";
import { EvoluSyncErrorNotice } from "./EvoluSyncErrorNotice";
export function EvoluServerPage(): React.ReactElement {
  const {
    evoluHasError,
    evoluServerStatusByUrl,
    evoluServerUrls,
    isEvoluServerOffline,
    isEvoluServerRecommended,
    pendingEvoluServerDeleteUrl,
    saveEvoluServerUrls,
    setEvoluServerOffline,
    setPendingEvoluServerDeleteUrl,
    setStatus,
    syncOwnerId,
  } = useEvoluSettingsContext();
  const { route, t } = useAppShellCore();
  const url = route.kind === "evoluServer" ? route.id : null;
  if (!url) return <Notice tone="danger" title={t("errorPrefix")} />;

  const offline = isEvoluServerOffline(url);
  const status =
    evoluSyncStatus[
      deriveEvoluServerState({
        evoluHasError,
        isOffline: offline,
        state: evoluServerStatusByUrl[url],
        syncOwnerId,
      })
    ];
  const deleteArmed = pendingEvoluServerDeleteUrl === url;
  const requestRemove = () => {
    if (!deleteArmed) {
      setStatus(t("deleteArmedHint"));
      setPendingEvoluServerDeleteUrl(url);
      return;
    }
    setPendingEvoluServerDeleteUrl(null);
    setEvoluServerOffline(url, false);
    saveEvoluServerUrls(
      evoluServerUrls.filter((u) => u.toLowerCase() !== url.toLowerCase()),
    );
    navigateTo({ route: "evoluServers" });
  };
  return (
    <Stack gap="$lg">
      <EvoluSyncErrorNotice />
      <EvoluReloadNotice />

      <ListRow
        title={url}
        trailing={
          <StatusDot
            tone={status.tone}
            accessibilityLabel={t(status.labelKey)}
          />
        }
      />

      <ListRow
        title={t("evoluSyncLabel")}
        value={t(status.labelKey)}
        testID="evoluSyncLabel"
      />

      <ListRow
        title={t("evoluServerOfflineLabel")}
        trailing={
          <Switch
            accessibilityLabel={t("evoluServerOfflineLabel")}
            value={offline}
            onValueChange={(value) => setEvoluServerOffline(url, value)}
          />
        }
        testID="evoluServerOfflineLabel"
      />

      {isEvoluServerRecommended(url) ? (
        <Text variant="label" color="$colorMuted">
          {t("relayRecommendedNote")}
        </Text>
      ) : (
        <Button
          onPress={requestRemove}
          variant={deleteArmed ? "danger" : "secondary"}
        >
          {t("evoluServerRemove")}
        </Button>
      )}
    </Stack>
  );
}
