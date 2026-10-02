import {
  Button,
  CameraPreview,
  Dialog,
  IconButton,
  MediaFrame,
  Progress,
  Row,
  Stack,
  Text,
} from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";
import React from "react";
import {
  useAppShellActions,
  useAppShellCore,
} from "../app/context/AppShellContexts";
import { useInspectorEmissionEnabled } from "../devtools/inspector/inspectorEnabled";
import { useDesktopSplitView } from "../hooks/useDesktopSplitView";
import { navigateTo } from "../hooks/useRouting";

interface ScanAction {
  icon: IconName;
  label: string;
  onPress: () => void;
}

export function ScanModal(): React.ReactElement {
  const {
    closeScan,
    cycleScanCamera,
    openIssueTokenFromScan: onIssueToken,
    onPickScanImage,
    openManualPayFromScan: onTypePayment,
    openManualContactFromScan: onTypeManually,
    pasteScanValue,
  } = useAppShellActions();
  const {
    scanDiagnostics,
    scanCanSwitchCamera,
    scanEntryPoint,
    scanVideoRef,
    scanAllowsManualContact: showTypeAction,
    t,
  } = useAppShellCore();
  const isDesktopSplitView = useDesktopSplitView();
  // What the camera decodes is developer information; the progress of an
  // animation is not, so only the detail line waits for the inspector.
  const showScanDiagnostics = useInspectorEmissionEnabled();
  const animation = scanDiagnostics.animation;
  const animationFraction =
    animation === null || animation.expected === null
      ? 0
      : animation.received / animation.expected;
  const isReceiveScan = scanEntryPoint === "receive";
  const isSendScan = scanEntryPoint === "send";
  const handleClose = React.useCallback(() => {
    closeScan();
    if (isReceiveScan) {
      navigateTo({ route: "wallet" });
    }
  }, [closeScan, isReceiveScan]);
  const title =
    scanEntryPoint === "contacts"
      ? t("contactsScanContactQr")
      : scanEntryPoint === "receive"
        ? t("walletReceive")
        : scanEntryPoint === "send"
          ? t("walletSend")
          : t("scan");

  const animationHeadline =
    animation === null
      ? null
      : animation.expected === null
        ? t("scanAnimatedQrDetected")
        : t("scanAnimatedQrProgress")
            .replace("{received}", String(animation.received))
            .replace("{expected}", String(animation.expected))
            .replace("{percent}", String(Math.round(animationFraction * 100)));

  const typeManually: ScanAction = {
    icon: "Keyboard",
    label: t("scanTypeManually"),
    onPress: onTypeManually,
  };
  const paste: ScanAction = {
    icon: "Copy",
    label: t("paste"),
    onPress: () => void pasteScanValue(),
  };
  const setAmount: ScanAction = {
    icon: "ArrowDownToLine",
    label: t("topupSetAmount"),
    onPress: () => {
      closeScan();
      navigateTo({ route: "topup" });
    },
  };
  const issueToken: ScanAction = {
    icon: "BadgePlus",
    label: t("cashuEmit"),
    onPress: onIssueToken,
  };
  const gallery: ScanAction = {
    icon: "Images",
    label: t("scanGallery"),
    onPress: onPickScanImage,
  };
  const actions = [
    ...(showTypeAction ? [typeManually] : []),
    paste,
    ...(isReceiveScan
      ? [setAmount, gallery]
      : isSendScan
        ? [issueToken, gallery]
        : showTypeAction
          ? []
          : [gallery]),
  ];

  const content = (
    <>
      <Row justifyContent="space-between" data-scan-region="header">
        <Text variant="label" bold>
          {title}
        </Text>
        <IconButton
          icon="X"
          size="sm"
          accessibilityLabel={t("close")}
          onPress={handleClose}
        />
      </Row>

      <MediaFrame accessibilityLabel={t("scanCameraPreview")} fill>
        <CameraPreview videoRef={scanVideoRef} />
        {scanCanSwitchCamera ? (
          <Stack position="absolute" right="$md" bottom="$md">
            <Button
              variant="secondary"
              size="sm"
              icon="SwitchCamera"
              onPress={cycleScanCamera}
            >
              {t("scanSwitchCamera")}
            </Button>
          </Stack>
        ) : null}
      </MediaFrame>

      <Stack
        gap="$sm"
        width="100%"
        maxWidth="$sheetWidth"
        alignSelf="center"
        data-scan-region="footer"
      >
        {animationHeadline === null && !showScanDiagnostics ? null : (
          <Stack role="status" gap="$xs">
            {animationHeadline === null ? null : (
              <>
                <Progress
                  value={animationFraction}
                  accessibilityLabel={animationHeadline}
                />
                <Text variant="label" textAlign="center">
                  {animationHeadline}
                </Text>
              </>
            )}
            {showScanDiagnostics ? (
              <Text
                variant="caption"
                mono
                color="$colorMuted"
                textAlign="center"
              >
                {t("scanDiagnosticsReads").replace(
                  "{reads}",
                  String(scanDiagnostics.reads),
                )}
                {scanDiagnostics.lastValue
                  ? ` · ${scanDiagnostics.lastValue}…`
                  : ""}
                {scanDiagnostics.lastRejection
                  ? ` · ${scanDiagnostics.lastRejection}`
                  : ""}
              </Text>
            ) : null}
          </Stack>
        )}
        {isSendScan ? (
          <Button
            variant="secondary"
            justifyContent="flex-start"
            onPress={onTypePayment}
          >
            {t("manualPayOpen")}
          </Button>
        ) : null}
        <Row gap="$sm">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              icon={action.icon}
              flex={1}
              onPress={action.onPress}
            >
              {action.label}
            </Button>
          ))}
        </Row>
      </Stack>
    </>
  );

  if (isDesktopSplitView) {
    return (
      <Stack
        role="dialog"
        aria-label={title}
        flex={1}
        padding="$xl"
        backgroundColor="$background"
      >
        {content}
      </Stack>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      title={title}
      hideTitle
      fullScreen
    >
      {content}
    </Dialog>
  );
}
