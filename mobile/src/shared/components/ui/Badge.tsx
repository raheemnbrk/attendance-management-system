import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type BadgeTone = "success" | "warning" | "destructive" | "muted" | "info";

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = "muted", dot = false, style }: BadgeProps) {
  const { colors } = useTheme();

  const strongColor = ((): string => {
    switch (tone) {
      case "success":
        return colors.success;
      case "warning":
        return colors.warning;
      case "destructive":
        return colors.destructive;
      case "info":
        return colors.info;
      case "muted":
      default:
        return colors.mutedForeground;
    }
  })();

  const softColor = ((): string => {
    switch (tone) {
      case "success":
        return colors.successSoft;
      case "warning":
        return colors.warningSoft;
      case "destructive":
        return colors.destructiveSoft;
      case "info":
        return colors.infoSoft;
      case "muted":
      default:
        return colors.muted;
    }
  })();

  return (
    <View style={[styles.badge, { backgroundColor: softColor }, style]}>
      {dot ? (
        <View style={[styles.dot, { backgroundColor: strongColor }]} />
      ) : null}
      <Text style={[styles.label, { color: strongColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  dot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
