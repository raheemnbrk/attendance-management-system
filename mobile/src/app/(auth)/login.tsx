import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Screen } from "@/shared/components/layout/Screen";
import { env } from "@/shared/lib/env";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export default function LoginRoute() {
  const { colors } = useTheme();

  return (
    <Screen scroll keyboard padded>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.brand} accessibilityLabel="Punchin">
          <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
            <View style={[styles.brandRing, { borderColor: colors.primaryForeground }]}>
              <Ionicons name="finger-print" size={22} color={colors.primaryForeground} />
            </View>
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>Punchin</Text>
        </View>
        <LoginForm />
        {__DEV__ ? (
          <Text style={[styles.devApi, { color: colors.mutedForeground }]}>
            API: {env.apiBaseUrl}
          </Text>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    marginTop: spacing.xxxl,
  },
  brandBadge: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  brandRing: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 2,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  brandName: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  devApi: {
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});
