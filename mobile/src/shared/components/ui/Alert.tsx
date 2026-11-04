import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import type { ThemeColors } from "@/shared/theme/colors";

export type AlertTone = "info" | "warning" | "error" | "success";

export type AlertProps = {
  message: string;
  tone?: AlertTone;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const iconByTone: Record<AlertTone, keyof typeof Ionicons.glyphMap> = {
  info: "information-circle",
  warning: "warning",
  error: "alert-circle",
  success: "checkmark-circle",
};

function useToneColors(
  tone: AlertTone,
): { strong: keyof ThemeColors; soft: keyof ThemeColors } {
  return tone === "success"
    ? { strong: "success", soft: "successSoft" }
    : tone === "warning"
      ? { strong: "warning", soft: "warningSoft" }
      : tone === "error"
        ? // Soft red text on a soft red tint — never white on a solid red box.
          { strong: "destructiveText", soft: "destructiveSoft" }
        : { strong: "info", soft: "infoSoft" };
}

export function Alert({ message, tone = "info", onRetry, retryLabel = "Retry", style }: AlertProps) {
  const { colors } = useTheme();
  const { strong, soft } = useToneColors(tone);

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`${tone}: ${message}`}
      style={[styles.alert, { backgroundColor: colors[soft] }, style]}
    >
      <Ionicons name={iconByTone[tone]} size={18} color={colors[strong]} />
      <Text style={[styles.message, { color: colors[strong] }]}>{message}</Text>
      {onRetry ? (
        <Text
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          onPress={onRetry}
          style={[styles.retry, { color: colors[strong] }]}
        >
          {retryLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: "100%",
  },
  message: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  retry: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    paddingVertical: spacing.xs,
  },
});
