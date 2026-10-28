import type { LabelHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "flex select-none items-center gap-2 text-sm font-medium leading-none",
        className,
      )}
      {...props}
    />
  );
}
