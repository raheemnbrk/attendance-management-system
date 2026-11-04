import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, StyleSheet } from "react-native";
import { Alert, type AlertTone } from "@/shared/components/ui/Alert";
import { AuthCard } from "@/shared/components/auth/AuthCard";
import { AuthTitles } from "@/shared/components/auth/AuthTitles";
import { PrimaryButton } from "@/shared/components/auth/PrimaryButton";
import { Input } from "@/shared/components/ui/Input";
import { ApiError, isNetworkError, isTimeoutError, toFriendlyMessage } from "@/shared/api/errors";
import { spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { useLogin } from "@/features/auth/hooks";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import {
  loginFormSchema,
  type LoginValues,
} from "@/features/auth/schema";

const NON_EMPLOYEE_MESSAGE = "Admin and employer accounts use the web dashboard";
const WAKE_UP_NOTICE_MESSAGE = "Waking up the server, this can take a moment...";
/** The backend runs on a free tier and can take a while to answer the first
 * request; reassure the user instead of spinning silently. */
const WAKE_UP_NOTICE_DELAY_MS = 5000;

type LoginNotice = { tone: AlertTone; message: string } | null;

/** Distinguishes the login failure modes for the inline alert: bad
 * credentials (401), backend account conditions (403, e.g. awaiting
 * approval), unreachable server, everything else shows the server's message. */
function loginNotice(error: unknown): NonNullable<LoginNotice> {
  if (error instanceof ApiError && error.status === 401) {
    return { tone: "error", message: "Incorrect email or password." };
  }
  if (error instanceof ApiError && error.status === 403) {
    return { tone: "warning", message: toFriendlyMessage(error) };
  }
  if (isTimeoutError(error) || isNetworkError(error)) {
    return { tone: "warning", message: toFriendlyMessage(error) };
  }
  const message = toFriendlyMessage(error);
  if (/awaiting approval|suspended|deactivated|too many/i.test(message)) {
    return { tone: "warning", message };
  }
  return { tone: "error", message };
}

export function LoginForm() {
  const { isDark } = useTheme();
  const router = useRouter();
  const login = useLogin();
  const [serverNotice, setServerNotice] = useState<LoginNotice>(null);
  const [wakingUp, setWakingUp] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const email = form.watch("email");
  const password = form.watch("password");
  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = form.handleSubmit(async (values) => {
    Keyboard.dismiss();
    setServerNotice(null);
    setWakingUp(false);
    const wakeUpTimer = setTimeout(() => {
      setWakingUp(true);
    }, WAKE_UP_NOTICE_DELAY_MS);
    try {
      const { role, user } = await login.mutateAsync({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (role !== "EMPLOYEE") {
        setServerNotice({ tone: "info", message: NON_EMPLOYEE_MESSAGE });
        return;
      }

      const href = user.mustChangePassword ? "/change-password" : "/(tabs)";
      router.replace(href);
    } catch (error) {
      setServerNotice(loginNotice(error));
    } finally {
      clearTimeout(wakeUpTimer);
      setWakingUp(false);
    }
  });

  return (
    <AuthCard>
      <AuthTitles title="Welcome back" subtitle="Sign in to your account" />

      {serverNotice ? <Alert message={serverNotice.message} tone={serverNotice.tone} /> : null}
      {wakingUp ? <Alert message={WAKE_UP_NOTICE_MESSAGE} tone="info" /> : null}

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
            textContentType="emailAddress"
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
        name="password"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <PasswordInput
            label="Password"
            accessibilityLabel="Password"
            placeholder="Your password"
            autoComplete="password"
            textContentType="password"
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
        title="Sign in"
        loading={login.isPending}
        disabled={!canSubmit || login.isPending}
        onPress={handleSubmit}
        accessibilityLabel="Sign in"
        style={styles.submit}
      />
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: spacing.xs,
  },
});
