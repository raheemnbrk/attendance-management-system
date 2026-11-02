import { Ionicons } from "@expo/vector-icons";
import { Circle, Svg } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect, type ReactNode } from "react";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STROKE_WIDTH = 12;
const RING_GAP = STROKE_WIDTH + 6;

export type TimerState = "idle" | "working" | "done";

export type TimerRingProps = {
  state: TimerState;
  /** Large center label — clock time, elapsed time or worked duration. */
  label: string;
  /** Small caption under the label. */
  caption: string;
  /** Ring completion in [0, 1]. */
  progress: number;
};

export function TimerRing({ state, label, caption, progress }: TimerRingProps) {
  const { colors, isDark } = useTheme();
  const size = 240;
  const center = size / 2;
  const trackRadius = center - RING_GAP;
  const circumference = 2 * Math.PI * trackRadius;

  // Animate the sweep smoothly whenever the progress value changes.
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const ringColor = state === "done" ? colors.success : colors.primary;
  const icon: ReactNode =
    state === "done" ? (
      <Ionicons name="checkmark-circle" size={30} color={colors.success} />
    ) : state === "working" ? (
      <Ionicons name="stopwatch-outline" size={30} color={colors.primary} />
    ) : (
      <Ionicons name="finger-print-outline" size={30} color={colors.mutedForeground} />
    );

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${caption}, ${label}`}
      accessibilityRole="text"
    >
      <Svg width={size} height={size} style={styles.ring}>
        <Circle
          cx={center}
          cy={center}
          r={trackRadius}
          fill="none"
          stroke={isDark ? colors.border : colors.muted}
          strokeWidth={STROKE_WIDTH}
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={trackRadius}
          fill="none"
          stroke={ringColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>
        {icon}
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text
          style={[
            styles.caption,
            {
              color: state === "done" ? colors.success : colors.mutedForeground,
            },
          ]}
        >
          {caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 240,
    width: 240,
    alignSelf: "center",
  },
  ring: {
    position: "absolute",
    transform: [{ rotate: "0deg" }],
  },
  center: {
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
