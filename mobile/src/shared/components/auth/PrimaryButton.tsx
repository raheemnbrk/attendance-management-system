import { Button, type ButtonProps } from "@/shared/components/ui/Button";

export type PrimaryButtonProps = Omit<ButtonProps, "variant" | "size">;

/** The auth screens' primary action: teal pill with a loading spinner while
 * pending. Same primary variant/size as the Change Password screen. */
export function PrimaryButton(props: PrimaryButtonProps) {
  return <Button {...props} variant="primary" size="lg" />;
}
