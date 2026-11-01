import { useEffect, useMemo } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { radius } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radius.sm,
  circle = false,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.45);

  const pulse = useMemo(
    () =>
      withRepeat(
        withTiming(1, { duration: 900, easing: Easing.ease }),
        -1,
        true,
      ),
    [],
  );

  useEffect(() => {
    opacity.value = pulse;
  }, [pulse, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityLabel="loading"
      style={[
        {
          backgroundColor: colors.skeleton,
          borderRadius: circle ? radius.full : borderRadius,
          height: circle ? height * 2 : height,
          width: circle ? height * 2 : width,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
