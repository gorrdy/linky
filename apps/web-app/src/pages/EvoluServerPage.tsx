import { Button, ListRow, Row, Stack, StatusDot, Text } from "@linky-fit/ui";
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
  const selectedEvoluServerUrl = route.kind === "evoluServer" ? route.id : null;
  return (
    <Stack gap="$lg">
      <EvoluSyncErrorNotice />
      <EvoluReloadNotice />

      {selectedEvoluServerUrl ? (
        <>
          {(() => {
            const offline = isEvoluServerOffline(selectedEvoluServerUrl);
            const status =
              evoluSyncStatus[
                deriveEvoluServerState({
                  evoluHasError,
                  isOffline: offline,
                  state: evoluServerStatusByUrl[selectedEvoluServerUrl],
                  syncOwnerId,
                })
              ];
            return (
              <>
                <ListRow
                  title={
                    <>
                      <Text variant="label">{selectedEvoluServerUrl}</Text>
                    </>
                  }
                  trailing={
                    <>
                      <StatusDot
                        tone={status.tone}
                        accessibilityLabel={t(status.labelKey)}
                      />
                    </>
                  }
                />

                <ListRow
                  title={t("evoluSyncLabel")}
                  trailing={
                    <>
                      <Text variant="label" color="$colorMuted">
                        {t(status.labelKey)}
                      </Text>
                    </>
                  }
                  testID="evoluSyncLabel"
                />

                <ListRow
                  title={t("evoluServerOfflineLabel")}
                  trailing={
                    <>
                      <Button
                        type="button"
                        onPress={() => {
                          setEvoluServerOffline(
                            selectedEvoluServerUrl,
                            !offline,
                          );
                        }}
                        variant="secondary"
                      >
                        {offline
                          ? t("evoluServerOfflineEnable")
                          : t("evoluServerOfflineDisable")}
                      </Button>
                    </>
                  }
                  testID="evoluServerOfflineLabel"
                />

                {isEvoluServerRecommended(selectedEvoluServerUrl) ? (
                  <Text variant="label" color="$colorMuted">
                    {t("relayRecommendedNote")}
                  </Text>
                ) : (
                  <Row
                    justifyContent="space-between"
                    minHeight="$control"
                    paddingVertical="$sm"
                  >
                    <Button
                      width="100%"
                      type="button"
                      onPress={() => {
                        if (
                          pendingEvoluServerDeleteUrl === selectedEvoluServerUrl
                        ) {
                          const selectedLower =
                            selectedEvoluServerUrl.toLowerCase();
                          const nextUrls = evoluServerUrls.filter(
                            (u) => u.toLowerCase() !== selectedLower,
                          );
                          setPendingEvoluServerDeleteUrl(null);
                          setEvoluServerOffline(selectedEvoluServerUrl, false);
                          saveEvoluServerUrls(nextUrls);
                          navigateTo({ route: "evoluServers" });
                          return;
                        }
                        setStatus(t("deleteArmedHint"));
                        setPendingEvoluServerDeleteUrl(selectedEvoluServerUrl);
                      }}
                      variant="danger"
                    >
                      {t("evoluServerRemove")}
                    </Button>
                  </Row>
                )}
              </>
            );
          })()}
        </>
      ) : (
        <Text variant="label" color="$colorMuted">
          {t("errorPrefix")}
        </Text>
      )}
    </Stack>
  );
}
