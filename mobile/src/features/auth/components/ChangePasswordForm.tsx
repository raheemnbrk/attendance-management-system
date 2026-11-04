import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { Alert } from "@/shared/components/ui/Alert";
import { AuthCard } from "@/shared/components/auth/AuthCard";
import { AuthTitles } from "@/shared/components/auth/AuthTitles";
import { PrimaryButton } from "@/shared/components/auth/PrimaryButton";
import { toFriendlyMessage } from "@/shared/api/errors";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { useChangePassword } from "@/features/auth/hooks";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import {
  changePasswordFormSchema,
  type ChangePasswordValues,
} from "@/features/auth/schema";

/** How long the success confirmation stays on screen before redirecting. */
const SUCCESS_REDIRECT_DELAY_MS = 1200;

export function ChangePasswordForm() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const change = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

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
      // Show the success confirmation briefly, then continue to the app.
      setSucceeded(true);
      setTimeout(() => {
        router.replace("/(tabs)");
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch (error) {
      setServerError(toFriendlyMessage(error));
    }
  });

  return (
    <AuthCard>
      <AuthTitles
        title="Change password"
        subtitle="Create a new password you will use to sign in"
      />

      <View style={[styles.hint, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
          At least 8 characters, and different from your current password.
        </Text>
      </View>

      {succeeded ? <Alert message="Password updated. Signing you in…" tone="success" /> : null}
      {serverError && !succeeded ? <Alert message={serverError} tone="error" /> : null}

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
            keyboardAppearance={isDark ? "dark" : "light"}
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
            keyboardAppearance={isDark ? "dark" : "light"}
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
            keyboardAppearance={isDark ? "dark" : "light"}
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

      <PrimaryButton
        title={succeeded ? "Password updated" : "Save password"}
        loading={change.isPending}
        disabled={succeeded}
        onPress={handleSubmit}
        accessibilityLabel="Save new password"
        style={styles.submit}
      />
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  hint: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: spacing.sm + 2,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hintText: {
    flex: 1,
    flexShrink: 1,
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  submit: {
    marginTop: spacing.xs,
  },
});
