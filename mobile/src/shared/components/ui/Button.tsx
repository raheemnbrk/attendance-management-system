import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { fontSize, hitSlop, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type ButtonVariant = "primary" | "soft" | "destructive" | "outline" | "ghost";
export type ButtonSize = "md" | "lg";

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

type Palette = {
  container: ViewStyle;
  text: TextStyle;
};

function useVariantStyle(variant: ButtonVariant): Palette {
  const { colors, isDark } = useTheme();

  switch (variant) {
    case "soft":
      return {
        container: { backgroundColor: colors.primarySoft },
        text: { color: colors.primary },
      };
    case "destructive":
      return {
        container: { backgroundColor: colors.destructive },
        text: { color: colors.destructiveForeground },
      };
    case "outline":
      return {
        container: {
          backgroundColor: isDark ? colors.background : colors.card,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        text: { color: colors.primary },
      };
    case "ghost":
      return {
        container: { backgroundColor: "transparent" },
        text: { color: colors.mutedForeground },
      };
    case "primary":
    default:
      return {
        container: { backgroundColor: colors.primary },
        text: { color: colors.primaryForeground },
      };
  }
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const variantStyle = useVariantStyle(variant);

  const height = size === "lg" ? 58 : 52;
  const isInactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ busy: loading, disabled: isInactive }}
      onPress={onPress}
      disabled={isInactive}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        { height },
        variantStyle.container,
        fullWidth && styles.fullWidth,
        (!fullWidth || variant === "ghost") && styles.inline,
        pressed && { opacity: 0.85 },
        isInactive && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyle.text.color as string}
          accessibilityLabel={`${title}: loading`}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.title, { fontSize: size === "lg" ? fontSize.md + 1 : fontSize.md }, variantStyle.text]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: "100%",
  },
  inline: {
    alignSelf: "flex-start",
  },
  title: {
    fontWeight: "600",
  },
});
