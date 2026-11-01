import { forwardRef, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

type TextInputInstance = React.ComponentRef<typeof TextInput>;

export type InputProps = {
  label?: string;
  error?: string;
  icon?: ReactNode;
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
} & TextInputProps;

export const Input = forwardRef<TextInputInstance, InputProps>(function Input(
  { label, error, icon, right, containerStyle, style, ...inputProps },
  ref,
) {
  const { colors } = useTheme();
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.field,
          { backgroundColor: colors.card, borderColor: hasError ? colors.destructive : colors.border },
        ]}
      >
        {icon ? (
          <View style={styles.icon}>{icon}</View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            { color: colors.foreground },
            !icon && styles.inputNoIcon,
            style,
          ]}
          {...inputProps}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {hasError ? (
        <Text
          style={[styles.error, { color: colors.destructive }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

type ControlledInputProps<
  TFormValues extends FieldValues,
  TName extends FieldPath<TFormValues>,
> = {
  control: Control<TFormValues>;
  name: TName;
} & Omit<InputProps, "value" | "onChangeText" | "error">;

export function ControlledInput<
  TFormValues extends FieldValues,
  TName extends FieldPath<TFormValues>,
>({ control, name, ...inputProps }: ControlledInputProps<TFormValues, TName>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Input
      value={field.value}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
      accessibilityLabel={inputProps.label ?? name}
      {...inputProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  field: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputNoIcon: {
    paddingLeft: spacing.lg,
  },
  right: {
    paddingRight: spacing.sm,
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
