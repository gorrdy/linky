import { IconButton, Stack, size, space, useMedia } from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";

/** Bottom padding that keeps a page's last content clear of the button. */
export const floatingActionButtonClearance = size.controlLg + space.xxxl;

interface FloatingActionButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** Fades the button out, e.g. while the page it belongs to is swiped away. */
  hidden?: boolean;
  guide?: string;
}

/** The round page action in the corner of the page area, above the phone tab bar. */
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
      position="absolute"
      right={wide ? "$xxl" : "$xl"}
      bottom={wide ? "$xxl" : "$xxxl"}
      zIndex="$sticky"
      opacity={hidden ? 0 : 1}
      aria-hidden={hidden}
      transition="base"
      data-safe-area={wide ? undefined : "bottom"}
    >
      <IconButton
        icon={icon}
        accessibilityLabel={label}
        variant="primary"
        size="lg"
        onPress={onPress}
        disabled={hidden}
        pointerEvents={hidden ? "none" : "auto"}
        data-guide={guide}
        tooltip={label}
      />
    </Stack>
  );
}
