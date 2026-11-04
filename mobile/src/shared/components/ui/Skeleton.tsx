import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { spacing, radius as radiusTokens } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SWEEP_DURATION_MS = 1500;
const SWEEP_START_DELAY_MS = 300;
/** Highlight band width relative to the skeleton being swept. */
const BAND_RATIO = 0.6;

/**
 * Placeholder block with a soft highlight sweeping across its surface. The
 * animation runs on the UI thread (native driver friendly) and is replaced by
 * a plain static block when the system "reduce motion" setting is on.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radiusTokens.sm,
  circle = false,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const bandPosition = useSharedValue(0);
  // Wide elements get a 60% highlight band; tiny ones (dots, pills) get a
  // full-width band so it fully enters and exits the element while sweeping.
  const bandWidth =
    containerWidth <= 0
      ? 0
      : containerWidth < 40
        ? containerWidth
        : Math.max(40, Math.round(containerWidth * BAND_RATIO));

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(Math.round(event.nativeEvent.layout.width));
  };

  useEffect(() => {
    if (reducedMotion || containerWidth <= 0) {
      return undefined;
    }
    // Start with the band fully hidden on the left, sweep it past the right
    // edge, then loop: both endpoints are offscreen so the restart is not a
    // visible jump.
    bandPosition.value = -bandWidth;
    bandPosition.value = withDelay(
      SWEEP_START_DELAY_MS,
      withRepeat(
        withTiming(containerWidth + bandWidth, {
          duration: SWEEP_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false,
      ),
    );
    return () => {
      bandPosition.value = 0;
    };
  }, [bandPosition, bandWidth, containerWidth, reducedMotion]);

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bandPosition.value }],
  }));

  const shape: StyleProp<ViewStyle> = circle
    ? { width: height, height, borderRadius: radiusTokens.full }
    : { width, height, borderRadius };

  const animate =
    !reducedMotion && containerWidth > 0 ? (
      <Animated.View
        pointerEvents="none"
        style={[styles.band, { width: bandWidth }, bandStyle]}
      >
        <LinearGradient
          style={styles.gradient}
          colors={["transparent", colors.skeletonHighlight, "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    ) : null;

  return (
    <View
      accessibilityLabel="Loading"
      accessibilityRole="text"
      onLayout={handleLayout}
      style={[
        styles.block,
        shape,
        { backgroundColor: colors.skeletonBase },
        style,
      ]}
    >
      {animate}
    </View>
  );
}

export type SkeletonTextProps = {
  width?: number | `${number}%`;
  /** Approximate line height of the text being replaced. */
  height?: number;
  /** Render several stacked lines, with the last one shortened. */
  lines?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

/** Placeholder for one or more text lines; the last line is shortened so the
 * paragraph does not look like a full-width rectangle. */
export function SkeletonText({
  width = "100%",
  height = 14,
  lines = 1,
  gap = spacing.xs + spacing.xs,
  style,
}: SkeletonTextProps) {
  if (lines <= 1) {
    return <Skeleton width={width} height={height} style={style} />;
  }

  const stack: ReactNode[] = [];
  for (let index = 0; index < lines; index += 1) {
    const isLast = index === lines - 1;
    stack.push(
      <Skeleton
        key={`line-${index}`}
        width={isLast ? "65%" : "100%"}
        height={height}
      />,
    );
  }

  return (
    <View style={[{ width: "100%", gap }, style]}>
      {stack}
    </View>
  );
}

export type SkeletonCircleProps = {
  size: number;
  style?: StyleProp<ViewStyle>;
};

/** Avatar / icon placeholder. */
export function SkeletonCircle({ size, style }: SkeletonCircleProps) {
  return <Skeleton width={size} height={size} circle style={style} />;
}

const styles = StyleSheet.create({
  block: {
    overflow: "hidden",
  },
  band: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  gradient: {
    flex: 1,
  },
});
