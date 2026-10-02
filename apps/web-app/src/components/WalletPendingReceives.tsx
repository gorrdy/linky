import { Icon, Pill } from "@linky-fit/ui";
import type React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useMintSettingsContext } from "../app/context/SystemSettingsContexts";
import { navigateTo } from "../hooks/useRouting";
import { normalizeMintUrl } from "../utils/mint";

/** Tokens waiting for their mint; they are not part of the balance above. */
export const WalletPendingReceives = (): React.ReactElement | null => {
  const { cashuDeferredReceives } = useMintSettingsContext();
  const { formatDisplayedAmountText, t } = useAppShellCore();
  if (cashuDeferredReceives.length === 0) return null;

  const total = cashuDeferredReceives.reduce(
    (sum, deferral) => sum + deferral.amount,
    0,
  );
  const mints = [
    ...new Set(
      cashuDeferredReceives.map((deferral) => normalizeMintUrl(deferral.mint)),
    ),
  ];
  const openPending = () =>
    navigateTo(
      mints.length === 1 && mints[0] !== undefined
        ? { route: "mint", mintUrl: mints[0] }
        : { route: "mints" },
    );

  return (
    <Pill
      testID="wallet-pending"
      tone="warning"
      leading={<Icon name="Clock" size="sm" color="$warningText" />}
      label={t("mintPendingAmount").replace(
        "{amount}",
        formatDisplayedAmountText(total),
      )}
      onPress={openPending}
    />
  );
};
