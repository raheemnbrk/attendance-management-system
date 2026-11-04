import { forwardRef, useState, type ReactNode } from "react";
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
import { FormError } from "@/shared/components/auth/FormError";
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
  { label, error, icon, right, containerStyle, style, onFocus, onBlur, ...inputProps },
  ref,
) {
  const { colors } = useTheme();
  const hasError = Boolean(error);
  const [focused, setFocused] = useState(false);

  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surfaceElevated,
            // Visible by default, teal while focused, destructive on errors.
            borderColor: hasError
              ? colors.destructive
              : focused
                ? colors.primary
                : colors.borderStrong,
          },
          focused && !hasError && styles.focusedField,
        ]}
      >
        {icon ? (
          <View style={styles.icon}>{icon}</View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mutedForeground}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
      {hasError && error ? <FormError message={error} /> : null}
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
  focusedField: {
    borderWidth: 1.5,
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
});
