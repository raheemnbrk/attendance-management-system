"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarRange, Printer } from "lucide-react";
import { format, parseISO } from "date-fns";
import { todayLocalISO } from "@/shared/lib/format";
import { formatDuration, formatMonth } from "@/shared/lib/format";
import type { MonthlyReportRow } from "@/features/attendance/attendance.types";
import { useMonthlyReport } from "@/features/attendance/use-attendance";
import { EmptyState } from "@/shared/components/empty-state";
import { ExportMenu } from "@/shared/components/export-menu";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
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

// Month selector built on the shadcn calendar: pick any day of a month and
// the month (yyyy-MM) is derived, with dropdown navigation for quick jumps.
function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(`${month}-01T00:00:00`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start font-normal" title="Select month">
          <CalendarRange aria-hidden="true" />
          {formatMonth(month)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM"));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function ReportsPage() {
  const [month, setMonth] = useState(() => todayLocalISO().slice(0, 7));
  const [sortKey, setSortKey] = useState<SortKey>("totalMinutes");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: rows, isPending } = useMonthlyReport(month);

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
          <p className="text-sm text-muted-foreground">Monthly summary per employee.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Print
          </Button>
          <ExportMenu endpoint="attendance/reports/monthly/export" params={{ month }} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Month</span>
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      <h2 className="text-lg font-semibold">{formatMonth(month)}</h2>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No data for this month"
          description="There is no attendance data for the selected month."
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
