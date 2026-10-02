import { Button, Dialog, Stack, Text } from "@linky-fit/ui";
import type { ReactNode } from "react";
import { tooltip } from "../utils/tooltip";
import { WalletBalance } from "./WalletBalance";

interface PaymentConfirmDialogProps {
  amountSat: number | null;
  cancelLabel: string;
  confirmLabel: string;
  description: ReactNode;
  disabled?: boolean;
  disabledReason?: string;
  isBusy: boolean;
  label: string;
  meta?: ReactNode;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  unknownAmountLabel?: string;
}

const caption = (content: ReactNode, bold = false) =>
  typeof content === "string" ? (
    <Text variant="caption" bold={bold} color="$colorMuted" textAlign="center">
      {content}
    </Text>
  ) : (
    content
  );

export function PaymentConfirmDialog({
  amountSat,
  cancelLabel,
  confirmLabel,
  description,
  disabled = false,
  disabledReason,
  isBusy,
  label,
  meta,
  onClose,
  onConfirm,
  unknownAmountLabel,
}: PaymentConfirmDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={label}
      hideTitle
      actions={
        <>
          <Button
            onPress={() => void onConfirm()}
            disabled={isBusy || disabled}
            {...tooltip(disabledReason)}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" onPress={onClose} disabled={isBusy}>
            {cancelLabel}
          </Button>
        </>
      }
    >
      <Stack alignItems="center" gap="$sm" paddingBottom="$lg">
        {amountSat === null ? (
          <Text variant="heading" color="$color" textAlign="center">
            {unknownAmountLabel}
          </Text>
        ) : (
          <WalletBalance ariaLabel={label} balance={amountSat} />
        )}
        {description ? caption(description) : null}
        {meta ? caption(meta, true) : null}
      </Stack>
    </Dialog>
  );
}
