import {
  Button,
  ListRow,
  Row,
  Stack,
  StatusDot,
  Text,
  Pill,
} from "@linky-fit/ui";
import { connectionStatus } from "../utils/connectionStatus";

import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useEvoluSettingsContext } from "../app/context/SystemSettingsContexts";
import { deriveEvoluServerState } from "../app/lib/evoluServerState";
import { navigateTo } from "../hooks/useRouting";
import { EvoluReloadNotice } from "./EvoluReloadNotice";
import { EvoluSyncErrorNotice } from "./EvoluSyncErrorNotice";
export function EvoluServersPage(): React.ReactElement {
  const {
    clearDatabaseArmed,
    evoluHasError,
    evoluErrorType,
    evoluHistoryCount,
    evoluServerStatusByUrl,
    evoluServerUrls,
    evoluShards,
    evoluSyncOwnerIds,
    evoluTableCounts,
    evoluWipeStorageIsBusy,
    isEvoluServerOffline,
    isEvoluServerRecommended,
    requestClearDatabase,
    syncOwnerId,
  } = useEvoluSettingsContext();
  const { t } = useAppShellCore();
  const counts = Object.values(evoluTableCounts);
  const totalCurrentRows = counts.reduce<number | null>(
    (sum, count) => (sum === null || count === null ? null : sum + count),
    counts.length ? 0 : null,
  );
  return (
    <Stack gap="$lg">
      <EvoluSyncErrorNotice />
      <EvoluReloadNotice />
      {evoluServerUrls.every(isEvoluServerOffline) && (
        <Text role="status" variant="label" color="$colorMuted">
          {t("evoluNoBackupWarning")}
        </Text>
      )}
      {/* Server list */}
      {evoluServerUrls.length === 0 ? (
        <Text variant="label" color="$colorMuted">
          {t("evoluServersEmpty")}
        </Text>
      ) : (
        <Stack testID="evolu-server-list" gap="$xs">
          {evoluServerUrls.map((url) => {
            const { state, labelKey } = deriveEvoluServerState({
              evoluHasError,
              isOffline: isEvoluServerOffline(url),
              state: evoluServerStatusByUrl[url],
              syncOwnerId,
            });
            return (
              <ListRow
                key={url}
                title={url}
                description={
                  isEvoluServerRecommended(url) ? (
                    <Pill size="sm" label={t("relayRecommended")} />
                  ) : undefined
                }
                trailing={
                  <Row gap="$sm">
                    <StatusDot
                      tone={connectionStatus[state].tone}
                      accessibilityLabel={state}
                    />
                    <Text variant="label" color="$colorMuted">
                      {t(labelKey)}
                    </Text>
                  </Row>
                }
                onPress={() => navigateTo({ route: "evoluServer", id: url })}
              />
            );
          })}
        </Stack>
      )}

      <Row
        justifyContent="space-between"
        minHeight="$control"
        paddingVertical="$sm"
      >
        <Button
          width="100%"
          type="button"
          onPress={requestClearDatabase}
          disabled={
            evoluWipeStorageIsBusy || evoluErrorType === "ProtocolQuotaError"
          }
          variant={clearDatabaseArmed ? "danger" : "secondary"}
        >
          {t("evoluClearDatabase")}
        </Button>
      </Row>

      <Text variant="title" role="heading" marginTop="$lg">
        {t("evoluShards")}
      </Text>

      {evoluShards.map((shard) => (
        <ListRow
          key={shard.scope}
          title={shard.scope}
          trailing={
            <>
              <Text variant="label" color="$colorMuted">
                {shard.index} ({shard.visibleOwnerIds.length}{" "}
                {t("evoluShardVisibleCount").toLowerCase()})
              </Text>
            </>
          }
        />
      ))}

      <ListRow
        title={t("evoluSyncedOwners")}
        trailing={
          <>
            <Text variant="label" color="$colorMuted">
              {evoluSyncOwnerIds.length}
            </Text>
          </>
        }
        testID="evoluSyncedOwners"
      />

      <Text variant="title" role="heading" marginTop="$lg">
        {t("evoluRowCounts")}
      </Text>

      <ListRow
        title={t("evoluData")}
        trailing={
          <>
            <Text variant="label" color="$colorMuted">
              {totalCurrentRows === null
                ? t("unknown")
                : `${totalCurrentRows} rows`}
            </Text>
          </>
        }
        testID="evoluData"
        onPress={() => navigateTo({ route: "evoluCurrentData" })}
      />

      <ListRow
        title={t("evoluHistory")}
        trailing={
          <>
            <Text variant="label" color="$colorMuted">
              {evoluHistoryCount === null
                ? t("unknown")
                : `${evoluHistoryCount} rows`}
            </Text>
          </>
        }
        testID="evoluHistory"
        onPress={() => navigateTo({ route: "evoluHistoryData" })}
      />

      <ListRow
        icon="MessageCircle"
        title={t("chatStorage")}
        onPress={() => navigateTo({ route: "chatStorage" })}
      />
    </Stack>
  );
}
