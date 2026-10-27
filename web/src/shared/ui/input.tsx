import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-black/[.08] bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground/40 dark:border-white/[.145] ${className}`}
      {...props}
    />
  );
}
