import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Input } from "@/shared/components/ui/Input";
import { hitSlop } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import type { TextInputProps } from "react-native";

export type PasswordInputProps = {
  label?: string;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  accessibilityLabel?: string;
} & Pick<TextInputProps, "placeholder" | "autoFocus" | "autoComplete" | "onBlur" | "onSubmitEditing" | "returnKeyType" | "blurOnSubmit" | "textContentType" | "keyboardAppearance">;

export function PasswordInput({
  label,
  error,
  value,
  onChangeText,
  accessibilityLabel,
  placeholder,
  ...inputProps
}: PasswordInputProps) {
  const { colors } = useTheme();
  const [secure, setSecure] = useState(true);

  return (
    <Input
      label={label}
      error={error}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      icon={<Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />}
      right={
        <Ionicons
          accessibilityRole="button"
          accessibilityState={{ expanded: !secure }}
          accessibilityLabel={secure ? "Show password" : "Hide password"}
          name={secure ? "eye-outline" : "eye-off-outline"}
          size={20}
          color={colors.mutedForeground}
          onPress={() => setSecure((current) => !current)}
          hitSlop={hitSlop}
        />
      }
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel ?? (label ? `${label} (password)` : "Password")}
      {...inputProps}
    />
  );
}
