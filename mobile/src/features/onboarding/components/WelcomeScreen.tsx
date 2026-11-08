import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { AuthScreen } from "@/shared/components/auth/AuthScreen";
import { AuthCard } from "@/shared/components/auth/AuthCard";
import { AuthTitles } from "@/shared/components/auth/AuthTitles";
import { PrimaryButton } from "@/shared/components/auth/PrimaryButton";
import { markWelcomeSeen } from "@/features/onboarding/storage";

export function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleGetStarted = async () => {
    await markWelcomeSeen();
    router.replace("/login");
  };

  return (
    <AuthScreen>
      <View style={styles.brand} accessibilityLabel="Punchin">
        <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
          <View style={[styles.brandRing, { borderColor: colors.primaryForeground }]}>
            <Ionicons name="finger-print" size={22} color={colors.primaryForeground} />
          </View>
        </View>
        <Text style={[styles.brandName, { color: colors.foreground }]}>Punchin</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Check in. Check out. Done.
        </Text>
      </View>

      <AuthCard>
        <View style={styles.cardBody}>
          <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </View>
          <AuthTitles title="Attendance made simple" />
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            Check in and out in seconds. Sign in with the account your employer gave you.
          </Text>
          <PrimaryButton
            title="Get Started"
            onPress={() => {
              void handleGetStarted();
            }}
            accessibilityLabel="Get started, continue to the login screen"
            style={styles.submit}
          />
        </View>
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
  tagline: {
    fontSize: fontSize.md,
  },
  cardBody: {
    alignItems: "center",
    gap: spacing.md,
  },
  cardIcon: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  submit: {
    marginTop: spacing.xs,
    width: "100%",
  },
});
