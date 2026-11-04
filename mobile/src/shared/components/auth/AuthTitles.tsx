import { StyleSheet, Text, View } from "react-native";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

type AuthTitlesProps = {
  title: string;
  subtitle?: string;
};

/** Header block for auth cards: centered bold title with an optional muted
 * subtitle. Extracted so the Login, Change Password and Get Started screens
 * always render identical typography. */
export function AuthTitles({ title, subtitle }: AuthTitlesProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.titles}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titles: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    textAlign: "center",
  },
});
