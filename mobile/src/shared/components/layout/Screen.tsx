import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  keyboard?: boolean;
  bottomSafe?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Applies the top safe-area inset so screen headers (titles, buttons) are
 * never clipped under the status bar / notch. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  keyboard = false,
  bottomSafe = true,
  refreshing = false,
  onRefresh,
  contentStyle,
}: ScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.inner,
        {
          paddingBottom: bottomSafe ? spacing.lg : 0,
          paddingHorizontal: padded ? spacing.xl : 0,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  let body: ReactNode = content;
  if (scroll) {
    body = (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.card}
            />
          ) : undefined
        }
      >
        <View
          style={[
            {
              paddingBottom: bottomSafe ? spacing.lg : 0,
              paddingHorizontal: padded ? spacing.xl : 0,
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          // Never clip the header: honor the real notch / status-bar inset.
          paddingTop: insets.top,
          paddingBottom: bottomSafe ? insets.bottom : 0,
        },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      {keyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // paddingTop comes from the top safe-area inset at render time.
  },
  inner: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
