import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number | "none";
  accessibilityLabel?: string;
};

export function Card({ children, style, padding = spacing.lg, accessibilityLabel }: CardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding: padding === "none" ? 0 : padding,
        },
        !isDark && {
          borderWidth: 0,
          elevation: 2,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
