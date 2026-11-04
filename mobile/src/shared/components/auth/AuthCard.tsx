import { Card } from "@/shared/components/ui/Card";
import { spacing } from "@/shared/theme/colors";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";

type AuthCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** The auth screens' card: same surface tokens in light and dark, wide as the
 * form, with the footer-style padding the Change Password screen established. */
export function AuthCard({ children, style }: AuthCardProps) {
  return (
    <Card padding={spacing.xl} style={[styles.card, style]}>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
});
