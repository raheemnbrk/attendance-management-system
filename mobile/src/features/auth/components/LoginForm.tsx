import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { Alert, type AlertTone } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { toFriendlyMessage } from "@/shared/api/errors";
import { fontSize, hitSlop, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { useLogin } from "@/features/auth/hooks";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import {
  loginFormSchema,
  type LoginValues,
} from "@/features/auth/schema";

const NON_EMPLOYEE_MESSAGE = "Admin and employer accounts use the web dashboard";

function errorTone(error: unknown): { tone: AlertTone; message: string } {
  const message = toFriendlyMessage(error);
  if (/awaiting approval|suspended|too many/i.test(message)) {
    return { tone: "warning", message };
  }
  return { tone: "error", message };
}

export function LoginForm() {
  const { colors } = useTheme();
  const router = useRouter();
  const login = useLogin();
  const [serverError, setServerError] = useState<{ tone: AlertTone; message: string } | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    Keyboard.dismiss();
    setServerError(null);
    try {
      const { role, user } = await login.mutateAsync({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (role !== "EMPLOYEE") {
        setServerError({ tone: "info", message: NON_EMPLOYEE_MESSAGE });
        return;
      }

      const href = user.mustChangePassword ? "/change-password" : "/(tabs)";
      router.replace(href);
    } catch (error) {
      setServerError(errorTone(error));
    }
  });

  return (
    <View style={styles.form}>
      <View style={styles.titles}>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in to your account
        </Text>
      </View>

      {serverError ? (
        <Alert message={serverError.message} tone={serverError.tone} />
      ) : null}

      <Controller
        control={form.control}
        name="email"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <Input
            label="Email address"
            accessibilityLabel="Email address"
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="next"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            icon={<Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />}
          />
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <PasswordInput
            label="Password"
            accessibilityLabel="Password"
            placeholder="Your password"
            autoComplete="password"
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

      <Button
        title="Sign in"
        size="lg"
        loading={login.isPending}
        onPress={handleSubmit}
        accessibilityLabel="Sign in"
      />
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
