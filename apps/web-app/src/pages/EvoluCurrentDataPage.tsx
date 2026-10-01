import { Button, DataTable, Row, Stack, Text } from "@linky-fit/ui";
import React, { useEffect, useState } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useEvoluSettingsContext } from "../app/context/SystemSettingsContexts";
import { readRowOwnerId } from "../app/lib/rowOwnerId";
import {
  filterRowsToVisibleShards,
  scopeOfTable,
  shortOwnerId,
} from "../app/lib/shardTables";
import { loadEvoluCurrentData } from "../evolu";
import { formatEvoluDebugValue } from "../utils/evoluDebugValue";
export function EvoluCurrentDataPage(): React.ReactElement {
  const { evoluShards, requestRotateShard, rotatingShardScope } =
    useEvoluSettingsContext();
  const { t } = useAppShellCore();
  const previewRowCount = 2;
  const [currentData, setCurrentData] = useState<
    Awaited<ReturnType<typeof loadEvoluCurrentData>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>(
    {},
  );
  useEffect(() => {
    loadEvoluCurrentData().then((data) => {
      setCurrentData(data);
      setIsLoading(false);
    });
  }, []);
  const dataSections = React.useMemo(
    () =>
      Object.entries(currentData)
        .map(([tableName, rows]) => ({
          tableName,
          scope: scopeOfTable(tableName),
          rows: filterRowsToVisibleShards(
            tableName,
            rows,
            evoluShards,
            readRowOwnerId,
          ),
        }))
        .filter(({ scope, rows }) => scope !== null || rows.length > 0),
    [currentData, evoluShards],
  );
  if (isLoading) {
    return (
      <Stack
        gap="$lg"
        marginTop="$lg"
        paddingTop="$sm"
        paddingBottom="$xxl"
        $wide={{ marginTop: "$none" }}
      >
        <Text variant="body" color="$colorMuted">
          {t("loading")}...
        </Text>
      </Stack>
    );
  }
  return (
    <Stack
      gap="$lg"
      marginTop="$lg"
      paddingTop="$sm"
      paddingBottom="$xxl"
      $wide={{ marginTop: "$none" }}
    >
      <Stack maxHeight="$contentWidth" overflow="scroll">
        <Stack padding="$none" gap="$none">
          <Stack padding="$lg">
            <Row justifyContent="space-between">
              <Text variant="title" role="heading">
                {t("evoluShards")}
              </Text>
            </Row>
            <Row flexWrap="wrap" gap="$md">
              {evoluShards.map((shard) => (
                <Stack
                  key={shard.scope}
                  flexGrow={1}
                  minWidth="$column"
                  padding="$md"
                  gap="$xs"
                >
                  <Row justifyContent="space-between" gap="$sm">
                    <Text variant="label" flex={1} textAlign="right">
                      {shard.scope}
                    </Text>
                    {shard.rotates ? (
                      <Button
                        type="button"
                        disabled={rotatingShardScope !== null}
                        onPress={() => {
                          if (rotatingShardScope !== null) return;
                          void requestRotateShard(shard.scope);
                        }}
                        variant="secondary"
                      >
                        {t(
                          rotatingShardScope === shard.scope
                            ? "evoluShardRotating"
                            : "evoluShardRotate",
                        ).replace("{scope}", shard.scope)}
                      </Button>
                    ) : (
                      <Text variant="body" color="$colorMuted">
                        {t("evoluShardFixed")}
                      </Text>
                    )}
                  </Row>
                  <Row justifyContent="space-between" gap="$sm">
                    <Text variant="body" color="$colorMuted">
                      {t("evoluShardIndex")}
                    </Text>
                    <Text variant="body">{shard.index}</Text>
                  </Row>
                  <Row justifyContent="space-between" gap="$sm">
                    <Text variant="body" color="$colorMuted">
                      {t("evoluShardVisibleCount")}
                    </Text>
                    <Text variant="body">{shard.visibleOwnerIds.length}</Text>
                  </Row>
                  <Row justifyContent="space-between" gap="$sm">
                    <Text variant="body" color="$colorMuted">
                      {t("evoluShardOwner")}
                    </Text>
                    <Text accessibilityLabel={shard.ownerId} variant="body">
                      {shortOwnerId(shard.ownerId)}
                    </Text>
                  </Row>
                </Stack>
              ))}
            </Row>
          </Stack>
        </Stack>

        {dataSections.map(({ tableName, scope, rows }) => {
          const shard = evoluShards.find((entry) => entry.scope === scope);
          const isExpanded = expandedTables[tableName] === true;
          const visibleRows = isExpanded
            ? rows
            : rows.slice(0, previewRowCount);
          const hiddenRowsCount = Math.max(0, rows.length - visibleRows.length);
          const toggleExpanded = () => {
            setExpandedTables((current) => ({
              ...current,
              [tableName]: !current[tableName],
            }));
          };
          return (
            <Stack key={tableName} padding="$none" gap="$none">
              <Stack padding="$lg">
                <Row justifyContent="space-between">
                  <Text variant="title" role="heading">
                    {tableName}
                  </Text>
                  {shard && (
                    <Text variant="body" color="$colorMuted">
                      {shard.scope} / {shard.index}
                    </Text>
                  )}
                </Row>

                <Row flexWrap="wrap" gap="$md">
                  <Stack
                    padding="$md"
                    flexGrow={1}
                    minWidth="$column"
                    gap="$xs"
                  >
                    <Row justifyContent="space-between" gap="$sm">
                      <Text variant="body" color="$colorMuted">
                        Rows
                      </Text>
                      <Text variant="body">{rows.length}</Text>
                    </Row>
                  </Stack>
                </Row>
              </Stack>

              <Stack padding="$md">
                {rows.length > 0 ? (
                  <>
                    <DataTable
                      accessibilityLabel={tableName}
                      columns={Object.keys(rows[0])
                        .filter((key) => key !== "createdAt")
                        .map((key) => ({ key, label: key }))}
                      rows={visibleRows.map((row, index) => ({
                        key: String(index),
                        cells: Object.entries(row)
                          .filter(([key]) => key !== "createdAt")
                          .map(([key, value]) =>
                            formatEvoluDebugValue(tableName, key, value).slice(
                              0,
                              50,
                            ),
                          ),
                      }))}
                    />

                    {(rows.length > previewRowCount || isExpanded) && (
                      <Row flexWrap="wrap" justifyContent="space-between">
                        <Text variant="body" color="$colorMuted">
                          {isExpanded
                            ? t("evoluShowingAllRows")
                            : t("evoluShowingPreviewRows").replace(
                                "{count}",
                                String(visibleRows.length),
                              )}
                        </Text>
                        <Button
                          type="button"
                          onPress={toggleExpanded}
                          variant="secondary"
                        >
                          {isExpanded
                            ? t("evoluHideSectionDetail")
                            : t("evoluShowSectionDetail").replace(
                                "{count}",
                                String(hiddenRowsCount),
                              )}
                        </Button>
                      </Row>
                    )}
                  </>
                ) : (
                  <Text variant="body" color="$colorMuted">
                    {t("evoluNoDataYet")}
                  </Text>
                )}
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
