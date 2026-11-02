import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/shared/components/ui/Card";
import { ListItem } from "@/shared/components/ui/ListItem";
import { Header } from "@/shared/components/layout/Header";
import { Screen } from "@/shared/components/layout/Screen";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { themeSchemeValues } from "@/features/profile/schema";
import type { AppUser } from "@/shared/types";

export type ProfileScreenProps = {
  user: AppUser | null;
  onPressChangePassword?: () => void;
  onLogout?: () => void;
  loggingOut?: boolean;
};

function initials(name: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "—";
  const letters = trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());
  return letters.join("") || "?";
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
      <Header
        title="Profile"
        right={
          <Ionicons
            name="settings-outline"
            size={22}
            color={colors.foreground}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        }
      />

      {/* Identity card */}
      <Card style={styles.identity}>
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

      {/* Department and employer tiles */}
      <View style={styles.tilesRow}>
        <Tile
          icon="briefcase-outline"
          label="Department"
          value={user?.department ?? "—"}
        />
        <Tile
          icon="business-outline"
          label="Employer"
          value={user?.company ?? "—"}
        />
      </View>

      {/* Theme selector */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>App theme</Text>
        <View
          style={[styles.themeRow, { backgroundColor: colors.muted }]}
          accessibilityRole="radiogroup"
          accessibilityLabel="App theme"
        >
          {themeSchemeValues.map((option) => {
            const active = scheme === option;
            const label =
              option === ("light" as const)
                ? "Light"
                : option === ("dark" as const)
                  ? "Dark"
                  : "System";
            return (
              <Pressable
                key={option}
                onPress={() => setScheme(option)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${label} theme`}
                style={[styles.themeOption, active && { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    styles.themeOptionLabel,
                    { color: active ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Preferences and session rows */}
      <Card padding="none" style={styles.rowsCard}>
        <ListItem
          icon="lock-closed-outline"
          title="Change password"
          subtitle="Update your sign-in password"
          onPress={onPressChangePassword}
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
    </Screen>
  );
}

function Tile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.tile}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.tileLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.tileValue, { color: colors.foreground }]} numberOfLines={1}>
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
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
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
  themeRow: {
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  themeOption: {
    alignItems: "center",
    borderRadius: radius.full,
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  themeOptionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
  rowsCard: {
    marginTop: spacing.sm,
  },
  row: {
    paddingHorizontal: spacing.md,
  },
  loggingOutNote: {
    fontSize: fontSize.xs,
    textAlign: "center",
  },
});
