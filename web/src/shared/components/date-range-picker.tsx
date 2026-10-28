"use client";

import { format, parseISO } from "date-fns";
import { CalendarRange } from "lucide-react";
import { useState } from "react";
import type { DateRange as RdpDateRange } from "react-day-picker";
import { todayLocalISO } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

export type DateRange = { from?: string; to?: string };

function toIso(date: Date | undefined): string | undefined {
  return date ? format(date, "yyyy-MM-dd") : undefined;
}

function fromDate(iso: string | undefined): Date | undefined {
  return iso ? parseISO(`${iso}T00:00:00`) : undefined;
}

const PRESETS: Array<{ label: string; range: () => DateRange }> = [
  {
    label: "Last 7 days",
    range: () => ({
      from: format(new Date(Date.now() - 6 * 86_400_000), "yyyy-MM-dd"),
      to: todayLocalISO(),
    }),
  },
  {
    label: "Last 30 days",
    range: () => ({
      from: format(new Date(Date.now() - 29 * 86_400_000), "yyyy-MM-dd"),
      to: todayLocalISO(),
    }),
  },
  {
    label: "This month",
    range: () => ({ from: format(new Date(), "yyyy-MM-01"), to: todayLocalISO() }),
  },
];

// Shadcn popover + calendar range picker. `value` holds ISO dates
// (yyyy-MM-dd); no end date means an open-ended "from" filter.
export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const from = fromDate(value.from);
  const to = fromDate(value.to);

  const label =
    from && to
      ? `${format(from, "MMM d")} – ${format(to, "MMM d")}`
      : from
        ? `${format(from, "MMM d")} – …`
        : "All dates";

  // No future attendance exists; keep the calendar bounded to this month.
  const endMonth = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  })();

  function handleSelect(range: RdpDateRange | undefined) {
    onChange({ from: toIso(range?.from), to: toIso(range?.to) });
    if (range?.from && range?.to) {
      setOpen(false);
    }
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start font-normal" title="Filter by date range">
            <CalendarRange aria-hidden="true" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={{ from, to }}
            defaultMonth={from ?? new Date()}
            endMonth={endMonth}
            numberOfMonths={2}
            onSelect={handleSelect}
          />
          <div className="flex flex-wrap gap-1.5 border-t border-border p-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.range());
                  setOpen(false);
                }}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onChange({});
                setOpen(false);
              }}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Reset
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
