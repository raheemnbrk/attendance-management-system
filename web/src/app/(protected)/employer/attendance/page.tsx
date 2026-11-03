"use client";

import { CalendarDays, MapPin, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  UNASSIGNED_DEPARTMENT,
  type ListAttendanceQuery,
} from "@/features/attendance/attendance.service";
import { getAttendanceStatus } from "@/features/attendance/attendance.types";
import type { EmployeeAttendanceRecord } from "@/features/attendance/attendance.types";
import { useEmployerAttendance } from "@/features/attendance/use-attendance";
import { useEmployerDepartments } from "@/features/employees/use-employees";
import { DateRangePicker, type DateRange } from "@/shared/components/date-range-picker";
import { EmptyState } from "@/shared/components/empty-state";
import { ExportMenu } from "@/shared/components/export-menu";
import { StatusBadge } from "@/shared/components/status-badge";
import { TablePagination } from "@/shared/components/table-pagination";
import { formatDate, formatDuration, formatTime, mapLink, todayLocalISO } from "@/shared/lib/format";
import { Input } from "@/shared/ui/input";
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

const ALL_DEPARTMENTS = "all";

// Filters live in the URL (?dept=&q=&from=&to=, client-only) so they survive a
// refresh and can be shared — same replaceState pattern as the admin employers
// page.
function syncFiltersToUrl(query: Pick<ListAttendanceQuery, "department" | "search">, range: DateRange) {
  const params = new URLSearchParams();

  if (query.department && query.department !== ALL_DEPARTMENTS) {
    params.set("dept", query.department);
  }
  if (query.search) {
    params.set("q", query.search);
  }
  if (range.from) {
    params.set("from", range.from);
  }
  if (range.to) {
    params.set("to", range.to);
  }

  const search = params.toString();
  window.history.replaceState(null, "", search ? `/employer/attendance?${search}` : "/employer/attendance");
}

export default function AttendancePage() {
  const today = todayLocalISO();

  const [range, setRange] = useState<DateRange>({});
  const [department, setDepartment] = useState<string>(ALL_DEPARTMENTS);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: departmentsData } = useEmployerDepartments();

  // Restore filters from the URL (matches the admin employers page pattern).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get("dept");
    const q = params.get("q");

    if (dept) {
      setDepartment(dept);
    }
    if (q) {
      setSearchInput(q);
      setSearch(q);
    }
  }, []);

  // Debounce: only query once typing pauses for 300ms.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const hasFilters = Boolean(range.from || range.to || department !== ALL_DEPARTMENTS || search);

  function writeFilters(nextQuery: Pick<ListAttendanceQuery, "department" | "search">, nextRange: DateRange) {
    syncFiltersToUrl(nextQuery, nextRange);
  }

  function handleRangeChange(next: DateRange) {
    setRange(next);
    setPage(1);
    writeFilters(
      { department, search },
      next,
    );
  }

  function handleDepartmentChange(next: string) {
    setDepartment(next);
    setPage(1);
    writeFilters({ department: next, search }, range);
  }

  function handleClearFilters() {
    setRange({});
    setDepartment(ALL_DEPARTMENTS);
    setSearchInput("");
    setSearch("");
    setPage(1);
    window.history.replaceState(null, "", "/employer/attendance");
  }

  const query = {
    page,
    limit: PAGE_SIZE,
    from: range.from,
    to: range.to,
    // The employer filter was replaced by department + search; the employeeId
    // query param stays supported by the API for the employee detail pages.
    department: department === ALL_DEPARTMENTS ? undefined : department,
    search: search || undefined,
  };
  const { data, isPending, isFetching } = useEmployerAttendance(query);

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
          endpoint="attendance/export"
          params={{
            from: range.from,
            to: range.to,
            department: department === ALL_DEPARTMENTS ? undefined : department,
            search: search || undefined,
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <DateRangePicker value={range} onChange={handleRangeChange} />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Department</span>
          <Select value={department} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DEPARTMENTS}>All departments</SelectItem>
              {(departmentsData?.departments ?? []).map((departmentName) => (
                <SelectItem key={departmentName} value={departmentName}>
                  {departmentName}
                </SelectItem>
              ))}
              {departmentsData?.unassigned ? (
                <SelectItem value={UNASSIGNED_DEPARTMENT}>Unassigned</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Search</span>
          <div className="relative w-72">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name or email"
              className="pl-8 pr-8"
              aria-label="Search attendance by employee name or email"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={handleClearFilters}
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
          title={hasFilters ? "No matching records" : "No attendance records yet"}
          description={
            hasFilters
              ? "No records match the selected department, search or date range."
              : "Check-ins will appear here as your team uses the app."
          }
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Clear filters
              </button>
            ) : null
          }
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
