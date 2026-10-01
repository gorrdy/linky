import { Button, ListRow, Row, Stack, StatusDot, Text } from "@linky-fit/ui";
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
    return (
      <Stack
        gap="$lg"
        marginTop="$lg"
        paddingVertical="$xxl"
        $wide={{ marginTop: "$none" }}
      >
        <Text variant="label" color="$colorMuted">
          {t("errorPrefix")}
        </Text>
      </Stack>
    );
  }
  const health = relayHealth.get(selectedRelayUrl);
  const dotState = relayDotState(health);
  const stateLabel =
    dotState === "connected"
      ? t("relayStateConnected")
      : dotState === "checking"
        ? t("relayStateConnecting")
        : t("relayStateUnreachable");
  const lastPublish = health?.lastPublish ?? null;
  return (
    <Stack
      gap="$lg"
      marginTop="$lg"
      paddingVertical="$xxl"
      $wide={{ marginTop: "$none" }}
    >
      <ListRow
        title={
          <>
            <Text variant="label">{selectedRelayUrl}</Text>
          </>
        }
        trailing={
          <>
            <StatusDot
              tone={connectionStatus[dotState].tone}
              accessibilityLabel={dotState}
            />
          </>
        }
      />

      <ListRow
        title={t("relayStatusLabel")}
        trailing={
          <>
            <Text variant="label" color="$colorMuted">
              {stateLabel}
            </Text>
          </>
        }
        testID="relayStatusLabel"
      />

      {health?.state === "unreachable" && health.detail ? (
        <Text variant="label" color="$colorMuted">
          {health.detail}
        </Text>
      ) : null}

      {lastPublish ? (
        <ListRow
          title={t("relayLastPublish")}
          trailing={
            <>
              <Text variant="label" color="$colorMuted">
                {lastPublish.accepted
                  ? t("relayPublishAccepted")
                  : t("relayPublishRejected")}
                {" · "}
                {formatRelativeTime(lastPublish.at, lang)}
              </Text>
            </>
          }
          testID="relayLastPublish"
        />
      ) : null}

      {isRecommendedRelay(selectedRelayUrl) ? (
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
            onPress={requestDeleteSelectedRelay}
            variant={
              pendingRelayDeleteUrl === selectedRelayUrl ? "danger" : "primary"
            }
          >
            {t("delete")}
          </Button>
        </Row>
      )}
    </Stack>
  );
}
