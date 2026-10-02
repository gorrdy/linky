import {
  Button,
  Chip,
  CodeBlock,
  IconButton,
  ListRow,
  Row,
  SelectField,
  Stack,
  StatusDot,
  Text,
  TextField,
  TimelineRow as DiagnosticTimelineRow,
  border,
  Pill,
} from "@linky-fit/ui";
import type { Tone } from "@linky-fit/ui";
import { pickFile } from "../../utils/pickFile";
import { connectionStatus } from "../../utils/connectionStatus";
import React from "react";

import {
  inspectorLinkIds,
  type CollectedInspectorRow,
} from "../inspector/inspectorRows";
import { INSPECTOR_MAX_ROWS } from "../inspector/inspectorStore";
import {
  createStaticInspectorDataSource,
  type InspectorDataSource,
} from "./inspectorDataSource";
import { describeInspectorRow } from "./inspectorGlossary";
import {
  parseInspectorNdjson,
  type InspectorImportResult,
} from "./inspectorImport";

const MAX_RENDERED_ROWS = 2_000;
const FLUSH_INTERVAL_MS = 100;
const FOLLOW_THRESHOLD_PX = 32;

interface AppClient {
  id: string;
  /** First-seen order, used for the friendly "App N" label. */
  label: string;
  rowCount: number;
}

interface TimelineRowProps {
  clientLabel: string | null;
  isRelated: boolean;
  isSelected: boolean;
  onSelect: (row: CollectedInspectorRow) => void;
  row: CollectedInspectorRow;
}

interface DetailPaneProps {
  onClose: () => void;
  onJumpToRow: (row: CollectedInspectorRow) => void;
  relatedRows: CollectedInspectorRow[];
  row: CollectedInspectorRow;
}

interface InspectorAppProps {
  dataSource: InspectorDataSource;
  /** False when the app is not collecting events, so waiting is pointless. */
  isCollecting?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface OfflineImport {
  fileName: string;
  result: InspectorImportResult;
}

const timelineRowDomId = (id: number): string => `inspector-row-${id}`;
const channelTone = (channel: string): Tone =>
  channel.startsWith("nostr")
    ? "accent"
    : channel.startsWith("cashu")
      ? "warning"
      : channel.startsWith("evolu")
        ? "info"
        : "neutral";

const formatTime = (at: number): string => {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return String(at);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const rowSearchText = (row: CollectedInspectorRow): string => {
  const payloadText =
    row.payload === undefined ? "" : JSON.stringify(row.payload);
  return `${row.tag}\n${row.summary}\n${JSON.stringify(row.links)}\n${JSON.stringify(row.context)}\n${payloadText}`;
};

const TimelineRow = React.memo(function TimelineRow({
  clientLabel,
  isRelated,
  isSelected,
  onSelect,
  row,
}: TimelineRowProps): React.ReactElement {
  return (
    <DiagnosticTimelineRow
      time={formatTime(row.at)}
      clientLabel={clientLabel ?? undefined}
      channel={row.channel}
      tag={row.tag}
      summary={row.summary}
      tone={channelTone(row.channel)}
      selected={isSelected}
      related={isRelated}
      id={timelineRowDomId(row.id)}
      testID="timeline-row"
      onPress={() => onSelect(row)}
    />
  );
});

interface DetailEntry {
  label: string;
  value: string;
}

const detailEntries = (
  record: Record<string, string | string[]>,
): DetailEntry[] => {
  const entries: DetailEntry[] = [];
  for (const [label, value] of Object.entries(record)) {
    if (typeof value === "string") {
      entries.push({ label, value });
      continue;
    }
    for (const entry of value) entries.push({ label, value: entry });
  }
  return entries;
};

function DetailPane({
  onClose,
  onJumpToRow,
  relatedRows,
  row,
}: DetailPaneProps): React.ReactElement {
  const [copyStatus, setCopyStatus] = React.useState<
    "idle" | "copied" | "failed"
  >("idle");
  const rowJson = React.useMemo(() => JSON.stringify(row, null, 2), [row]);
  const payloadJson = React.useMemo(
    () =>
      row.payload === undefined ? null : JSON.stringify(row.payload, null, 2),
    [row],
  );
  const links = detailEntries(row.links);
  const context = detailEntries(row.context ?? {});
  const hasLinkIds = inspectorLinkIds(row.links).length > 0;

  React.useEffect(() => {
    setCopyStatus("idle");
  }, [row]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rowJson);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }, [rowJson]);

