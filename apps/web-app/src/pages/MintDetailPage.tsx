import { parseMintUrl } from "@linky-fit/linkshu";
import { sqliteTrue } from "@linky-fit/linksync";
import {
  Button,
  Divider,
  ListRow,
  Row,
  Section,
  Stack,
  Text,
} from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useMintSettingsContext } from "../app/context/SystemSettingsContexts";
import { holdingOf, mintHoldings } from "../app/lib/mintHoldings";
import { MintBadge } from "../components/MintBadge";
import { MintDeferredReceives } from "../components/MintDeferredReceives";
import { MintFees } from "../components/MintFees";
import { MintIcon } from "../components/MintIcon";
import { MintMoveFundsForm } from "../components/MintMoveFundsForm";
import { navigateTo } from "../hooks/useRouting";
import { LOCAL_MINT_INFO_STORAGE_KEY_PREFIX } from "../utils/constants";
import { normalizeLocale } from "../utils/formatting";
import {
  formatMintLabel,
  isHiddenTestMint,
  MAIN_MINT_URL,
  mintKindBadge,
  normalizeMintUrl,
  PRESET_MINTS,
} from "../utils/mint";
import { safeLocalStorageSetJson } from "../utils/storage";

/** Other mints funds can move to: the default first, then funded mints and presets. */
const moveTargets = (
  sourceMint: string,
  defaultMint: string,
  fundedMints: readonly string[],
  allowTestMints: boolean,
): string[] =>
  [defaultMint, ...fundedMints, ...PRESET_MINTS]
    .map(normalizeMintUrl)
    .filter(
      (mint, index, all) =>
        all.indexOf(mint) === index &&
        mint !== sourceMint &&
        !isHiddenTestMint(mint, allowTestMints),
    );

interface InfoRowProps {
  icon: IconName;
  label: string;
  value: string;
  muted?: boolean;
}

function InfoRow({ icon, label, value, muted = false }: InfoRowProps) {
  return (
    <ListRow
      icon={icon}
      title={label}
      trailing={
        <Text
          variant="label"
          bold
          color={muted ? "$colorMuted" : "$colorSubtle"}
          aria-label={label}
        >
          {value}
        </Text>
      }
    />
  );
}

export function MintDetailPage() {
  const {
    allowTestMints,
    appOwnerIdRef,
    applyDefaultMintSelection,
    cashuIsBusy,
    cashuProofs,
    defaultMintUrl,
    estimateMintMove,
    getMintIconUrl,
    getMintRuntime,
    mintInfoByUrl,
    moveMintFunds,
    pendingMintDeleteUrl,
    refreshMintInfo,
    setMintInfoAll,
    setPendingMintDeleteUrl,
    setStatus,
  } = useMintSettingsContext();
  const { formatDisplayedAmountText, lang, route, t } = useAppShellCore();
  const mintUrl = route.kind === "mint" ? route.mintUrl : "";

  const cleaned = normalizeMintUrl(mintUrl);
  const row = mintInfoByUrl.get(cleaned) ?? null;
  const holdings = mintHoldings(cashuProofs);
  const holding = holdingOf(holdings, cleaned);
  const defaultMint = normalizeMintUrl(defaultMintUrl ?? MAIN_MINT_URL);
  const isDefault = cleaned === defaultMint;

  if (
    parseMintUrl(cleaned) === null ||
    isHiddenTestMint(cleaned, allowTestMints)
  ) {
    return (
      <Stack>
        <Text color="$colorMuted">{t("mintNotFound")}</Text>
      </Stack>
    );
  }

  const fundedMints = [...holdings]
    .filter(([, mintHolding]) => mintHolding.balance > 0)
    .map(([mint]) => mint);

  const runtime = getMintRuntime(cleaned);
  const lastCheckedAtSec = runtime?.lastCheckedAtSec ?? 0;
  const latencyMs = runtime?.latencyMs ?? null;
  const kindBadge = mintKindBadge(cleaned);

  const deleteMint = () => {
    if (pendingMintDeleteUrl !== cleaned) {
      setStatus(t("deleteArmedHint"));
      setPendingMintDeleteUrl(cleaned);
      return;
    }
    const ownerId = appOwnerIdRef.current;
    if (ownerId) {
      setMintInfoAll((prev) => {
        const next = prev.map((mintInfoRow) =>
          normalizeMintUrl(mintInfoRow.url) === cleaned
            ? { ...mintInfoRow, isDeleted: sqliteTrue }
            : mintInfoRow,
        );
        safeLocalStorageSetJson(
          `${LOCAL_MINT_INFO_STORAGE_KEY_PREFIX}.${ownerId}`,
          next,
        );
        return next;
      });
    }
    setPendingMintDeleteUrl(null);
    navigateTo({ route: "mints" });
  };

  return (
    <Stack gap="$lg">
      <Stack gap="$md">
        <Row gap="$sm" paddingBottom="$sm">
          <MintIcon getMintIconUrl={getMintIconUrl} mint={cleaned} size="sm" />
          <Text
            variant="title"
            testID="mint-detail-name"
            numberOfLines={1}
            flexShrink={1}
          >
            {formatMintLabel(cleaned)}
          </Text>
          <Row testID="mint-detail-badges" gap="$sm">
            {isDefault ? <MintBadge kind="default" /> : null}
            {kindBadge !== null ? <MintBadge kind={kindBadge} /> : null}
          </Row>
        </Row>
        {isDefault ? null : (
          <Button
            variant="secondary"
            disabled={cashuIsBusy}
            onPress={() => void applyDefaultMintSelection(cleaned)}
          >
            {t("mintSetAsDefault")}
          </Button>
        )}
      </Stack>

      <Divider />

      <Section title={t("mintFundsTitle")}>
        <InfoRow
          icon="Wallet"
          label={t("mintBalance")}
          value={formatDisplayedAmountText(holding.balance)}
        />
      </Section>

      <MintDeferredReceives mint={cleaned} />

      {holding.balance > 0 ? (
        <>
          <Divider />
          <Section title={t("mintMoveTitle")}>
            <MintMoveFundsForm
              key={cleaned}
              available={holding.balance}
              busy={cashuIsBusy}
              estimateMintMove={estimateMintMove}
              getMintIconUrl={getMintIconUrl}
              moveMintFunds={moveMintFunds}
              sourceMint={cleaned}
              targets={moveTargets(
                cleaned,
                defaultMint,
                fundedMints,
                allowTestMints,
              )}
            />
          </Section>
        </>
      ) : null}

      <Divider />

      <Section title={t("mintFees")}>
        <MintFees mint={cleaned} />
      </Section>

      {row !== null ? (
        <>
          <Divider />
          <Section title={t("mintInfoTitle")}>
            <Stack gap="$lg">
              <InfoRow
                icon="Gauge"
                label={t("mintLatency")}
                value={latencyMs !== null ? `${latencyMs} ms` : t("unknown")}
                muted={latencyMs === null}
              />
              <Button
                variant="secondary"
                onPress={() => void refreshMintInfo(cleaned)}
              >
                {t("mintRefresh")}
              </Button>
              <Button
                variant={
                  pendingMintDeleteUrl === cleaned ? "danger" : "primary"
                }
                onPress={deleteMint}
              >
                {t("mintDelete")}
              </Button>
              {lastCheckedAtSec ? (
                <Text variant="caption" color="$colorMuted">
                  {t("mintLastChecked")}:{" "}
                  {new Date(lastCheckedAtSec * 1000).toLocaleString(
                    normalizeLocale(lang),
                  )}
                </Text>
              ) : null}
            </Stack>
          </Section>
        </>
      ) : null}
    </Stack>
  );
}
