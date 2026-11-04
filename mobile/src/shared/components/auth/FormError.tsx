import { StyleSheet, Text, View } from "react-native";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

type FormErrorProps = {
  message: string;
};

/** Inline validation error as a soft-red pill: tinted destructiveSoft
 * background with the darker destructiveText label — never white text on a
 * solid red box. Also used inside Input/PasswordInput. */
export function FormError({ message }: FormErrorProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.pill, { backgroundColor: colors.destructiveSoft }]}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: colors.destructiveText }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: fontSize.xs,
  },
});
