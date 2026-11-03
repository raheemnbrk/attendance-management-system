import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

// Server/user feedback blocks. Colors follow the light/dark soft tokens so
// they stay readable in both themes (destructive-soft added alongside the
// existing success/warning/info softs).
const alertVariants = cva(
  "relative flex w-full flex-col gap-1 rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:top-3.5 [&>svg]:left-4 [&>svg]:size-4 [&>svg+div]:translate-y-0 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-info/40 bg-info-soft text-info-foreground",
        warning: "border-warning/40 bg-warning-soft text-warning-foreground",
        destructive: "border-status-red-border bg-status-red-bg text-status-red-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Alert({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("font-medium [&>svg]:absolute [&>svg]:top-3.5 [&>svg]:left-4", className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("text-sm opacity-80 [&_p]:leading-relaxed", className)} {...props} />;
}
