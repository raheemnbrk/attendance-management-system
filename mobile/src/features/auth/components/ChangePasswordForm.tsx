import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { toFriendlyMessage } from "@/shared/api/errors";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { useChangePassword } from "@/features/auth/hooks";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import {
  changePasswordFormSchema,
  type ChangePasswordValues,
} from "@/features/auth/schema";

export function ChangePasswordForm() {
  const { colors } = useTheme();
  const router = useRouter();
  const change = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    Keyboard.dismiss();
    setServerError(null);
    try {
      await change.mutateAsync(values);
      router.replace("/(tabs)");
    } catch (error) {
      setServerError(toFriendlyMessage(error));
    }
  });

  const title = "Change password";
  const subtitle = "Create a new password you will use to sign in";

  return (
    <View style={styles.form}>
      <View style={styles.titles}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>

      {serverError ? <Alert message={serverError} tone="error" /> : null}

      <Controller
        control={form.control}
        name="currentPassword"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <PasswordInput
            label="Current password"
            accessibilityLabel="Current password"
            placeholder="Your current password"
            autoComplete="password"
            returnKeyType="next"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="newPassword"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <PasswordInput
            label="New password"
            accessibilityLabel="New password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            returnKeyType="next"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <PasswordInput
            label="Confirm new password"
            accessibilityLabel="Confirm new password"
            placeholder="Repeat the new password"
            autoComplete="new-password"
            returnKeyType="done"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            onSubmitEditing={() => {
              void handleSubmit();
            }}
          />
        )}
      />

      <Button title="Save password" size="lg" loading={change.isPending} onPress={handleSubmit} accessibilityLabel="Save new password" />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    width: "100%",
  },
  titles: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: fontSize.md,
  },
});
