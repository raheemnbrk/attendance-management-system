"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { buttonVariants } from "./button";
import { cn } from "../lib/utils";
import "react-day-picker/style.css";

type CalendarProps = ComponentProps<typeof DayPicker> & {
  buttonVariant?: VariantProps<typeof buttonVariants>["variant"];
};

// Shadcn-style calendar on top of react-day-picker v10: token-based classes
// for day buttons, selection/range states and the navigation chevrons.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("bg-background p-3", className)}
      captionLayout={captionLayout}
      classNames={{
        ...classNames,
        root: cn("w-fit", classNames?.root, defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 sm:flex-row sm:gap-6", classNames?.months, defaultClassNames.months),
        month: cn("relative flex flex-col gap-4", classNames?.month, defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between gap-1 px-2",
          classNames?.nav,
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-9 p-0 aria-disabled:opacity-50",
          classNames?.button_previous,
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-9 p-0 aria-disabled:opacity-50",
          classNames?.button_next,
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-9 items-center justify-center gap-1 text-sm font-medium",
          classNames?.month_caption,
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-9 w-full items-center justify-center gap-1.5 text-sm font-medium",
          classNames?.dropdowns,
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-md border border-input has-focus:border-transparent has-focus:ring-2 has-focus:ring-ring/50",
          classNames?.dropdown_root,
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 border-none bg-popover opacity-0",
          classNames?.dropdown,
          defaultClassNames.dropdown,
        ),
        caption_label: cn("py-0.5 text-sm font-medium", classNames?.caption_label, defaultClassNames.caption_label),
        month_grid: cn("w-full border-collapse", classNames?.month_grid, defaultClassNames.month_grid),
        weekdays: cn("flex", classNames?.weekdays, defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 select-none rounded-md text-[0.8rem] font-normal text-muted-foreground",
          classNames?.weekday,
          defaultClassNames.weekday,
        ),
        weeks: cn("flex flex-col gap-1", classNames?.weeks, defaultClassNames.weeks),
        week: cn("mt-0.5 flex w-full", classNames?.week, defaultClassNames.week),
        week_number: cn(
          "text-[0.8rem] font-medium text-muted-foreground",
          classNames?.week_number,
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center",
          "[&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          classNames?.day,
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 w-full p-0 font-normal aria-selected:opacity-100",
          classNames?.day_button,
          defaultClassNames.day_button,
        ),
        range_start: cn("rounded-l-md bg-accent", classNames?.range_start),
        range_middle: cn(
          "rounded-none aria-selected:bg-accent aria-selected:text-accent-foreground",
          classNames?.range_middle,
          defaultClassNames.range_middle,
        ),
        range_end: cn("rounded-r-md bg-accent", classNames?.range_end),
        selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          classNames?.selected,
        ),
        today: cn(
          "rounded-md bg-accent text-accent-foreground data-[selected=true]:rounded-none",
          classNames?.today,
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-accent-foreground",
          classNames?.outside,
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          classNames?.disabled,
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", classNames?.hidden, defaultClassNames.hidden),
      }}
      components={{
        Chevron: ({ className, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("size-4", className)} {...chevronProps} />;
          }

          if (orientation === "right") {
            return <ChevronRight className={cn("size-4", className)} {...chevronProps} />;
          }

          return <ChevronDown className={cn("size-4", className)} {...chevronProps} />;
        },
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };
