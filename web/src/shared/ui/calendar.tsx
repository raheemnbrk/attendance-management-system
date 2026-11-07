"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { buttonVariants } from "./button";
import { cn } from "../lib/utils";

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
      className={cn("bg-background p-4", className)}
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
          "size-10 p-0 aria-disabled:opacity-50",
          classNames?.button_previous,
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-10 p-0 aria-disabled:opacity-50",
          classNames?.button_next,
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-10 items-center justify-center gap-2 text-[0.95rem] font-semibold",
          classNames?.month_caption,
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-10 w-full items-center justify-center gap-1.5 text-[0.95rem] font-semibold",
          classNames?.dropdowns,
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-lg border border-input has-focus:border-transparent has-focus:ring-2 has-focus:ring-ring/50",
          classNames?.dropdown_root,
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 border-none bg-popover opacity-0",
          classNames?.dropdown,
          defaultClassNames.dropdown,
        ),
        caption_label: cn("py-0.5 text-[0.95rem] font-semibold", classNames?.caption_label, defaultClassNames.caption_label),
        month_grid: cn("w-full border-collapse", classNames?.month_grid, defaultClassNames.month_grid),
        weekdays: cn("flex pb-1", classNames?.weekdays, defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 select-none rounded-md pb-1 pt-2 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground",
          classNames?.weekday,
          defaultClassNames.weekday,
        ),
        weeks: cn("flex flex-col gap-1.5", classNames?.weeks, defaultClassNames.weeks),
        week: cn("mt-0.5 flex w-full", classNames?.week, defaultClassNames.week),
        week_number: cn(
          "text-[0.8rem] font-medium text-muted-foreground",
          classNames?.week_number,
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center",
          "[&:first-child[data-selected=true]_button]:rounded-l-xl [&:last-child[data-selected=true]_button]:rounded-r-xl",
          classNames?.day,
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          // Larger cells (min-w keeps the table roomy even for 1-digit days)
          // with slightly heavier numerals — easier to read and to tap.
          "size-10 min-w-10 w-full p-0 text-[0.925rem] font-medium aria-selected:opacity-100",
          // Hover keeps numbers readable on both themes: a soft teal wash with
          // plain foreground text (replaces the gray accent defaults whose
          // foreground-on-teal pairs lose contrast on selected days).
          "hover:bg-primary/15 hover:text-foreground",
          classNames?.day_button,
          defaultClassNames.day_button,
        ),
        // Range presentation, theme-safe by construction: solid teal endpoints
        // with --primary-foreground text, a translucent teal field with
        // --foreground text for the inside days (the trailing "!" beats any
        // muted rest-day styling so numbers stay >= 4.5:1 in light and dark).
        range_start: cn(
          "rounded-l-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
          classNames?.range_start,
        ),
        range_end: cn(
          "rounded-r-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
          classNames?.range_end,
        ),
        range_middle: cn(
          "rounded-none bg-primary/25 text-foreground!",
          classNames?.range_middle,
          defaultClassNames.range_middle,
        ),
        selected: cn(
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          // The day button only sees ghost's hover colors; this keeps solid
          // teal days on their own foreground text while hovering.
          "[&>button:hover]:text-primary-foreground",
          classNames?.selected,
        ),
        // Today gets a teal outline instead of a filled background so its
        // number can never blend into a highlighted range behind it.
        today: cn(
          "rounded-xl ring-1 ring-inset ring-primary data-[selected=true]:rounded-none",
          classNames?.today,
          defaultClassNames.today,
        ),
        // An outside day can still be a range endpoint; keep its number in
        // --primary-foreground there instead of the (near-background) accent
        // tone the default used.
        outside: cn(
          "text-muted-foreground aria-selected:text-primary-foreground",
          classNames?.outside,
          defaultClassNames.outside,
        ),
        // Muted but clearly legible on both themes.
        disabled: cn(
          "text-muted-foreground opacity-60",
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
