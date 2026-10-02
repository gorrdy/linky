import { IconButton, Stack, space, useMedia } from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";

interface FloatingActionButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** Fades the button out, e.g. while the page it belongs to is swiped away. */
  hidden?: boolean;
  guide?: string;
}

/** The round page action: above the phone tab bar, in the corner of the desktop pane. */
export function FloatingActionButton({
  icon,
  label,
  onPress,
  hidden = false,
  guide,
}: FloatingActionButtonProps) {
  const { wide } = useMedia();
  return (
    <Stack
      position={wide ? "absolute" : "fixed"}
      right={wide ? "$xxl" : "$xl"}
      bottom={wide ? "$xxl" : space.huge * 2}
      zIndex="$sticky"
      opacity={hidden ? 0 : 1}
      pointerEvents={hidden ? "none" : "auto"}
      transition="base"
      data-safe-area={wide ? undefined : "bottom"}
    >
      <IconButton
        icon={icon}
        accessibilityLabel={label}
        variant="primary"
        size="lg"
        onPress={onPress}
        data-guide={guide}
        tooltip={label}
      />
    </Stack>
  );
}
