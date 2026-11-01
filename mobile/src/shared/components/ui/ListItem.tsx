import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fontSize, hitSlop, radius, spacing, type ThemeColors } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type ListItemIconTone = "primary" | "destructive" | "muted";

export type ListItemProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: ListItemIconTone;
  right?: React.ReactNode;
  danger?: boolean;
  chevron?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function toneTokens(
  tone: ListItemIconTone,
  colors: ThemeColors,
): { bg: string; fg: string } {
  switch (tone) {
    case "destructive":
      return { bg: colors.destructiveSoft, fg: colors.destructive };
    case "muted":
      return { bg: colors.muted, fg: colors.mutedForeground };
    case "primary":
    default:
      return { bg: colors.primarySoft, fg: colors.primary };
  }
}

export function ListItem({
  title,
  subtitle,
  icon,
  iconTone = "primary",
  right,
  danger = false,
  chevron = false,
  onPress,
  accessibilityLabel,
  style,
}: ListItemProps) {
  const { colors } = useTheme();
  const tones = toneTokens(danger ? "destructive" : iconTone, colors);

  const content = (
    <>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: tones.bg }]}>
          <Ionicons name={icon} size={20} color={tones.fg} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Text
          style={[styles.title, { color: danger ? colors.destructive : colors.foreground }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron && onPress ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.mutedForeground}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      disabled={false}
      hitSlop={hitSlop}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
    width: "100%",
  },
  icon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: fontSize.xs,
  },
});
