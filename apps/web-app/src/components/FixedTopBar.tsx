import { Stack, TopBar } from "@linky-fit/ui";
import type { TopBarProps } from "@linky-fit/ui";

/** The phone top bar, pinned to the viewport above the scrolling page. */
export function FixedTopBar(props: TopBarProps) {
  return (
    <Stack
      position="fixed"
      top="$none"
      left="$none"
      right="$none"
      zIndex="$sticky"
      backgroundColor="$background"
      data-safe-area="top"
    >
      <TopBar {...props} />
    </Stack>
  );
}
