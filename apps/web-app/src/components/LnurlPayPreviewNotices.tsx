import { Text } from "@linky-fit/ui";
import type { FC } from "react";
import type { LnurlPayPreview } from "../lnurlPay";
import type { Translate } from "../i18n";

interface LnurlPayPreviewNoticesProps {
  error: string | null;
  loading: boolean;
  preview: LnurlPayPreview | null;
  t: Translate;
}

/** Loading/error state and amount constraints of an LNURL-pay target. */
export const LnurlPayPreviewNotices: FC<LnurlPayPreviewNoticesProps> = ({
  error,
  loading,
  preview,
  t,
}) => {
  if (loading) {
    return <Text color="$colorMuted">{t("lnurlPayLoading")}</Text>;
  }
  if (error) {
    return (
      <Text color="$colorMuted">
        {t("lnurlPayLoadFailed")}: {error}
      </Text>
    );
  }
  if (!preview) return null;

  const isFixedAmount = preview.minSendableSat === preview.maxSendableSat;

  return (
    <>
      {preview.description ? (
        <Text color="$colorMuted">{preview.description}</Text>
      ) : null}
      <Text color="$colorMuted">
        {isFixedAmount
          ? t("lnurlPayFixedHint").replace(
              "{amount}",
              String(preview.minSendableSat),
            )
          : t("lnurlPayRangeHint")
              .replace("{min}", String(preview.minSendableSat))
              .replace("{max}", String(preview.maxSendableSat))}
      </Text>
    </>
  );
};
