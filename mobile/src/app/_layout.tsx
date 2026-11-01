import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "@/features/auth/session-store";
import { useHasSeenWelcome } from "@/features/onboarding/storage";
import { setAuthEventHandler } from "@/shared/api/client";
import { createQueryClient } from "@/shared/lib/query-client";
import { ThemeProvider, useTheme } from "@/shared/theme/theme-provider";

SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash screen is only hidden on the first boot.
});

const queryClient = createQueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <SessionProvider>
              <RootNavigator />
            </SessionProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Loads the stored session and flags while the splash screen stays visible,
 * wires the API client auth events to the session, then hides the splash and
 * renders the navigator. The index route alone decides where the user lands
 * (see src/app/index.tsx) using replace redirects.
 */
function RootNavigator() {
  const { colors } = useTheme();
  const { status, signOut, updateTokens } = useSession();
  const welcome = useHasSeenWelcome();

  const booted = status !== "loading" && !welcome.loading;

  useEffect(() => {
    if (!booted) return;
    SplashScreen.hideAsync().catch(() => {
      // Some platforms (web) may not support hiding; safe to ignore.
    });
  }, [booted]);

  useEffect(() => {
    setAuthEventHandler({
      onTokensRefreshed: (tokens) => {
        void updateTokens(tokens);
      },
      onUnauthorized: () => {
        void signOut();
        if (router.canDismiss()) {
          router.dismissAll();
        }
        router.replace("/login");
      },
    });
  }, [signOut, updateTokens]);

  if (!booted) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
