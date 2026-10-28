import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:ring-destructive/30 aria-invalid:border-destructive file:border-0 file:bg-transparent file:text-sm file:font-medium dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}
