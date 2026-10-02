import { Badge, ListRow, Row, Stack, StatusDot, Text } from "@linky-fit/ui";
import { useAppShellCore } from "../app/context/AppShellContexts";
import type { RelayDotState } from "../app/hooks/useRelayHealth";
import { navigateTo } from "../hooks/useRouting";

import { connectionStatus } from "../utils/connectionStatus";

interface NostrRelayRowProps {
  detail: string | null;
  label: string | null;
  state: RelayDotState;
  url: string;
}

export function NostrRelayRow({
  detail,
  label,
  state,
  url,
}: NostrRelayRowProps) {
  const { t } = useAppShellCore();
  const stateLabel = t(connectionStatus[state].labelKey);
  return (
    <ListRow
      title={url}
      description={
        <Stack gap="$xxs">
          {label ? <Pill size="sm" label={label} /> : null}
          {detail ? (
            <Text variant="caption" color="$colorMuted">
              {detail}
            </Text>
          ) : null}
        </Stack>
      }
      trailing={
        <Row gap="$sm">
          <StatusDot
            tone={connectionStatus[state].tone}
            accessibilityLabel={stateLabel}
          />
          <Text variant="label" color="$colorMuted">
            {stateLabel}
          </Text>
        </Row>
      }
      onPress={() => navigateTo({ route: "nostrRelay", id: url })}
    />
  );
}
