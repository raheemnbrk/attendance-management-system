import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { BottomTabBarProps } from "expo-router/tabs";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import {
  GLASS_TAB_BAR_FLOAT_OFFSET,
  GLASS_TAB_BAR_HEIGHT,
} from "./use-tab-bar-height";

/** Floating pill height -> radius, per the navigation spec. */
const BAR_RADIUS = GLASS_TAB_BAR_HEIGHT / 2;
/** Spring used when the glass bubble slides to the active tab (~250 ms). */
const BUBBLE_SPRING = { dampingRatio: 0.8, duration: 250 } as const;
const ICON_SIZE = 24;
/** Integer blur strength between 60 and 80. */
const BLUR_INTENSITY = 70;

/** Floating liquid-glass tab bar used through the `tabBar` prop of Expo
 * Router Tabs. Falls back to BlurView, and to a solid card bar when the user
 * enables reduce-transparency. */
export function GlassTabBar({ state, descriptors, insets, navigateToTab }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const [pillWidth, setPillWidth] = useState(0);
  const [liquidGlass, setLiquidGlass] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [keyboardShowing, setKeyboardShowing] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Native liquid glass is only available on iOS 26 and later.
    try {
      setLiquidGlass(isLiquidGlassAvailable());
    } catch {
      setLiquidGlass(false);
    }

    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((value) => {
        if (mounted) setReduceTransparency(value === true);
      })
      .catch(() => {
        // Absence of the API is treated as "transparency allowed".
      });
    const transparencyChanged = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparency,
    );

    // tabBarHideOnKeyboard behavior for the custom bar.
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardShowing(true);
    });
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardShowing(false);
    });

    return () => {
      mounted = false;
      transparencyChanged.remove();
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const bottom = insets.bottom + GLASS_TAB_BAR_FLOAT_OFFSET;

  const tabCount = Math.max(1, state.routes.length);
  const tabWidth = pillWidth / tabCount;

  const bubblePosition = useSharedValue(0);

  useEffect(() => {
    const target = state.index * tabWidth;
    // Before the first layout jump straight to the active index.
    if (tabWidth === 0) {
      bubblePosition.value = target;
      return;
    }
    bubblePosition.value = withSpring(target, BUBBLE_SPRING);
  }, [bubblePosition, tabWidth, state.index]);

  const handleBarLayout = (event: LayoutChangeEvent) => {
    setPillWidth(event.nativeEvent.layout.width);
  };

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bubblePosition.value }],
  }));

  const handleBarPress = (routeKey: string) => {
    void Haptics.selectionAsync().catch(() => {
      // Haptics are a nice-to-have; navigation still works without them.
    });
    navigateToTab(routeKey);
  };

  // tabBarHideOnKeyboard behavior: the bar disappears while typing.
  if (keyboardShowing) {
    return null;
  }

  const tabs = (
    <View pointerEvents="box-none" style={styles.tabs}>
      <Animated.View
        style={[
          styles.bubble,
          { backgroundColor: colors.primarySoft, borderColor: colors.glassBorder, width: tabWidth },
          bubbleStyle,
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      {state.routes.map((route, index) => {
        const options = descriptors[route.key]?.options;
        const focused = state.index === index;
        const tint = focused ? colors.primary : colors.mutedForeground;
        const title = options?.title ?? route.name;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={
              options?.tabBarAccessibilityLabel ?? `${title}, tab, ${index + 1} of ${state.routes.length}`
            }
            onPress={() => handleBarPress(route.key)}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            {options?.tabBarIcon ? (
              options.tabBarIcon({ focused, size: ICON_SIZE, color: tint })
            ) : (
              <Ionicons name="ellipse" size={ICON_SIZE} color={tint as string} />
            )}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.tabLabel, { color: tint }]}
            >
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View
      accessibilityRole="tablist"
      pointerEvents="box-none"
      style={styles.barLayout}
    >
      <View
        onLayout={handleBarLayout}
        pointerEvents="box-none"
        style={[
          styles.pill,
          {
            bottom,
            borderRadius: BAR_RADIUS,
            elevation: 10,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.45 : 0.18,
            shadowRadius: 12,
          },
        ]}
      >
        {/* Surface behind the icons */}
        {reduceTransparency ? (
          <View
            pointerEvents="none"
            style={[styles.surface, { backgroundColor: colors.card, borderColor: colors.border }]}
          />
        ) : liquidGlass ? (
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? "dark" : "light"}
            pointerEvents="none"
            style={styles.surface}
          />
        ) : (
          <View pointerEvents="none" style={styles.surface}>
            <BlurView
              intensity={BLUR_INTENSITY}
              tint={isDark ? "dark" : "light"}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassOverlay }]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[colors.glassHighlight, "transparent"]}
              locations={[0, 1]}
              style={[StyleSheet.absoluteFill, styles.highlight]}
            />
          </View>
        )}

        {/* Accent border on top of the glass (the solid bar styles its own) */}
        {!reduceTransparency ? (
          <View
            pointerEvents="none"
            style={[styles.surface, { borderWidth: 1, borderColor: colors.glassBorder }]}
          />
        ) : null}

        {tabs}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barLayout: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  bubble: {
    borderRadius: BAR_RADIUS,
    bottom: 0,
    borderWidth: 1,
    left: 0,
    position: "absolute",
    top: 0,
  },
  highlight: {
    bottom: "60%",
  },
  pill: {
    height: GLASS_TAB_BAR_HEIGHT,
    left: spacing.lg,
    overflow: "hidden",
    position: "absolute",
    right: spacing.lg,
  },
  surface: {
    borderRadius: BAR_RADIUS,
    borderWidth: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 48,
  },
  tabPressed: {
    opacity: 0.65,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
  },
});
