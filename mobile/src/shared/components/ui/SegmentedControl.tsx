import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

/** Spring used when the active pill slides between segments. */
const PILL_SPRING = { dampingRatio: 0.86, duration: 250 } as const;

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Small icon shown when the segment is inactive. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Small icon shown when the segment is active (filled variants). */
  activeIcon?: keyof typeof Ionicons.glyphMap;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Row of equal-width segments with an animated pill that slides behind the
 * active selection. Exposed as a radio group for assistive technologies. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  // Equal segments: shared width of all options inside the padded row.
  const segmentWidth = Math.max(0, (containerWidth - spacing.sm) / options.length);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const offset = useSharedValue(0);

  useEffect(() => {
    const target = selectedIndex * segmentWidth;
    // Before the first layout the row still has no width: jump without
    // animating from the (wrong) initial position.
    if (segmentWidth === 0) {
      offset.value = target;
      return;
    }
    offset.value = withSpring(target, PILL_SPRING);
  }, [offset, segmentWidth, selectedIndex]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      onLayout={handleLayout}
      style={[styles.container, { backgroundColor: colors.muted }, style]}
    >
      <Animated.View
        style={[styles.pill, { backgroundColor: colors.primary, width: segmentWidth }, pillStyle]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              pressed && styles.optionPressed,
            ]}
          >
            {option.icon ? (
              <Ionicons
                name={active ? option.activeIcon ?? option.icon : option.icon}
                size={14}
                color={active ? colors.primaryForeground : colors.mutedForeground}
              />
            ) : null}
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
              style={{
                color: active ? colors.primaryForeground : colors.mutedForeground,
                fontSize: fontSize.sm,
                fontWeight: "600",
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.full,
    flexDirection: "row",
    height: 48,
    padding: spacing.xs,
    position: "relative",
  },
  option: {
    alignItems: "center",
    borderRadius: radius.full,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    zIndex: 1,
  },
  optionPressed: {
    opacity: 0.75,
  },
  pill: {
    bottom: spacing.xs,
    borderRadius: radius.full,
    left: spacing.xs,
    position: "absolute",
    top: spacing.xs,
  },
});
