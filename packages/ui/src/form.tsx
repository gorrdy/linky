import { Form as TamaguiForm, isWeb, styled, useFormContext } from "tamagui";
import type { GetProps } from "tamagui";
import { Button } from "./controls";
import type { ButtonProps } from "./controls";

/** A real `<form>` on the web, so Enter submits and password managers see the submit. */
export const Form = styled(TamaguiForm, {
  name: "Form",
  gap: "$md",
  minWidth: 0,
});

export type FormProps = GetProps<typeof Form>;

export type SubmitButtonProps = Omit<ButtonProps, "onPress" | "type">;

/** Submits the enclosing `Form`: a native submit button on the web, a press on native. */
export function SubmitButton(props: SubmitButtonProps) {
  const { onSubmit } = useFormContext();
  return (
    <Button
      {...props}
      {...(isWeb ? { type: "submit" } : { onPress: onSubmit })}
    />
  );
}
