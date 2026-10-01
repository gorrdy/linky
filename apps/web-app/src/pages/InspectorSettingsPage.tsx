import { Icon, ListRow, Switch } from "@linky-fit/ui";
import React, { useEffect, useState } from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useAdvancedSettingsContext } from "../app/context/SystemSettingsContexts";
import {
  setInspectorEnabled,
  setInspectorLogsEnabled,
  useInspectorEnabled,
  useInspectorLogsEnabled,
} from "../devtools/inspector/inspectorEnabled";
import type { PersistentInspectorLogStats } from "../devtools/inspector/persistentInspectorLogBuffer";
import { navigateTo } from "../hooks/useRouting";
import { formatBytes } from "../utils/formatting";

const formatInspectorLogAge = (
  oldestAt: number | null,
  now: number,
): string => {
  if (oldestAt === null) return "—";
  const ageSeconds = Math.max(0, Math.floor((now - oldestAt) / 1_000));
  if (ageSeconds < 60) return `${ageSeconds}s`;
  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageMinutes < 60) return `${ageMinutes}m`;
  return `${Math.floor(ageMinutes / 60)}h`;
};

export function InspectorSettingsPage(): React.ReactElement {
  const inspectorEnabled = useInspectorEnabled();
  const inspectorLogsEnabled = useInspectorLogsEnabled();
  const { pushToast } = useAdvancedSettingsContext();
  const { t } = useAppShellCore();

  const [inspectorLogStats, setInspectorLogStats] =
    useState<PersistentInspectorLogStats | null>(null);
  const [inspectorLogActionIsBusy, setInspectorLogActionIsBusy] =
    useState(false);

  const inspectorLogStatsLabel = inspectorLogStats
    ? t("nostrInspectorLogsStats")
        .replace("{count}", String(inspectorLogStats.rowCount))
        .replace("{size}", formatBytes(inspectorLogStats.totalSize))
        .replace(
          "{age}",
          formatInspectorLogAge(inspectorLogStats.oldestAt, Date.now()),
        )
    : t("nostrInspectorLogsLoading");

  useEffect(() => {
    if (!inspectorLogsEnabled) {
      setInspectorLogStats(null);
      return;
    }

    let active = true;
    let unsubscribe = (): void => undefined;
    void import("../devtools/inspector/persistentInspectorLogSink")
      .then(
        async ({
          initializePersistentInspectorLogs,
          subscribePersistentInspectorLogs,
        }) => {
          if (!active) return;
          unsubscribe = subscribePersistentInspectorLogs((stats) => {
            if (active) setInspectorLogStats(stats);
          });
          const stats = await initializePersistentInspectorLogs();
          if (active) setInspectorLogStats(stats);
        },
      )
      .catch(() => {
        if (active) pushToast(t("nostrInspectorLogsError"));
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [inspectorLogsEnabled, pushToast, t]);

  const downloadInspectorLogs = async (): Promise<void> => {
    setInspectorLogActionIsBusy(true);
    try {
      const { downloadPersistentInspectorLogs } =
        await import("../devtools/inspector/persistentInspectorLogSink");
      await downloadPersistentInspectorLogs();
      pushToast(t("nostrInspectorLogsDownloaded"));
    } catch {
      pushToast(t("nostrInspectorLogsError"));
    } finally {
      setInspectorLogActionIsBusy(false);
    }
  };

  const clearInspectorLogs = async (): Promise<void> => {
    setInspectorLogActionIsBusy(true);
    try {
      const { clearPersistentInspectorLogs } =
        await import("../devtools/inspector/persistentInspectorLogSink");
      await clearPersistentInspectorLogs();
      pushToast(t("nostrInspectorLogsCleared"));
    } catch {
      pushToast(t("nostrInspectorLogsError"));
    } finally {
      setInspectorLogActionIsBusy(false);
    }
  };

  return (
    <section className="panel settings-page">
      <div className="settings-section">
        <ListRow
          leading={<Icon name="Bug" />}
          title={t("nostrInspector")}
          trailing={
            <Switch
              accessibilityLabel={t("nostrInspector")}
              value={inspectorEnabled}
              onValueChange={setInspectorEnabled}
            />
          }
        />

        <ListRow
          leading={<Icon name="Bug" />}
          title={t("openNostrInspector")}
          onPress={() => navigateTo({ route: "advancedInspectorTimeline" })}
        />
      </div>

      <div className="settings-section">
        <ListRow
          leading={<Icon name="Bug" />}
          title={t("nostrInspectorLogs")}
          trailing={
            <Switch
              accessibilityLabel={t("nostrInspectorLogs")}
              value={inspectorLogsEnabled}
              onValueChange={setInspectorLogsEnabled}
            />
          }
        />

        {inspectorLogsEnabled ? (
          <div className="inspector-log-stats" aria-live="polite">
            {inspectorLogStatsLabel}
          </div>
        ) : null}

        <ListRow
          leading={<Icon name="Download" />}
          title={t("downloadNostrInspectorLogs")}
          onPress={() => void downloadInspectorLogs()}
          disabled={
            !inspectorLogsEnabled ||
            inspectorLogActionIsBusy ||
            !inspectorLogStats?.rowCount
          }
        />

        <ListRow
          leading={<Icon name="Trash2" />}
          title={t("clearNostrInspectorLogs")}
          onPress={() => void clearInspectorLogs()}
          disabled={
            !inspectorLogsEnabled ||
            inspectorLogActionIsBusy ||
            !inspectorLogStats?.rowCount
          }
        />
      </div>

      <div className="settings-section">
        <ListRow
          leading={<Icon name="FlaskConical" />}
          title="Push / SW Debug (log)"
          onPress={() => navigateTo({ route: "advancedPushDebug" })}
        />
      </div>
    </section>
  );
}
