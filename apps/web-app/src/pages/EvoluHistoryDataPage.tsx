import { Button, Chip, Row, Stack, Text } from "@linky-fit/ui";
import { EvoluHistoryTable } from "../components/EvoluHistoryTable";
import { base64 } from "@scure/base";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useEvoluSettingsContext } from "../app/context/SystemSettingsContexts";
import { loadEvoluHistoryData, type EvoluHistoryRow } from "../evolu";
import { decodeBase64Url } from "../utils/base64";
const BATCH_SIZE = 50;
export function EvoluHistoryDataPage(): React.ReactElement {
  const { evoluSyncOwnerIds } = useEvoluSettingsContext();
  const { t } = useAppShellCore();
  const [historyData, setHistoryData] = useState<EvoluHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const normalizeOwnerId = useCallback((value: string): string => {
    const bytes = decodeBase64Url(value);
    return bytes?.length ? base64.encode(bytes) : value.trim();
  }, []);
  const allowedOwnerIds = useMemo(() => {
    const values = evoluSyncOwnerIds
      .map((ownerId) => ownerId.trim())
      .filter(Boolean);
    const out = new Set<string>();
    for (const value of values) {
      out.add(value);
      out.add(normalizeOwnerId(value));
    }
    return out;
  }, [evoluSyncOwnerIds, normalizeOwnerId]);
  const readRowOwnerId = useCallback(
    (row: EvoluHistoryRow): string => {
      const ownerId = row.ownerId;
      if (typeof ownerId !== "string") return "";
      const normalized = normalizeOwnerId(ownerId);
      if (normalized) return normalized;
      return ownerId.trim();
    },
    [normalizeOwnerId],
  );
  useEffect(() => {
    loadEvoluHistoryData(BATCH_SIZE, 0).then((data) => {
      setHistoryData(data);
      setIsLoading(false);
      setHasMore(data.length === BATCH_SIZE);
    });
  }, []);
  const visibleHistoryData = useMemo(() => {
    if (allowedOwnerIds.size === 0) return [];
    return historyData.filter((row) =>
      allowedOwnerIds.has(readRowOwnerId(row)),
    );
  }, [allowedOwnerIds, historyData, readRowOwnerId]);
  const tableNames = useMemo(() => {
    const tables = new Set<string>();
    visibleHistoryData.forEach((row) => {
      if (row.table) tables.add(row.table);
    });
    return Array.from(tables).sort();
  }, [visibleHistoryData]);
  const filteredData = useMemo(() => {
    if (!selectedTable) return visibleHistoryData;
    return visibleHistoryData.filter((row) => row.table === selectedTable);
  }, [selectedTable, visibleHistoryData]);
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const newOffset = offset + BATCH_SIZE;
    try {
      const newData = await loadEvoluHistoryData(BATCH_SIZE, newOffset);
      if (newData.length > 0) {
        setHistoryData((prev) => [...prev, ...newData]);
        setOffset(newOffset);
        setHasMore(newData.length === BATCH_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more history:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, offset]);
  if (isLoading) {
    return (
      <Stack
        gap="$lg"
        marginTop="$lg"
        paddingTop="$sm"
        paddingBottom="$xxl"
        $wide={{ marginTop: "$none" }}
      >
        <Text variant="label" color="$colorMuted">
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
      {tableNames.length > 0 && (
        <Stack aria-label={t("filterByTable")}>
          <Row flexWrap="wrap" gap="$sm">
            <Chip
              label={t("all")}
              selected={selectedTable === null}
              onPress={() => setSelectedTable(null)}
            />
            {tableNames.map((tableName) => (
              <Chip
                key={tableName}
                label={tableName}
                selected={selectedTable === tableName}
                onPress={() => setSelectedTable(tableName)}
              />
            ))}
          </Row>
        </Stack>
      )}

      <Stack maxHeight="$contentWidth" overflow="scroll">
        {filteredData.length > 0 ? (
          <EvoluHistoryTable rows={filteredData} t={t} />
        ) : (
          <Text variant="label" color="$colorMuted">
            {t("evoluNoDataYet")}
          </Text>
        )}

        {hasMore && (
          <Stack alignItems="center" paddingVertical="$lg">
            <Button
              onPress={handleLoadMore}
              disabled={isLoadingMore}
              variant="secondary"
            >
              {isLoadingMore ? t("loadingMore") : t("loadMore")}
            </Button>
          </Stack>
        )}

        {!hasMore && historyData.length > 0 && (
          <Text alignItems="center" paddingVertical="$lg">
            {t("allRecordsLoaded")}
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
