import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

type AuthScreenProps = {
  children: ReactNode;
};

/** Route shell shared by the auth screens: themed background, themed status
 * bar, iOS keyboard padding and the vertically centered scroll body. Every
 * auth route must render through this so their layout can't drift. */
export function AuthScreen({ children }: AuthScreenProps) {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
});
