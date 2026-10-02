import { IconButton, Stack, space, useMedia } from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";
import { tooltip } from "../utils/tooltip";

interface FloatingActionButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

/** The round page action: above the phone tab bar, in the corner of the desktop pane. */
export function FloatingActionButton({
  icon,
  label,
  onPress,
}: FloatingActionButtonProps) {
  const { wide } = useMedia();
  return (
    <Stack
      position={wide ? "absolute" : "fixed"}
      right={wide ? "$xxl" : "$xl"}
      bottom={wide ? "$xxl" : space.huge * 2}
      zIndex="$sticky"
      data-safe-area={wide ? undefined : "bottom"}
    >
      <IconButton
        icon={icon}
        accessibilityLabel={label}
        variant="primary"
        size="lg"
        onPress={onPress}
        {...tooltip(label)}
      />
    </Stack>
  );
}
