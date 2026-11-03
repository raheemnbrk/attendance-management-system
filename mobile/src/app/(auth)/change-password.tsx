import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export default function ChangePasswordRoute() {
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={styles.flex}>
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
          <ChangePasswordForm />
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
