import {
  Button,
  Chip,
  DataTable,
  ListRow,
  Progress,
  Row,
  Stack,
  Text,
} from "@linky-fit/ui";
import { EvoluHistoryTable } from "../components/EvoluHistoryTable";
import type { LinkyScope } from "@linky-fit/linksync";
import React, { useState } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useEvoluSettingsContext } from "../app/context/SystemSettingsContexts";
import { readRowOwnerId } from "../app/lib/rowOwnerId";
import {
  filterRowsToVisibleShards,
  scopeOfTable,
} from "../app/lib/shardTables";
import {
  loadEvoluCurrentData,
  loadEvoluHistoryData,
  type EvoluHistoryRow,
} from "../evolu";
import { formatEvoluDebugValue } from "../utils/evoluDebugValue";
import { formatBytes } from "../utils/formatting";
const ONE_MB = 1024 * 1024;
export function EvoluDataDetailPage(): React.ReactElement {
  const {
    clearDatabaseArmed,
    evoluDatabaseBytes,
    evoluErrorType,
    evoluHistoryCount,
    evoluShards,
    evoluTableCounts,
    evoluWipeStorageIsBusy,
    requestClearDatabase,
  } = useEvoluSettingsContext();
  const { t } = useAppShellCore();
  const [scopeView, setScopeView] = useState<LinkyScope | "all">("all");
  const inScopeView = React.useCallback(
    (tableName: string): boolean =>
      scopeView === "all" || scopeOfTable(tableName) === scopeView,
    [scopeView],
  );
  const [showHistoryData, setShowHistoryData] = useState(false);
  const [showCurrentData, setShowCurrentData] = useState(false);
  const [historyData, setHistoryData] = useState<EvoluHistoryRow[]>([]);
  const [currentData, setCurrentData] = useState<
    Awaited<ReturnType<typeof loadEvoluCurrentData>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const rawDbBytes = evoluDatabaseBytes ?? 0;
  const percentage = Math.min((rawDbBytes / ONE_MB) * 100, 100);
  // Separate tables into user data and system tables
  const userTables = [
    "contact",
    "conversation",
    "message",
    "reaction",
    "unknownSenderMessage",
    "cashuToken",
    "cashuProof",
    "cashuOperation",
    "nostrIdentity",
    "nostrMessage",
    "nostrReaction",
    "transaction",
  ];
  const systemTables = ["ownerMeta", "shardPointer", "setting"];
  const tableEntries = Object.entries(evoluTableCounts);
  const scopedEntries = tableEntries.filter(([name]) => inScopeView(name));
  const userTableEntries = scopedEntries
    .filter(([name]) => userTables.includes(name))
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
  const systemTableEntries = scopedEntries
    .filter(([name]) => systemTables.includes(name))
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
  const totalCurrentRows = scopedEntries.reduce<number | null>(
    (sum, [, count]) => (sum === null || count === null ? null : sum + count),
    scopedEntries.length ? 0 : null,
  );
  const historyRows = evoluHistoryCount;
  const totalRows =
    totalCurrentRows === null || historyRows === null
      ? null
      : totalCurrentRows + historyRows;
  // Calculate row distribution percentages
  const calculatePercentage = (rows: number | null) => {
    if (rows === null || totalRows === null) return null;
    if (totalRows === 0) return 0;
    return Math.round((rows / totalRows) * 100);
  };
  const handleShowHistory = async () => {
    if (!showHistoryData && historyData.length === 0) {
      setIsLoading(true);
      const data = await loadEvoluHistoryData();
      setHistoryData(data);
      setIsLoading(false);
    }
    setShowHistoryData(!showHistoryData);
  };
  const handleShowCurrent = async () => {
    if (!showCurrentData && Object.keys(currentData).length === 0) {
      setIsLoading(true);
      const data = await loadEvoluCurrentData();
      setCurrentData(data);
      setIsLoading(false);
    }
    setShowCurrentData(!showCurrentData);
  };
  const currentDataEntries = React.useMemo(
    () =>
      Object.entries(currentData)
        .filter(([tableName]) => inScopeView(tableName))
        .map(
          ([tableName, rows]) =>
            [
              tableName,
              filterRowsToVisibleShards(
                tableName,
                rows,
                evoluShards,
                readRowOwnerId,
              ),
            ] as const,
        ),
    [currentData, evoluShards, inScopeView],
  );
  const visibleHistoryRows = React.useMemo(
    () =>
      historyData.filter(
        (row) =>
          inScopeView(row.table) &&
          filterRowsToVisibleShards(
            row.table,
            [row],
            evoluShards,
            readRowOwnerId,
          ).length === 1,
      ),
    [evoluShards, historyData, inScopeView],
  );
  return (
    <Stack
      gap="$lg"
      marginTop="$lg"
      paddingVertical="$xxl"
      $wide={{ marginTop: "$none" }}
    >
      {evoluDatabaseBytes !== null ? (
        <>
          <ListRow
            title={t("evoluRawDbSize")}
            trailing={
              <>
                <Text variant="label" color="$colorMuted">
                  {formatBytes(rawDbBytes)} / 1 MiB
                </Text>
              </>
            }
            testID="evoluRawDbSize"
          />

          {/* Progress bar showing usage of 1MB limit */}
          <Stack>
            <Progress
              value={percentage}
              max={100}
              tone={
                percentage > 90
                  ? "danger"
                  : percentage > 70
                    ? "warning"
                    : "accent"
              }
              accessibilityLabel={t("evoluUsageOfLimit")}
            />

            <Text variant="caption" color="$colorMuted">
              {t("evoluUsageOfLimit").replace(
                "{percent}",
                percentage.toFixed(1),
              )}
            </Text>
          </Stack>

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
                evoluWipeStorageIsBusy ||
                evoluErrorType === "ProtocolQuotaError"
              }
              variant={clearDatabaseArmed ? "danger" : "secondary"}
            >
              {t("evoluClearDatabase")}
            </Button>
          </Row>

          <Text variant="title" role="heading" marginTop="$lg">
            {t("evoluRowCounts")}
          </Text>

          <Row flexWrap="wrap">
            <Chip
              label={t("all")}
              selected={scopeView === "all"}
              onPress={() => setScopeView("all")}
            />
            {evoluShards.map((shard) => (
              <Chip
                key={shard.scope}
                label={shard.scope}
                selected={scopeView === shard.scope}
                onPress={() => setScopeView(shard.scope)}
              />
            ))}
          </Row>

          {evoluShards.map((shard) => (
            <ListRow
              key={shard.scope}
              title={`${shard.scope} ${t("evoluShardIndex").toLowerCase()}`}
              trailing={
                <>
                  <Text variant="label" color="$colorMuted">
                    {shard.index} ({shard.visibleOwnerIds.length}{" "}
                    {t("evoluShardVisibleCount").toLowerCase()})
                  </Text>
                </>
              }
              testID="evoluShardIndex"
            />
          ))}

          <ListRow
            title={t("evoluCurrentDataJson")}
            trailing={
              <>
                <Text variant="label" color="$colorMuted">
                  {totalCurrentRows === null
                    ? t("unknown")
                    : `${totalCurrentRows} rows`}
                </Text>
              </>
            }
            testID="evoluCurrentDataJson"
          />

          <ListRow
            title={t("evoluHistoryDataJson")}
            trailing={
              <>
                <Text variant="label" color="$colorMuted">
                  {historyRows === null ? t("unknown") : `${historyRows} rows`}
                </Text>
              </>
            }
            testID="evoluHistoryDataJson"
          />

          <ListRow
            title={t("evoluTotalRows")}
            trailing={
              <>
                <Text variant="label" color="$colorMuted">
                  {totalRows === null ? t("unknown") : `${totalRows} rows`}
                </Text>
              </>
            }
            testID="evoluTotalRows"
          />

          {/* Buttons to view data */}
          <Row flexWrap="wrap">
            <Button
              type="button"
              onPress={handleShowCurrent}
              disabled={isLoading}
              variant="secondary"
            >
              {showCurrentData
                ? t("evoluHideCurrentData")
                : t("evoluShowCurrentData")}
            </Button>
            <Button
              type="button"
              onPress={handleShowHistory}
              disabled={isLoading}
              variant="secondary"
            >
              {showHistoryData
                ? t("evoluHideHistoryData")
                : t("evoluShowHistoryData")}
            </Button>
          </Row>

          {isLoading && (
            <Text variant="label" color="$colorMuted">
              {t("loading")}...
            </Text>
          )}

          {/* Current Data Table View */}
          {showCurrentData && (
            <Stack>
              <Text variant="title" role="heading">
                {t("evoluCurrentDataJson")}
              </Text>
              <Stack>
                {currentDataEntries.map(([tableName, rows]) => (
                  <Stack key={tableName}>
                    <Text variant="title" role="heading">
                      {tableName} ({rows.length} rows)
                    </Text>
                    {rows.length > 0 ? (
                      <DataTable
                        accessibilityLabel={tableName}
                        columns={Object.keys(rows[0]).map((key) => ({
                          key,
                          label: key,
                        }))}
                        rows={rows.map((row, index) => ({
                          key: String(index),
                          cells: Object.entries(row).map(([key, value]) =>
                            formatEvoluDebugValue(tableName, key, value).slice(
                              0,
                              50,
                            ),
                          ),
                        }))}
                      />
                    ) : (
                      <Text variant="label" color="$colorMuted">
                        {t("evoluNoDataYet")}
                      </Text>
                    )}
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}

          {/* History Data Table View - All individual records */}
          {showHistoryData && (
            <Stack>
              <Text variant="title" role="heading">
                {t("evoluHistoryDataJson")}
              </Text>
              <Stack>
                {visibleHistoryRows.length > 0 ? (
                  <EvoluHistoryTable rows={visibleHistoryRows} t={t} />
                ) : (
                  <Text variant="label" color="$colorMuted">
                    {t("evoluNoDataYet")}
                  </Text>
                )}
              </Stack>
            </Stack>
          )}

          <Text variant="title" role="heading" marginTop="$lg">
            {t("evoluUserTables")}
          </Text>

          {userTableEntries.length === 0 ? (
            <Text variant="label" color="$colorMuted">
              {t(tableEntries.length === 0 ? "unknown" : "evoluNoDataYet")}
            </Text>
          ) : (
            userTableEntries.map(([tableName, count]) => {
              const rows = count;
              const percentage = calculatePercentage(rows);
              const estimatedTableBytes =
                rows === null || totalRows === null
                  ? null
                  : totalRows > 0
                    ? Math.round((rows / totalRows) * rawDbBytes)
                    : 0;
              return (
                <ListRow
                  key={tableName}
                  testID={tableName}
                  title={tableName}
                  trailing={
                    <>
                      <Text variant="label" color="$colorMuted">
                        {rows === null ? t("unknown") : `${rows} rows`}
                        {percentage === null ? "" : ` (${percentage}%)`}
                      </Text>
                      <Text variant="label" color="$colorMuted">
                        {estimatedTableBytes === null
                          ? ""
                          : `~${formatBytes(estimatedTableBytes)}`}
                      </Text>
                    </>
                  }
                />
              );
            })
          )}

          {systemTableEntries.length > 0 && (
            <>
              <Text variant="title" role="heading" marginTop="$lg">
                {t("evoluSystemTables")}
              </Text>
              {systemTableEntries.map(([tableName, count]) => {
                const rows = count;
                const percentage = calculatePercentage(rows);
                const estimatedTableBytes =
                  rows === null || totalRows === null
                    ? null
                    : totalRows > 0
                      ? Math.round((rows / totalRows) * rawDbBytes)
                      : 0;
                return (
                  <ListRow
                    key={tableName}
                    testID={tableName}
                    title={tableName}
                    trailing={
                      <>
                        <Text variant="label" color="$colorMuted">
                          {rows === null ? t("unknown") : `${rows} rows`}
                          {percentage === null ? "" : ` (${percentage}%)`}
                        </Text>
                        <Text variant="label" color="$colorMuted">
                          {estimatedTableBytes === null
                            ? ""
                            : `~${formatBytes(estimatedTableBytes)}`}
                        </Text>
                      </>
                    }
                  />
                );
              })}
            </>
          )}

          <Text variant="label" color="$colorMuted">
            {t("evoluSizeEstimateHint")}
          </Text>
        </>
      ) : (
        <Text variant="label" color="$colorMuted">
          {t("unknown")}
        </Text>
      )}
    </Stack>
  );
}
