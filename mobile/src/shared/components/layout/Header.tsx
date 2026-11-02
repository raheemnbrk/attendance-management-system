import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fontSize, hitSlop, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type HeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  avatar?: ReactNode;
};

export function Header({ title, subtitle, onBack, right, avatar }: HeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header} accessibilityRole="header">
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={hitSlop}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: colors.card },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
      ) : null}
      {avatar}
      <View style={styles.titles}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    // 16px of vertical padding keeps the title clear of the status bar even on
    // notched devices, and 12px below separates it from the content.
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.lg,
    width: "100%",
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
});
