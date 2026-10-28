"use client";

import { addDays, format, subDays } from "date-fns";
import { CalendarRange } from "lucide-react";
import { todayLocalISO } from "@/shared/lib/format";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export type DateRange = { from?: string; to?: string };

// Range presets keep common queries one click away.
const PRESETS: Array<{ label: string; range: () => DateRange }> = [
  { label: "Last 7 days", range: () => ({ from: format(subDays(new Date(), 6), "yyyy-MM-dd"), to: todayLocalISO() }) },
  { label: "Last 30 days", range: () => ({ from: format(subDays(new Date(), 29), "yyyy-MM-dd"), to: todayLocalISO() }) },
  { label: "This month", range: () => ({ from: format(new Date(), "yyyy-MM-01"), to: todayLocalISO() }) },
];

function shiftDate(days: number): string {
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}) {
  const today = todayLocalISO();
  const { from, to } = value;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="range-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="range-from"
            type="date"
            max={today}
            value={from ?? ""}
            onChange={(event) => onChange({ ...value, from: event.target.value || undefined })}
            className="w-40"
          />
        </div>
        <CalendarRange className="mt-5 size-4 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <Label htmlFor="range-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="range-to"
            type="date"
            max={today}
            value={to ?? ""}
            onChange={(event) =>
              onChange({
                from: value.from,
                to: event.target.value || undefined,
              })
            }
            className="w-40"
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.range())}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ from: shiftDate(-29), to: today })}
          className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
