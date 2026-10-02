import { useId } from "react";
import { getVariableValue, useTheme } from "tamagui";
import { FieldFrame } from "./fields";
import type { SelectFieldProps } from "./select-field";
import { border, fontFamily, radius, size, space, typography } from "./tokens";

export function SelectField<T extends string>({
  label,
  hideLabel,
  value,
  options,
  onValueChange,
  disabled,
}: SelectFieldProps<T>) {
  const id = useId();
  const theme = useTheme();
  return (
    <FieldFrame id={id} label={label} hideLabel={hideLabel} disabled={disabled}>
      <select
        id={id}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = options.find(
            (option) => option.value === event.target.value,
          );
          if (next) onValueChange(next.value);
        }}
        style={{
          minHeight: size.control,
          width: "100%",
          padding: space.md,
          borderRadius: radius.control,
          border: `${border.hairline}px solid transparent`,
          background: getVariableValue(theme.neutralSoft),
          color: getVariableValue(theme.color),
          fontFamily: fontFamily.body,
          fontSize: typography.size.body,
          lineHeight: `${typography.lineHeight.body}px`,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}
