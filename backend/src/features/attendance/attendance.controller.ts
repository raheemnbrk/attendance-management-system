import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { asyncHandler } from "../../shared/utils/async-handler";
import { exportAttendanceRecords, exportMonthlyReport } from "./attendance-export.service";
import {
  checkIn,
  checkOut,
  getAttendanceSummary,
  getEmployeeReport,
  getEmployerEmployeeAttendance,
  getMonthlyReport,
  getMyMonthlySummary,
  getMyWeekSummary,
  getToday,
  getTrend,
  listEmployerAttendance,
  listMyAttendance,
} from "./attendance.service";
import { createEntryToken } from "./qr-token";
import {
  attendanceExportQuerySchema,
  employeeListQuerySchema,
  employeeReportQuerySchema,
  historyQuerySchema,
  monthlyReportExportQuerySchema,
  monthlyReportQuerySchema,
  mySummaryQuerySchema,
  summaryQuerySchema,
  trendQuerySchema,
} from "./attendance.schema";
import type { CheckInInput, CheckOutInput } from "./attendance.schema";

// The employee's employer is resolved by the auth middleware; it scopes which
// entrance QR tokens the employee may scan.
function employerIdOf(req: Request): string | null {
  return req.user!.employer?.id ?? null;
}

// The mobile app must never trust the phone clock, so attendance responses
// carry the server timestamp alongside the usual { success, data } body.
export const checkInHandler = asyncHandler(
  async (req: Request<ParamsDictionary, unknown, CheckInInput>, res: Response) => {
    const result = await checkIn(req.user!.id, employerIdOf(req), req.body);
    res.status(201).json({ success: true, data: result, serverTime: new Date().toISOString() });
  },
);

export const checkOutHandler = asyncHandler(
  async (req: Request<ParamsDictionary, unknown, CheckOutInput>, res: Response) => {
    const result = await checkOut(req.user!.id, employerIdOf(req), req.body);
    res.status(200).json({ success: true, data: result, serverTime: new Date().toISOString() });
  },
);

// One short-lived token per call (the screen refreshes it before expiry).
export const entryQrHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = createEntryToken(req.user!.id);
  res.status(200).json({ success: true, data: result });
});

export const todayHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getToday(req.user!.id);
  res.status(200).json({ success: true, data: result, serverTime: new Date().toISOString() });
});

export const myHistoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = historyQuerySchema.parse(req.query);
  const result = await listMyAttendance(req.user!.id, query);
  res.status(200).json({ success: true, data: result });
});

export const myMonthlySummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = mySummaryQuerySchema.parse(req.query);
  const result = await getMyMonthlySummary(req.user!.id, query.month);
  res.status(200).json({ success: true, data: result });
});

export const myWeekSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getMyWeekSummary(req.user!.id);
  res.status(200).json({ success: true, data: result });
});

export const employeeListHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = employeeListQuerySchema.parse(req.query);
  const result = await listEmployerAttendance(req.user!.id, query);
  res.status(200).json({ success: true, data: result });
});

export const employeeHistoryHandler = asyncHandler(
  async (req: Request<{ employeeId: string }>, res: Response) => {
    const query = historyQuerySchema.parse(req.query);
    const result = await getEmployerEmployeeAttendance(req.user!.id, req.params.employeeId, query);
    res.status(200).json({ success: true, data: result });
  },
);

export const summaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = summaryQuerySchema.parse(req.query);
  const result = await getAttendanceSummary(req.user!.id, query);
  res.status(200).json({ success: true, data: result });
});

export const monthlyReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = monthlyReportQuerySchema.parse(req.query);
  const result = await getMonthlyReport(req.user!.id, query.month);
  res.status(200).json({ success: true, data: result });
});

export const employeeReportHandler = asyncHandler(
  async (req: Request<{ employeeId: string }>, res: Response) => {
    const query = employeeReportQuerySchema.parse(req.query);
    const result = await getEmployeeReport(req.user!.id, req.params.employeeId, query);
    res.status(200).json({ success: true, data: result });
  },
);

export const trendHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = trendQuerySchema.parse(req.query);
  const result = await getTrend(req.user!.id, query.days);
  res.status(200).json({ success: true, data: result });
});

function sendExportFile(res: Response, file: { filename: string; contentType: string; content: Buffer }) {
  res
    .status(200)
    .setHeader("Content-Type", file.contentType)
    .setHeader("Content-Disposition", `attachment; filename="${file.filename}"`)
    .send(file.content);
}

export const attendanceExportHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = attendanceExportQuerySchema.parse(req.query);
  const file = await exportAttendanceRecords(req.user!.id, query);
  sendExportFile(res, file);
});

export const monthlyReportExportHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = monthlyReportExportQuerySchema.parse(req.query);
  const file = await exportMonthlyReport(req.user!.id, query);
  sendExportFile(res, file);
});
