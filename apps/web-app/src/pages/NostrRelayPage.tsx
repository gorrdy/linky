import { Button, ListRow, Notice, Stack, StatusDot, Text } from "@linky-fit/ui";
import { connectionStatus } from "../utils/connectionStatus";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useRelaySettingsContext } from "../app/context/SystemSettingsContexts";
import { relayDotState, useRelayHealth } from "../app/hooks/useRelayHealth";
import { formatRelativeTime } from "../utils/formatting";
export function NostrRelayPage(): React.ReactElement {
  const {
    isRecommendedRelay,
    pendingRelayDeleteUrl,
    requestDeleteSelectedRelay,
    selectedRelayUrl,
  } = useRelaySettingsContext();
  const relayHealth = useRelayHealth();
  const { lang, t } = useAppShellCore();
  if (!selectedRelayUrl) {
    return <Notice tone="danger" title={t("errorPrefix")} />;
  }
  const health = relayHealth.get(selectedRelayUrl);
  const dotState = relayDotState(health);
  const stateLabel = t(connectionStatus[dotState].labelKey);
  const lastPublish = health?.lastPublish ?? null;
  return (
    <Stack gap="$lg">
      <ListRow
        title={selectedRelayUrl}
        trailing={
          <StatusDot
            tone={connectionStatus[dotState].tone}
            accessibilityLabel={stateLabel}
          />
        }
      />

      <ListRow
        title={t("relayStatusLabel")}
        trailing={
          <Text variant="label" color="$colorMuted">
            {stateLabel}
          </Text>
        }
        testID="relayStatusLabel"
      />

      {health?.state === "unreachable" && health.detail ? (
        <Notice tone="danger" title={health.detail} />
      ) : null}

      {lastPublish ? (
        <ListRow
          title={t("relayLastPublish")}
          trailing={
            <Text variant="label" color="$colorMuted">
              {lastPublish.accepted
                ? t("relayPublishAccepted")
                : t("relayPublishRejected")}
              {" · "}
              {formatRelativeTime(lastPublish.at, lang)}
            </Text>
          }
          testID="relayLastPublish"
        />
      ) : null}

      {isRecommendedRelay(selectedRelayUrl) ? (
        <Text variant="label" color="$colorMuted">
          {t("relayRecommendedNote")}
        </Text>
      ) : (
        <Button
          onPress={requestDeleteSelectedRelay}
          variant={
            pendingRelayDeleteUrl === selectedRelayUrl ? "danger" : "secondary"
          }
        >
          {t("delete")}
        </Button>
      )}
    </Stack>
  );
}
