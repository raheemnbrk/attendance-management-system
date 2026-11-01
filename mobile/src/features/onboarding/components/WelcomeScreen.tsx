import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { brand } from "@/shared/theme/colors";
import { markWelcomeSeen } from "@/features/onboarding/storage";

export function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGetStarted = async () => {
    await markWelcomeSeen();
    router.replace("/login");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[brand.teal, brand.tealDeep, brand.tealDark]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content} accessibilityRole="header">
        <View style={styles.logoRing} accessibilityLabel="Punchin logo">
          <Ionicons name="time-outline" size={30} color={brand.onTeal} />
          <View style={styles.fingerprintBadge}>
            <Ionicons name="finger-print-outline" size={14} color={brand.teal} />
          </View>
        </View>

        <Text style={styles.logo}>Punchin</Text>
        <Text style={styles.tagline}>Check in. Check out. Done.</Text>
      </View>

      <View style={styles.illustration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.illustrationGlow} />
        <View style={styles.illustrationCard}>
          <View style={styles.phoneShape}>
            <Ionicons name="finger-print" size={40} color={brand.teal} />
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color={brand.onTeal} />
            </View>
          </View>
          <View style={styles.waveOne} />
          <View style={styles.waveTwo} />
          <View style={[styles.spark, styles.sparkA]} />
          <View style={[styles.spark, styles.sparkB]} />
          <View style={[styles.spark, styles.sparkC]} />
        </View>
        <View style={styles.plant}>
          <Ionicons name="leaf-outline" size={22} color={brand.onTeal} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get started, continue to the login screen"
          onPress={handleGetStarted}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.buttonLabel}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color={brand.teal} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    marginTop: spacing.xxxl + spacing.xxxl,
  },
  logoRing: {
    alignItems: "center",
    borderColor: brand.onTeal,
    borderRadius: radius.full,
    borderWidth: 3,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  fingerprintBadge: {
    backgroundColor: brand.onTeal,
    borderRadius: radius.full,
    bottom: -4,
    height: 20,
    position: "absolute",
    right: -6,
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    color: brand.onTeal,
    fontSize: fontSize.display,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginTop: spacing.lg,
  },
  tagline: {
    color: brand.onTealMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  illustration: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  illustrationGlow: {
    backgroundColor: brand.onTealFaint,
    borderRadius: radius.full,
    height: 200,
    width: 200,
    position: "absolute",
  },
  illustrationCard: {
    alignItems: "center",
    backgroundColor: brand.onTealFaint,
    borderRadius: radius.lg * 2,
    height: 220,
    justifyContent: "center",
    overflow: "hidden",
    width: 280,
  },
  phoneShape: {
    alignItems: "center",
    backgroundColor: brand.onTeal,
    borderColor: brand.tealDeep,
    borderRadius: radius.lg,
    borderWidth: 4,
    height: 92,
    justifyContent: "center",
    width: 64,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: brand.teal,
    borderColor: brand.onTeal,
    borderRadius: radius.full,
    borderWidth: 2,
    bottom: -10,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    width: 22,
  },
  waveOne: {
    borderColor: brand.onTealFaint,
    borderRadius: radius.full,
    borderWidth: 8,
    height: 150,
    position: "absolute",
    right: -46,
    width: 150,
  },
  waveTwo: {
    borderColor: brand.onTealFaint,
    borderRadius: radius.full,
    borderWidth: 16,
    bottom: -30,
    height: 140,
    left: -40,
    position: "absolute",
    width: 140,
  },
  spark: {
    backgroundColor: brand.onTeal,
    borderRadius: radius.full,
    height: 8,
    position: "absolute",
    width: 8,
  },
  sparkA: {
    left: 40,
    top: 52,
  },
  sparkB: {
    right: 56,
    top: 36,
    height: 5,
    width: 5,
  },
  sparkC: {
    bottom: 44,
    left: 64,
    height: 5,
    width: 5,
  },
  plant: {
    position: "absolute",
    bottom: -2,
    right: 26,
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
  button: {
    alignItems: "center",
    backgroundColor: brand.onTeal,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.sm,
    height: 58,
    justifyContent: "center",
    width: "100%",
  },
  buttonLabel: {
    color: brand.teal,
    fontSize: fontSize.md + 1,
    fontWeight: "700",
  },
});
