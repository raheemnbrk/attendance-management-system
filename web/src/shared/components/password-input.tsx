"use client";

import { Eye, EyeOff } from "lucide-react";
import {
  useState,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type KeyboardEvent,
} from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Decorative icon rendered inside the field, before the value. */
  leadingIcon?: ReactNode;
  /** Show the "Caps Lock is on" hint under the field. Enabled by default. */
  showCapsLockHint?: boolean;
  /** React 19 passes ref as a normal prop; react-hook-form's register() relies on it. */
  ref?: Ref<HTMLInputElement>;
};

// Password field with an accessible show/hide toggle and a Caps Lock warning.
// The toggle is a type="button" so it can never submit the surrounding form.
export function PasswordInput({
  className,
  leadingIcon,
  showCapsLockHint = true,
  onBlur,
  onKeyDown,
  onKeyUp,
  ref,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // getModifierState is only populated while typing; also reset on blur so the
  // hint never "sticks" when the user alt-tabs.
  function handleKeyEvent(
    event: KeyboardEvent<HTMLInputElement>,
    handler?: (event: KeyboardEvent<HTMLInputElement>) => void,
  ) {
    setCapsLockOn(event.getModifierState?.("CapsLock") ?? false);
    handler?.(event);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    setCapsLockOn(false);
    onBlur?.(event);
  }

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    // Prevent the focused field from losing focus when clicking the toggle.
    event.preventDefault();
    setShowPassword((value) => !value);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        {leadingIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 grid -translate-y-1/2 place-items-center text-muted-foreground"
          >
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent py-1 pr-10 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:ring-destructive/30 aria-invalid:border-destructive dark:bg-input/30",
            leadingIcon ? "pl-9" : "pl-3",
            className,
          )}
          onBlur={handleBlur}
          onKeyDown={(event) => handleKeyEvent(event, onKeyDown)}
          onKeyUp={(event) => handleKeyEvent(event, onKeyUp)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute top-0 right-0 h-full rounded-md px-3 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
      {showCapsLockHint && capsLockOn ? (
        <p role="status" className="text-xs font-medium text-warning-foreground">
          Caps Lock is on
        </p>
      ) : null}
    </div>
  );
}

type PasswordStrengthProps = {
  password: string;
  className?: string;
};

// Three-step strength meter: length >= 8, mixed case + digit, symbol or 12+ chars.
// Purely informative; the schema still enforces the minimum length.
export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const level =
    (password.length >= 8 ? 1 : 0) +
    (password.length >= 8 && hasLower && hasUpper && hasDigit ? 1 : 0) +
    (password.length >= 8 && (hasSymbol || password.length >= 12) ? 1 : 0);

  const meta = [
    { bar: "bg-muted", label: "Password must be at least 8 characters" },
    { bar: "bg-warning", label: "Weak password" },
    { bar: "bg-info", label: "Good password" },
    { bar: "bg-success", label: "Strong password" },
  ][level];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn("h-1 flex-1 rounded-full", index < level ? meta.bar : "bg-muted")}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{meta.label}</p>
    </div>
  );
}
