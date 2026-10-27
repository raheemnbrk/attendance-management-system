import ExcelJS from "exceljs";
import { prisma } from "../../shared/lib/prisma";
import { AppError } from "../../shared/utils/app-error";
import {
  formatDateTimeTz,
  isoAddDays,
  isoToUtcMidnight,
  todayISO,
  utcDateToISO,
} from "../../shared/utils/date";
import { findOwnedEmployeeOrThrow, getMonthlyReport } from "./attendance.service";
import type {
  AttendanceExportQuery,
  ExportFormat,
  MonthlyReportExportQuery,
} from "./attendance.schema";

const CSV_MIME = "text/csv; charset=utf-8";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// UTF-8 BOM so Excel renders accents and Arabic correctly.
const CSV_BOM = "\uFEFF";

const MAX_EXPORT_DAYS = 366;

type CellValue = string | number | null; // null renders as an empty cell

export type ExportFile = {
  filename: string;
  contentType: string;
  content: Buffer;
};

// A text cell starting with = + - or @ would be evaluated as a formula by
// Excel; a leading apostrophe defuses it (CSV injection protection).
function csvCell(value: CellValue): string {
  if (value === null) {
    return "";
  }

  let text = typeof value === "number" ? String(value) : value;

  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsv(headers: string[], rows: CellValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return CSV_BOM + lines.join("\r\n");
}

async function buildXlsx(headers: string[], rows: CellValue[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(row);
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function buildFile(
  headers: string[],
  rows: CellValue[][],
  format: ExportFormat,
  filename: string,
): Promise<ExportFile> {
  if (format === "csv") {
    return Promise.resolve({
      filename,
      contentType: CSV_MIME,
      content: Buffer.from(buildCsv(headers, rows), "utf8"),
    });
  }

  return buildXlsx(headers, rows).then((content) => ({
    filename,
    contentType: XLSX_MIME,
    content,
  }));
}

// Fills in the default window (last 30 days ending today, in TZ) and throws
// when the resulting range exceeds the 366-day export limit.
function resolveExportRange(query: AttendanceExportQuery): { from: string; to: string } {
  const to = query.to ?? todayISO();
  const from = query.from ?? isoAddDays(to, -29);
  const dayCount =
    (isoToUtcMidnight(to).getTime() - isoToUtcMidnight(from).getTime()) / 86_400_000 + 1;

  if (dayCount > MAX_EXPORT_DAYS) {
    throw new AppError(400, `Date range must be at most ${MAX_EXPORT_DAYS} days`);
  }

  return { from, to };
}

const RECORD_HEADERS = [
  "Employee Name",
  "Department",
  "Date",
  "Check In",
  "Check Out",
  "Worked Minutes",
  "Latitude",
  "Longitude",
];

export async function exportAttendanceRecords(
  employerId: string,
  query: AttendanceExportQuery,
): Promise<ExportFile> {
  const { from, to } = resolveExportRange(query);

  if (query.employeeId) {
    await findOwnedEmployeeOrThrow(employerId, query.employeeId);
  }

  const records = await prisma.attendance.findMany({
    where: {
      user: {
        employerId,
        role: "EMPLOYEE" as const,
        ...(query.employeeId ? { id: query.employeeId } : {}),
      },
      date: { gte: isoToUtcMidnight(from), lte: isoToUtcMidnight(to) },
    },
    include: { user: { select: { name: true, department: true } } },
    orderBy: [{ date: "desc" }, { checkIn: "asc" }],
  });

  const rows: CellValue[][] = records.map((record) => [
    record.user.name,
    record.user.department ?? null,
    utcDateToISO(record.date),
    formatDateTimeTz(record.checkIn),
    record.checkOut ? formatDateTimeTz(record.checkOut) : null,
    record.checkOut
      ? Math.round((record.checkOut.getTime() - record.checkIn.getTime()) / 60_000)
      : null,
    record.latitude,
    record.longitude,
  ]);

  return buildFile(RECORD_HEADERS, rows, query.format, `attendance_${from}_${to}.${query.format}`);
}

const MONTHLY_HEADERS = [
  "Employee Name",
  "Department",
  "Days Present",
  "Days Absent",
  "Total Minutes",
  "Average Minutes Per Day",
  "Forgotten Check-outs",
];

export async function exportMonthlyReport(
  employerId: string,
  query: MonthlyReportExportQuery,
): Promise<ExportFile> {
  const report = await getMonthlyReport(employerId, query.month);

  const rows: CellValue[][] = report.map((row) => [
    row.name,
    row.department,
    row.daysPresent,
    row.daysAbsent,
    row.totalMinutes,
    row.averageMinutesPerDay,
    row.forgottenCheckOuts,
  ]);

  return buildFile(
    MONTHLY_HEADERS,
    rows,
    query.format,
    `attendance_monthly_${query.month}.${query.format}`,
  );
}
