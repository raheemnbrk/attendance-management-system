import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
  isLoading?: boolean;
};

export function Button({
  className = "",
  variant = "solid",
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const styles =
    variant === "solid"
      ? "bg-foreground text-background hover:bg-foreground/85"
      : "border border-black/[.08] bg-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]";

  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
}
