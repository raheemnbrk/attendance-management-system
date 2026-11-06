"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarRange, Printer } from "lucide-react";
import { formatDate, formatDuration, todayLocalISO } from "@/shared/lib/format";
import type { MonthlyReportRow } from "@/features/attendance/attendance.types";
import { useMonthlyReport } from "@/features/attendance/use-attendance";
import { DateRangePicker, type DateRange } from "@/shared/components/date-range-picker";
import { EmptyState } from "@/shared/components/empty-state";
import { ExportMenu } from "@/shared/components/export-menu";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

type SortKey = "name" | "daysPresent" | "daysAbsent" | "totalMinutes" | "averageMinutesPerDay" | "forgottenCheckOuts";
type SortDir = "asc" | "desc";

const SORTABLE_COLUMNS: Array<{ key: SortKey; label: string; numeric: boolean }> = [
  { key: "daysPresent", label: "Days present", numeric: true },
  { key: "daysAbsent", label: "Days absent", numeric: true },
  { key: "totalMinutes", label: "Total hours", numeric: true },
  { key: "averageMinutesPerDay", label: "Avg / day", numeric: true },
  { key: "forgottenCheckOuts", label: "Forgotten check-outs", numeric: true },
];

function compareRows(a: MonthlyReportRow, b: MonthlyReportRow, key: SortKey): number {
  if (key === "name") {
    return a.name.localeCompare(b.name);
  }

  return (a[key] ?? 0) - (b[key] ?? 0);
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  activeDir,
  numeric,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  activeDir: SortDir;
  numeric?: boolean;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  const Icon = !isActive ? ArrowUpDown : activeDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={numeric ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 ${numeric ? "flex-row-reverse" : ""} ${
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    </TableHead>
  );
}

const REPORT_RANGE_KEY = "employer.reports.range";

// Reports start on the current month-to-date and remember the last viewed
// range for the session (falls back silently when storage is unavailable).
function loadPersistedRange(today: string): DateRange {
  try {
    const raw = window.sessionStorage.getItem(REPORT_RANGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DateRange;
      const from = typeof parsed?.from === "string" ? parsed.from : undefined;
      const to = typeof parsed?.to === "string" ? parsed.to : undefined;
      if (from || to) {
        return { from, to };
      }
    }
  } catch {
    // A missing/corrupted entry just falls back to the default range.
  }

  return { from: `${today.slice(0, 7)}-01`, to: today };
}

function rangeHeading(range: DateRange): string {
  if (range.from && range.to && range.from <= range.to) {
    if (range.from === range.to) {
      return formatDate(range.from);
    }

    return `${formatDate(range.from)} – ${formatDate(range.to)}`;
  }

  if (range.from) {
    return `${formatDate(range.from)} – …`;
  }

  return "All dates";
}

export default function ReportsPage() {
  const today = todayLocalISO();
  const [range, setRangeState] = useState<DateRange>(() => loadPersistedRange(today));
  const [sortKey, setSortKey] = useState<SortKey>("totalMinutes");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: rows, isPending } = useMonthlyReport({ from: range.from, to: range.to });

  function setRange(next: DateRange) {
    setRangeState(next);
    try {
      window.sessionStorage.setItem(REPORT_RANGE_KEY, JSON.stringify(next));
    } catch {
      // A blocked storage must not break the page.
    }
  }

  const sortedRows = useMemo(() => {
    if (!rows) {
      return [];
    }

    return [...rows].sort((a, b) => {
      const result = compareRows(a, b, sortKey);
      return sortDir === "asc" ? result : -result;
    });
  }, [rows, sortKey, sortDir]);

  const totals = useMemo(() => {
    return (rows ?? []).reduce(
      (acc, row) => ({
        daysPresent: acc.daysPresent + row.daysPresent,
        daysAbsent: acc.daysAbsent + row.daysAbsent,
        totalMinutes: acc.totalMinutes + row.totalMinutes,
        forgottenCheckOuts: acc.forgottenCheckOuts + row.forgottenCheckOuts,
      }),
      { daysPresent: 0, daysAbsent: 0, totalMinutes: 0, forgottenCheckOuts: 0 },
    );
  }, [rows]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Attendance summary per employee.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Print
          </Button>
          <ExportMenu
            endpoint="attendance/reports/monthly/export"
            params={{ from: range.from, to: range.to }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Date range</span>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <h2 className="text-lg font-semibold">{rangeHeading(range)}</h2>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No data for this period"
          description="There is no attendance data in the selected date range."
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader
                  label="Employee"
                  sortKey="name"
                  activeKey={sortKey}
                  activeDir={sortDir}
                  onSort={handleSort}
                />
                {SORTABLE_COLUMNS.map((column) => (
                  <SortHeader
                    key={column.key}
                    label={column.label}
                    sortKey={column.key}
                    activeKey={sortKey}
                    activeDir={sortDir}
                    numeric={column.numeric}
                    onSort={handleSort}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    {row.department ? (
                      <div className="text-xs text-muted-foreground">{row.department}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.daysPresent}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.daysAbsent}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDuration(row.totalMinutes)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDuration(row.averageMinutesPerDay)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.forgottenCheckOuts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {totals.daysPresent}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {totals.daysAbsent}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatDuration(totals.totalMinutes)}
                </TableCell>
                <TableCell className="text-right" />
                <TableCell className="text-right font-semibold tabular-nums">
                  {totals.forgottenCheckOuts}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
