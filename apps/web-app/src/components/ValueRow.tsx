import { ListRow, Text } from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";

interface ValueRowProps {
  label: string;
  value: string;
  icon?: IconName | undefined;
  testID?: string | undefined;
}

/** A key/value line; the value carries the label as its accessible name. */
export function ValueRow({ label, value, icon, testID }: ValueRowProps) {
  return (
    <ListRow
      testID={testID}
      icon={icon}
      title={label}
      trailing={
        <Text variant="label" color="$colorMuted" aria-label={label}>
          {value}
        </Text>
      }
    />
  );
}