  return (
    <Stack
      aria-label="Row detail"
      role="complementary"
      width="$sheetWidth"
      maxWidth="100%"
      flexShrink={0}
      minHeight={0}
      gap="$md"
      padding="$lg"
      backgroundColor="$surface"
      borderLeftWidth={border.hairline}
      borderColor="$borderColor"
      overflow="scroll"
      $compact={{ width: "100%", flex: 1 }}
    >
      <Row justifyContent="space-between">
        <Stack gap="$xs">
          <Text eyebrow>Row #{row.id}</Text>
          <Text variant="title" role="heading">
            {row.tag}
          </Text>
        </Stack>
        <IconButton
          icon="X"
          accessibilityLabel="Close row detail"
          onPress={onClose}
          size="sm"
        />
      </Row>
      <Stack gap="$xs">
        <ListRow
          title="time"
          trailing={
            <Text mono variant="caption">
              {formatTime(row.at)}
            </Text>
          }
        />
        <ListRow
          title="channel"
          trailing={
            <Pill
              size="sm"
              label={row.channel}
              tone={channelTone(row.channel)}
            />
          }
        />
        <Text eyebrow>app</Text>
        <CodeBlock>{row.client}</CodeBlock>
        <Text eyebrow>summary</Text>
        <Text variant="label">{row.summary || "—"}</Text>
      </Stack>
      {links.length > 0 && (
        <Stack gap="$sm">
          <Text variant="label" bold>
            Links
          </Text>
          {links.map((link, index) => (
            <Stack key={`${link.label}-${index}`} gap="$xxs">
              <Text variant="caption" color="$colorMuted">
                {link.label}
              </Text>
              <Text
                mono
                variant="caption"
                testID="link-value"
                userSelect="text"
              >
                {link.value}
              </Text>
            </Stack>
          ))}
        </Stack>
      )}
      {context.length > 0 && (
        <Stack gap="$sm">
          <Text variant="label" bold>
            Context
          </Text>
          {context.map((entry, index) => (
            <Stack key={`${entry.label}-${index}`} gap="$xxs">
              <Text variant="caption" color="$colorMuted">
                {entry.label}
              </Text>
              <Text mono variant="caption" userSelect="text">
                {entry.value}
              </Text>
            </Stack>
          ))}
        </Stack>
      )}
      <Text variant="label" bold>
        Related rows ({relatedRows.length})
      </Text>
      {relatedRows.length === 0 ? (
        <Text variant="caption" color="$colorMuted">
          {hasLinkIds
            ? "No other rows share this row's link ids."
            : "This row carries no link ids to correlate by."}
        </Text>
      ) : (
        <Stack testID="related-rows" gap="$none" overflow="scroll">
          {relatedRows.map((relatedRow) => (
            <DiagnosticTimelineRow
              key={relatedRow.id}
              testID="related-row"
              time={formatTime(relatedRow.at)}
              channel={relatedRow.channel}
              tag={relatedRow.tag}
              summary={relatedRow.summary}
              tone={channelTone(relatedRow.channel)}
              onPress={() => onJumpToRow(relatedRow)}
            />
          ))}
        </Stack>
      )}
      <Text variant="label" bold>
        What is this?
      </Text>
      <Text variant="caption" color="$colorMuted">
        {describeInspectorRow(row)}
      </Text>
      <Row justifyContent="space-between">
        <Text variant="label" bold>
          Payload
        </Text>
        <Button variant="secondary" size="sm" onPress={handleCopy}>
          {copyStatus === "copied"
            ? "Copied"
            : copyStatus === "failed"
              ? "Copy failed"
              : "Copy row JSON"}
        </Button>
      </Row>
      <CodeBlock testID="inspector-payload">{payloadJson ?? "—"}</CodeBlock>
    </Stack>
  );
}

