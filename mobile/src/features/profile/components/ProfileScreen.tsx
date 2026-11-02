import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Card } from "@/shared/components/ui/Card";
import { ListItem } from "@/shared/components/ui/ListItem";
import { SegmentedControl } from "@/shared/components/ui/SegmentedControl";
import { Header } from "@/shared/components/layout/Header";
import { Screen } from "@/shared/components/layout/Screen";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { themeSchemeValues } from "@/features/profile/schema";
import type { AppUser } from "@/shared/types";
import type { SegmentedOption } from "@/shared/components/ui/SegmentedControl";

export type ProfileScreenProps = {
  user: AppUser | null;
  onPressChangePassword?: () => void;
  onLogout?: () => void;
  loggingOut?: boolean;
};

type ThemeOption = SegmentedOption<(typeof themeSchemeValues)[number]> & {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: "sunny-outline",
    activeIcon: "sunny",
  },
  {
    value: "dark",
    label: "Dark",
    icon: "moon-outline",
    activeIcon: "moon",
  },
  {
    value: "system",
    label: "System",
    icon: "phone-portrait-outline",
    activeIcon: "phone-portrait",
  },
];

function initials(name: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "—";
  const letters = trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());
  return letters.join("") || "?";
}

/** Company if present, otherwise the employer name, otherwise a fallback. */
function employerLabel(user: AppUser | null): string {
  const employer = user?.employer ?? null;
  const company = employer?.company?.trim();
  if (company) return company;
  const name = employer?.name.trim();
  if (name) return name;
  return "Not assigned";
}

export function ProfileScreen({
  user,
  onPressChangePassword,
  onLogout,
  loggingOut = false,
}: ProfileScreenProps) {
  const { colors, scheme, setScheme } = useTheme();

  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to sign out of Punchin?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => onLogout?.(),
      },
    ]);
  };

  return (
    <Screen scroll padded>
      <Header title="Profile" />

      {/* Identity card */}
      <Card style={styles.identity} padding={spacing.xl}>
        <View
          style={[styles.avatar, { backgroundColor: colors.primary }]}
          accessibilityLabel={`Signed in as ${user?.name ?? "unknown"}`}
        >
          <Text style={[styles.avatarInitials, { color: colors.primaryForeground }]}>
            {initials(user?.name ?? null)}
          </Text>
        </View>
        <View style={styles.identityTexts}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {user?.name ?? "—"}
          </Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
            {user?.email ?? "—"}
          </Text>
        </View>
      </Card>

      {/* Department and employer tiles: equal width and height, values on one
      line with ellipsis so long names cannot break the layout */}
      <View style={styles.tilesRow}>
        <Tile
          icon="briefcase-outline"
          label="Department"
          value={user?.department ?? "—"}
        />
        <Tile
          icon="business-outline"
          label="Employer"
          value={employerLabel(user)}
        />
      </View>

      {/* Theme selector */}
      <Card padding={spacing.xl} style={styles.themeCard}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>App theme</Text>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={scheme}
          onChange={setScheme}
          accessibilityLabel="App theme"
        />
      </Card>

      {/* Preferences and session rows */}
      <Card padding="none" style={styles.rowsCard}>
        <ListItem
          icon="lock-closed-outline"
          title="Change password"
          subtitle="Update your sign-in password"
          onPress={onPressChangePassword}
          chevron
          accessibilityLabel="Change password"
          style={styles.row}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ListItem
          icon="log-out-outline"
          title="Log out"
          danger
          onPress={confirmLogout}
          accessibilityLabel="Log out from Punchin"
          style={styles.row}
        />
      </Card>

      {loggingOut ? (
        <Text style={[styles.loggingOutNote, { color: colors.mutedForeground }]}>
          Signing out…
        </Text>
      ) : null}

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        Punchin v{APP_VERSION}
      </Text>
    </Screen>
  );
}

function Tile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.tile} padding={spacing.xl}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.tileLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[styles.tileValue, { color: colors.foreground }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  avatar: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  avatarInitials: {
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  identityTexts: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  email: {
    fontSize: fontSize.sm,
  },
  tilesRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  tile: {
    flex: 1,
    gap: 2,
  },
  tileLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  tileValue: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  themeCard: {
    marginTop: spacing.lg,
  },
  rowsCard: {
    marginTop: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.xl,
  },
  row: {
    paddingHorizontal: spacing.xl,
  },
  loggingOutNote: {
    fontSize: fontSize.xs,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  version: {
    fontSize: fontSize.xs,
    marginTop: spacing.xxxl,
    textAlign: "center",
  },
});
