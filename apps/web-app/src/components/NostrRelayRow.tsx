import { ListRow, Stack, Text, StatusDot, Pill } from "@linky-fit/ui";
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
        <StatusDot
          tone={connectionStatus[state].tone}
          accessibilityLabel={state}
        />
      }
      onPress={() => navigateTo({ route: "nostrRelay", id: url })}
    />
  );
}
