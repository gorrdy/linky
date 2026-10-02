import type { HTMLAttributes, ReactNode, Ref } from "react";
import { Input, View } from "tamagui";
import { fieldStyle, fieldTrailing } from "./styles";
import { size } from "./tokens";

export interface RichTextInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "contentEditable" | "placeholder" | "style"
> {
  placeholder: string;
  /** Shows the placeholder; the caller owns the editable content. */
  empty: boolean;
  disabled?: boolean | undefined;
  /** A small control inside the field's bottom trailing corner, e.g. send; sized for an `sm` IconButton. */
  trailing?: ReactNode;
  ref?: Ref<HTMLDivElement> | undefined;
}

/** Native has no contentEditable, so a plain multiline input stands in. */
export function RichTextInput({
  placeholder,
  disabled,
  trailing,
}: RichTextInputProps) {
  return (
    <View position="relative">
      <Input
        unstyled
        {...fieldStyle}
        multiline
        minHeight="$controlLg"
        maxHeight="$column"
        paddingRight={
          trailing ? fieldTrailing.textPadding(size.controlSm) : "$md"
        }
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
      />
      {trailing ? (
        <View
          position="absolute"
          right={fieldTrailing.inset}
          bottom={fieldTrailing.inset}
        >
          {trailing}
        </View>
      ) : null}
    </View>
  );
}
