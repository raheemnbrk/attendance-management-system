"use client";

// A reusable date-range picker (popover calendar + quick presets) shared by
// the attendance, employee and reports pages. The value flows as optional
// from/to dates in YYYY-MM-DD (inclusive); the calendar never pushes partial
// states to the parent — a selection is applied once both ends are set (or a
// preset / Clear is used).

import { useMemo, useState } from "react";
import {
  addDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerDateRange } from "react-day-picker";
import { REST_DAYS } from "@/shared/lib/business";
import { todayLocalISO } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

export type DateRange = {
  from?: string;
  to?: string;
};

const ISO = "yyyy-MM-dd";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This week" },
  { key: "last-week", label: "Last week" },
  { key: "month", label: "This month" },
  { key: "last-month", label: "Last month" },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"];

function iso(date: Date): string {
  return format(date, ISO);
}

function parseDate(isoDate: string): Date {
  return parseISO(`${isoDate}T00:00:00`);
}

function startOfWeekSunday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 });
}

function presetIsoRange(key: PresetKey, todayDate: Date): DateRange {
  switch (key) {
    case "today": {
      const day = iso(todayDate);
      return { from: day, to: day };
    }
    case "yesterday": {
      const day = iso(addDays(todayDate, -1));
      return { from: day, to: day };
    }
    case "week": {
      // Ends today so the picker never highlights future days.
      return { from: iso(startOfWeekSunday(todayDate)), to: iso(todayDate) };
    }
    case "last-week": {
      const start = startOfWeekSunday(addDays(todayDate, -7));
      return { from: iso(start), to: iso(addDays(start, 6)) };
    }
    case "month": {
      return { from: iso(startOfMonth(todayDate)), to: iso(todayDate) };
    }
    case "last-month": {
      const lastMonthEnd = endOfMonth(addDays(startOfMonth(todayDate), -1));
      return { from: iso(startOfMonth(lastMonthEnd)), to: iso(lastMonthEnd) };
    }
  }
}

// Which preset matches a value, if any; "custom" marks hand-drawn or
// arbitrary ranges, null an empty value ("All dates").
function matchPresetKey(
  value: DateRange,
  todayDate: Date,
): PresetKey | "custom" | null {
  if (!value.from && !value.to) {
    return null;
  }

  for (const preset of PRESETS) {
    const range = presetIsoRange(preset.key, todayDate);
    if (range.from === value.from && range.to === value.to) {
      return preset.key;
    }
  }

  return "custom";
}

// "Nov 1 – Nov 30, 2026"; both years are shown when they differ; an open end
// reads "since this date"; no dates at all reads "All dates".
function rangeLabel(range: DateRange): string {
  if (!range.from) {
    return "All dates";
  }

  const from = parseDate(range.from);

  if (!range.to) {
    return `${format(from, "MMM d, yyyy")} – …`;
  }

  const to = parseDate(range.to);
  if (range.from === range.to) {
    return format(from, "MMM d, yyyy");
  }

  if (range.from.slice(0, 4) === range.to.slice(0, 4)) {
    return `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`;
  }

  return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
}

const pillBase =
  "rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground";
const pillActive =
  "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground";

// Rest days (Fri/Sat) render muted while staying selectable; the guard keeps
// the teal endpoint styling intact on selected rest days.
const REST_DAY_CLASS =
  "[&:not([data-selected=true])]:text-muted-foreground [&:not([data-selected=true])]:opacity-60";

// Teal range presentation: solid endpoints, tinted middle, square inner
// buttons (all coloring happens on the day cells).
const RANGE_CLASS_NAMES = {
  day_button: "rounded-none",
  range_start: "rounded-l-md bg-primary text-primary-foreground hover:bg-primary",
  range_end: "rounded-r-md bg-primary text-primary-foreground hover:bg-primary",
  range_middle: "rounded-none bg-primary/15 text-foreground",
} as const;

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
  // Frozen once per mount: presets and labels must not drift across midnight.
  const todayIso = useMemo(() => todayLocalISO(), []);
  const todayDate = useMemo(() => parseDate(todayIso), [todayIso]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start font-normal", className)}
          title="Select date range"
        >
          <CalendarIcon aria-hidden="true" />
          <span>{rangeLabel(value)}</span>
        </Button>
      </PopoverTrigger>
      {open ? (
        <PopoverContent align="start" className="w-auto max-w-[min(92vw,21rem)] p-0">
          {/* The body owns the selection draft; it remounts on every open and
              starts from the applied value, so a half-drawn range never leaks
              outside the popover. */}
          <RangePickerBody
            value={value}
            todayDate={todayDate}
            onApply={(range) => {
              onChange(range);
              setOpen(false);
            }}
            onClear={() => {
              onChange({});
              setOpen(false);
            }}
          />
        </PopoverContent>
      ) : null}
    </Popover>
  );
}

function RangePickerBody({
  value,
  todayDate,
  onApply,
  onClear,
}: {
  value: DateRange;
  todayDate: Date;
  onApply: (range: DateRange) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<DateRange>(value);

  const activeKey = matchPresetKey(draft, todayDate);
  const hasAppliedValue = Boolean(value.from || value.to);

  const selected: DayPickerDateRange | undefined = draft.from
    ? {
        from: parseDate(draft.from),
        to: draft.to ? parseDate(draft.to) : undefined,
      }
    : undefined;

  function handleSelect(next: DayPickerDateRange | undefined) {
    const from = next?.from ? iso(next.from) : undefined;
    const to = next?.to ? iso(next.to) : undefined;
    setDraft({ from, to });

    if (from && to && from <= to) {
      onApply({ from, to });
    }
  }

  function applyPreset(key: PresetKey) {
    const range = presetIsoRange(key, todayDate);
    setDraft(range);
    onApply(range);
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5 px-3 pt-3">
        {PRESETS.map((preset) => {
          const active = activeKey === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              aria-pressed={active}
              onClick={() => applyPreset(preset.key)}
              className={cn(pillBase, active && pillActive)}
            >
              {preset.label}
            </button>
          );
        })}
        {/* Custom is a state indicator: hand-drawn ranges highlight it, the
            two-click drawing always applies through the calendar itself. */}
        <span
          aria-pressed={activeKey === "custom"}
          className={cn(pillBase, activeKey === "custom" && pillActive)}
        >
          Custom
        </span>
        {hasAppliedValue ? (
          <button
            type="button"
            onClick={onClear}
            className={cn(pillBase, "hover:text-destructive")}
          >
            Clear
          </button>
        ) : null}
      </div>
      <Calendar
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        disabled={[{ after: todayDate }]}
        resetOnSelect
        excludeDisabled
        numberOfMonths={1}
        weekStartsOn={0}
        captionLayout="dropdown"
        defaultMonth={selected?.from ?? todayDate}
        modifiers={{ restDay: (date) => REST_DAYS.includes(date.getDay()) }}
        modifiersClassNames={{ restDay: REST_DAY_CLASS }}
        classNames={RANGE_CLASS_NAMES}
      />
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-muted-foreground/40"
          />
          Rest days (Fri &amp; Sat)
        </span>
      </div>
    </>
  );
}
