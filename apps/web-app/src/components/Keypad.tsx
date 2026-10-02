import { Keypad as UiKeypad } from "@linky-fit/ui";

interface KeypadProps {
  ariaLabel: string;
  decimalKeyEnabled?: boolean;
  disabled: boolean;
  onKeyPress: (key: string) => void;
  translations: {
    clearForm: string;
    decimalPoint: string;
    delete: string;
  };
}

export function Keypad({
  ariaLabel,
  decimalKeyEnabled = false,
  disabled,
  onKeyPress,
  translations,
}: KeypadProps) {
  return (
    <UiKeypad
      accessibilityLabel={ariaLabel}
      decimal={decimalKeyEnabled}
      disabled={disabled}
      onKeyPress={onKeyPress}
      labels={{
        clear: translations.clearForm,
        decimal: translations.decimalPoint,
        delete: translations.delete,
      }}
    />
  );
}
