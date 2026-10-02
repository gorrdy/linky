import { useId, useState } from "react";
import { Pressable } from "./controls";
import { FieldFrame } from "./fields";
import { fieldStyle } from "./styles";
import { Icon } from "./icons";
import { Text } from "./layout";
import { ListRow } from "./lists";
import { Sheet } from "./overlays";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean | undefined;
}

export interface SelectFieldProps<T extends string = string> {
  label: string;
  hideLabel?: boolean | undefined;
  value: T;
  options: readonly SelectOption<T>[];
  onValueChange: (value: T) => void;
  disabled?: boolean | undefined;
}

export function SelectField<T extends string>({
  label,
  hideLabel,
  value,
  options,
  onValueChange,
  disabled,
}: SelectFieldProps<T>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <FieldFrame id={id} label={label} hideLabel={hideLabel} disabled={disabled}>
      <Pressable
        id={id}
        aria-label={label}
        aria-haspopup="listbox"
        disabled={disabled}
        onPress={() => setOpen(true)}
        {...fieldStyle}
        justifyContent="space-between"
      >
        <Text numberOfLines={1}>
          {options.find((option) => option.value === value)?.label ?? ""}
        </Text>
        <Icon name="ChevronDown" color="$colorMuted" />
      </Pressable>
      <Sheet open={open} onOpenChange={setOpen} title={label}>
        {options.map((option) => (
          <ListRow
            key={option.value}
            title={option.label}
            selected={option.value === value}
            disabled={option.disabled}
            chevron={false}
            onPress={() => {
              onValueChange(option.value);
              setOpen(false);
            }}
          />
        ))}
      </Sheet>
    </FieldFrame>
  );
}
