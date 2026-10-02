import { Pill } from "@linky-fit/ui";
import { useAppShellCore } from "../app/context/AppShellContexts";
import type { I18nKey } from "../i18n";
import type { MintBadgeKind } from "../utils/mint";

const LABEL_KEY: Record<MintBadgeKind, I18nKey> = {
  default: "defaultMintBadge",
  recommended: "recommendedMintBadge",
  test: "testMintBadge",
};

interface MintBadgeProps {
  kind: MintBadgeKind;
}

export function MintBadge({ kind }: MintBadgeProps) {
  const { t } = useAppShellCore();
  return (
    <Pill
      size="sm"
      label={t(LABEL_KEY[kind])}
      tone={kind === "test" ? "warning" : "accent"}
    />
  );
}
