import { Notice, Stack } from "@linky-fit/ui";
import type { NoticeProps } from "@linky-fit/ui";

/** An app-wide solid notice pinned to the top edge, above the top bar. */
export function TopBanner(props: Omit<NoticeProps, "solid" | "tone">) {
  return (
    <Stack
      position="fixed"
      top="$none"
      left="$none"
      right="$none"
      zIndex="$overlay"
      pointerEvents="box-none"
      data-safe-area="top"
    >
      <Stack padding="$sm">
        <Notice solid {...props} />
      </Stack>
    </Stack>
  );
}