export function InspectorApp({
  dataSource,
  isCollecting = true,
  isFullscreen = false,
  onToggleFullscreen,
}: InspectorAppProps): React.ReactElement {
  const [rows, setRows] = React.useState<CollectedInspectorRow[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const [hiddenChannels, setHiddenChannels] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [clientFilter, setClientFilter] = React.useState("all");
  const [textFilter, setTextFilter] = React.useState("");
  const [selectedRow, setSelectedRow] =
    React.useState<CollectedInspectorRow | null>(null);
  const [isFollowing, setIsFollowing] = React.useState(true);
  const [offlineImport, setOfflineImport] =
    React.useState<OfflineImport | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importMessage, setImportMessage] = React.useState<string | null>(null);

  const incomingRowsRef = React.useRef<CollectedInspectorRow[]>([]);
  // Ids are monotonic and SSE delivery is ordered (including replay), so a
  // high-water mark is enough to dedupe reconnect replays.
  const lastSeenIdRef = React.useRef(0);
  const isPausedRef = React.useRef(false);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  const activeDataSource = React.useMemo(
    () =>
      offlineImport
        ? createStaticInspectorDataSource(offlineImport.result.rows)
        : dataSource,
    [dataSource, offlineImport],
  );

  const flushIncomingRows = React.useCallback(() => {
    if (isPausedRef.current || incomingRowsRef.current.length === 0) return;

    const incoming = incomingRowsRef.current;
    incomingRowsRef.current = [];
    setRows((current) => [...current, ...incoming].slice(-INSPECTOR_MAX_ROWS));
  }, []);

  React.useEffect(() => {
    incomingRowsRef.current = [];
    lastSeenIdRef.current = 0;
    isPausedRef.current = false;
    setRows([]);
    setSelectedRow(null);
    setIsPaused(false);
    setIsConnected(false);

    const flushTimer = window.setInterval(flushIncomingRows, FLUSH_INTERVAL_MS);
    const disconnect = activeDataSource.connect({
      onClear: () => {
        incomingRowsRef.current = [];
        setRows([]);
        setSelectedRow(null);
      },
      onConnectionChange: setIsConnected,
      onRows: (incomingRows) => {
        for (const row of incomingRows) {
          if (row.id <= lastSeenIdRef.current) continue;
          lastSeenIdRef.current = row.id;
          incomingRowsRef.current.push(row);
          if (incomingRowsRef.current.length > INSPECTOR_MAX_ROWS) {
            incomingRowsRef.current.shift();
          }
        }
      },
    });

    return () => {
      disconnect();
      window.clearInterval(flushTimer);
    };
  }, [activeDataSource, flushIncomingRows]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRow(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // App instances observed in the stream, in first-seen order so the friendly
  // "App N" labels stay stable while rows keep arriving.
  const appClients = React.useMemo((): AppClient[] => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.client, (counts.get(row.client) ?? 0) + 1);
    }
    return [...counts.entries()].map(([id, rowCount], index) => ({
      id,
      label: `App ${index + 1}`,
      rowCount,
    }));
  }, [rows]);

  const observedChannels = React.useMemo((): string[] => {
    const channels = new Set<string>();
    for (const row of rows) channels.add(row.channel);
    return [...channels];
  }, [rows]);

  const clientLabelById = React.useMemo(() => {
    const labels = new Map<string, string>();
    for (const appClient of appClients) {
      labels.set(appClient.id, appClient.label);
    }
    return labels;
  }, [appClients]);

  // If the selected app's rows were cleared away, fall back to all apps so
  // the select never holds a value that is no longer offered.
  React.useEffect(() => {
    if (clientFilter !== "all" && !clientLabelById.has(clientFilter)) {
      setClientFilter("all");
    }
  }, [clientFilter, clientLabelById]);

  // Rows sharing any of the selected row's link ids, computed over the full
  // buffer so the detail pane lists related rows even when filtered out.
  const relatedRows = React.useMemo(() => {
    if (!selectedRow) return [];
    const selectedIds = new Set(inspectorLinkIds(selectedRow.links));
    if (selectedIds.size === 0) return [];
    return rows.filter(
      (row) =>
        row.id !== selectedRow.id &&
        inspectorLinkIds(row.links).some((id) => selectedIds.has(id)),
    );
  }, [rows, selectedRow]);

  const relatedRowIds = React.useMemo(
    () => new Set(relatedRows.map((row) => row.id)),
    [relatedRows],
  );

  const matchingRows = React.useMemo(() => {
    const query = textFilter.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      if (hiddenChannels.has(row.channel)) return false;
      if (clientFilter !== "all" && row.client !== clientFilter) return false;
      if (!query) return true;
      return rowSearchText(row).toLocaleLowerCase().includes(query);
    });
  }, [clientFilter, hiddenChannels, rows, textFilter]);

  const hiddenRowCount = Math.max(0, matchingRows.length - MAX_RENDERED_ROWS);
  const renderedRows = React.useMemo(
    () => matchingRows.slice(-MAX_RENDERED_ROWS),
    [matchingRows],
  );

  React.useLayoutEffect(() => {
    if (!isFollowing) return;
    const timeline = timelineRef.current;
    if (timeline) timeline.scrollTop = timeline.scrollHeight;
  }, [isFollowing, renderedRows]);

  const handleTimelineScroll = React.useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    const distanceFromBottom =
      timeline.scrollHeight - timeline.scrollTop - timeline.clientHeight;
    setIsFollowing(distanceFromBottom <= FOLLOW_THRESHOLD_PX);
  }, []);

  const handleFollow = React.useCallback(() => {
    setIsFollowing(true);
    const timeline = timelineRef.current;
    if (timeline) timeline.scrollTop = timeline.scrollHeight;
  }, []);

  const handlePauseToggle = React.useCallback(() => {
    const nextPaused = !isPaused;
    isPausedRef.current = nextPaused;
    setIsPaused(nextPaused);
    if (!nextPaused) flushIncomingRows();
  }, [flushIncomingRows, isPaused]);

  const handleChannelToggle = React.useCallback((channel: string) => {
    setHiddenChannels((current) => {
      const next = new Set(current);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }, []);

  const handleJumpToRow = React.useCallback((row: CollectedInspectorRow) => {
    setSelectedRow(row);
    setIsFollowing(false);
    requestAnimationFrame(() => {
      document
        .getElementById(timelineRowDomId(row.id))
        ?.scrollIntoView({ block: "center" });
    });
  }, []);

  const handleClear = React.useCallback(async () => {
    setIsClearing(true);
    try {
      await activeDataSource.clear();
    } catch {
      // The local view can still be cleared while the collector reconnects.
    } finally {
      incomingRowsRef.current = [];
      setRows([]);
      setSelectedRow(null);
      setIsClearing(false);
    }
  }, [activeDataSource]);

  const handleImport = React.useCallback(async () => {
    const file = await pickFile(
      ".ndjson,.jsonl,.txt,application/x-ndjson,application/json,text/plain",
    );
    if (!file) return;

    setIsImporting(true);
    setImportMessage(`Reading ${file.name}…`);
    try {
      const result = parseInspectorNdjson(await file.text());
      incomingRowsRef.current = [];
      setRows([]);
      setSelectedRow(null);
      setOfflineImport({ fileName: file.name, result });
      const truncation =
        result.truncatedRowCount > 0
          ? `; ${result.truncatedRowCount.toLocaleString()} older rows truncated`
          : "";
      setImportMessage(
        `Imported ${result.rows.length.toLocaleString()} rows (${result.skippedLineCount.toLocaleString()} skipped${truncation}).`,
      );
    } catch {
      setImportMessage(`Could not read ${file.name}.`);
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleLeaveOffline = React.useCallback(() => {
    incomingRowsRef.current = [];
    setRows([]);
    setSelectedRow(null);
    setOfflineImport(null);
    setImportMessage(null);
  }, []);

  const statusLabel = offlineImport
    ? "offline"
    : isConnected
      ? "connected"
      : "reconnecting";

  return (
    <Stack
      width="100%"
      height="100%"
      minHeight={0}
      backgroundColor="$background"
      gap="$none"
    >
      <Row
        role="banner"
        justifyContent="space-between"
        flexWrap="wrap"
        gap="$sm"
        padding="$sm"
        backgroundColor="$surface"
        borderBottomWidth={border.hairline}
        borderColor="$borderColor"
      >
        <Row gap="$sm">
          <Text variant="label" bold role="heading">
            Linky Inspector
          </Text>
          <StatusDot
            tone={
              offlineImport
                ? "info"
                : connectionStatus[isConnected ? "connected" : "checking"].tone
            }
            accessibilityLabel={statusLabel}
          />
          <Text
            variant="caption"
            color="$colorMuted"
            $compact={{ display: "none" }}
          >
            {statusLabel}
          </Text>
        </Row>
        <Row flexWrap="wrap" gap="$sm">
          {onToggleFullscreen && (
            <IconButton
              icon={isFullscreen ? "Minimize" : "Maximize"}
              accessibilityLabel={
                isFullscreen ? "Exit fullscreen" : "Fullscreen"
              }
              aria-pressed={isFullscreen}
              onPress={onToggleFullscreen}
              size="sm"
            />
          )}
          <Text
            variant="caption"
            color="$colorMuted"
            $compact={{ display: "none" }}
          >
            {renderedRows.length.toLocaleString()} shown /{" "}
            {rows.length.toLocaleString()} total
          </Text>
          {offlineImport ? (
            <Row gap="$xs">
              <Pill size="sm" label={offlineImport.fileName} tone="info" />
              <IconButton
                icon="X"
                accessibilityLabel={`Close ${offlineImport.fileName} and return to the live feed`}
                onPress={handleLeaveOffline}
                size="sm"
              />
            </Row>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={isImporting}
              onPress={() => void handleImport()}
            >
              {isImporting ? "Importing…" : "Import"}
            </Button>
          )}
          {!offlineImport && (
            <>
              <Button variant="secondary" size="sm" onPress={handlePauseToggle}>
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isClearing}
                onPress={() => void handleClear()}
              >
                {isClearing ? "Clearing…" : "Clear"}
              </Button>
            </>
          )}
        </Row>
      </Row>
      <Row
        aria-label="Row filters"
        flexWrap="wrap"
        gap="$sm"
        padding="$sm"
        backgroundColor="$surface"
        borderBottomWidth={border.hairline}
        borderColor="$borderColor"
      >
        {appClients.length > 1 && (
          <SelectField
            label="App"
            value={clientFilter}
            onValueChange={setClientFilter}
            options={[
              { value: "all", label: "all apps" },
              ...appClients.map((appClient) => ({
                value: appClient.id,
                label: `${appClient.label} · ${appClient.id.slice(0, 8)} (${appClient.rowCount})`,
              })),
            ]}
          />
        )}
        <Row flexWrap="wrap" gap="$xs" flexShrink={1}>
          {observedChannels.map((channel) => (
            <Chip
              key={channel}
              label={channel}
              selected={!hiddenChannels.has(channel)}
              onPress={() => handleChannelToggle(channel)}
            />
          ))}
        </Row>
        <Stack flexGrow={1} minWidth="$column">
          <TextField
            label="Filter rows"
            hideLabel
            role="searchbox"
            value={textFilter}
            onChangeText={setTextFilter}
            placeholder="Filter tag, summary, link id, or payload…"
          />
        </Stack>
        {importMessage && (
          <Text variant="caption" role="status">
            {importMessage}
          </Text>
        )}
      </Row>
      <Row
        flex={1}
        minHeight={0}
        alignItems="stretch"
        gap="$none"
        $compact={{ flexDirection: "column" }}
      >
        <Stack flex={1} minHeight={0} gap="$none">
          <Stack
            aria-label="Inspector row timeline"
            testID="timeline"
            overflow="scroll"
            flex={1}
            minHeight={0}
            gap="$none"
            onScroll={handleTimelineScroll}
            ref={(element) => {
              timelineRef.current =
                element instanceof HTMLDivElement ? element : null;
            }}
          >
            {hiddenRowCount > 0 && (
              <Text variant="caption" color="$colorMuted" padding="$sm">
                …{hiddenRowCount.toLocaleString()} older rows hidden
              </Text>
            )}
            {renderedRows.length === 0 ? (
              <Text variant="label" color="$colorMuted" padding="$lg">
                {rows.length === 0
                  ? offlineImport
                    ? "No valid inspector rows were imported."
                    : isCollecting
                      ? "Waiting for inspector rows…"
                      : "The inspector is off — enable it in Advanced settings, or use Import to view a log file."
                  : "No rows match the current filters."}
              </Text>
            ) : (
              renderedRows.map((row) => (
                <TimelineRow
                  key={row.id}
                  clientLabel={
                    appClients.length > 1
                      ? (clientLabelById.get(row.client) ?? null)
                      : null
                  }
                  isRelated={relatedRowIds.has(row.id)}
                  isSelected={selectedRow?.id === row.id}
                  onSelect={setSelectedRow}
                  row={row}
                />
              ))
            )}
          </Stack>
          {!isFollowing && renderedRows.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              alignSelf="center"
              onPress={handleFollow}
            >
              Follow ↓
            </Button>
          )}
        </Stack>
        {selectedRow && (
          <DetailPane
            onClose={() => setSelectedRow(null)}
            onJumpToRow={handleJumpToRow}
            relatedRows={relatedRows}
            row={selectedRow}
          />
        )}
      </Row>
    </Stack>
  );
}
