"use client";

import { useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { getAttendanceStatus } from "@/features/attendance/attendance.types";
import type { EmployeeAttendanceRecord } from "@/features/attendance/attendance.types";
import { useEmployerAttendance } from "@/features/attendance/use-attendance";
import { useEmployees } from "@/features/employees/use-employees";
import { DateRangePicker, type DateRange } from "@/shared/components/date-range-picker";
import { EmptyState } from "@/shared/components/empty-state";
import { ExportMenu } from "@/shared/components/export-menu";
import { StatusBadge } from "@/shared/components/status-badge";
import { TablePagination } from "@/shared/components/table-pagination";
import { formatDate, formatDuration, formatTime, mapLink, todayLocalISO } from "@/shared/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const PAGE_SIZE = 15;

export default function AttendancePage() {
  const today = todayLocalISO();

  const [range, setRange] = useState<DateRange>({});
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: employees } = useEmployees();

  const query = {
    page,
    limit: PAGE_SIZE,
    from: range.from,
    to: range.to,
    employeeId: employeeId === "all" ? undefined : employeeId,
  };
  const { data, isPending, isFetching } = useEmployerAttendance(query);

  function handleRangeChange(next: DateRange) {
    setRange(next);
    setPage(1);
  }

  function handleEmployeeChange(next: string) {
    setEmployeeId(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Check-in history across your team.
          </p>
        </div>
        <ExportMenu
          endpoint="export"
          params={{
            from: range.from,
            to: range.to,
            employeeId: employeeId === "all" ? undefined : employeeId,
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <DateRangePicker value={range} onChange={handleRangeChange} />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Employee</span>
          <Select value={employeeId} onValueChange={handleEmployeeChange}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {(employees ?? []).map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {range.from || range.to || employeeId !== "all" ? (
          <button
            type="button"
            onClick={() => {
              setRange({});
              setEmployeeId("all");
              setPage(1);
            }}
            className="mb-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* Table */}
      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No attendance records"
          description="No records match the selected filters."
        />
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Worked</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={isFetching ? "opacity-60 transition-opacity" : undefined}>
                {data.items.map((record: EmployeeAttendanceRecord) => {
                  const mapsUrl = mapLink(record.latitude, record.longitude);

                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.employee.name}</div>
                        {record.employee.department ? (
                          <div className="text-xs text-muted-foreground">
                            {record.employee.department}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>{formatTime(record.checkIn)}</TableCell>
                      <TableCell>
                        {record.checkOut ? (
                          formatTime(record.checkOut)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDuration(record.workedMinutes ?? null)}</TableCell>
                      <TableCell>
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-info-foreground underline-offset-4 hover:underline"
                            title={`${record.latitude}, ${record.longitude}`}
                          >
                            <MapPin className="size-4" aria-hidden="true" />
                            <span className="sr-only">Open location in Google Maps</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={getAttendanceStatus(record.employee, record, today)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {data.total} record{data.total === 1 ? "" : "s"}
              {range.from || range.to ? (
                <span>
                  {" "}
                  · {range.from ? formatDate(range.from) : "…"} – {range.to ? formatDate(range.to) : "…"}
                </span>
              ) : null}
            </p>
            <TablePagination
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
