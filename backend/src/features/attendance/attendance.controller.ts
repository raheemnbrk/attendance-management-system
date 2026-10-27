import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { asyncHandler } from "../../shared/utils/async-handler";
import {
  checkIn,
  checkOut,
  getAttendanceSummary,
  getEmployeeReport,
  getEmployerEmployeeAttendance,
  getMonthlyReport,
  getToday,
  listEmployerAttendance,
  listMyAttendance,
} from "./attendance.service";
import {
  employeeListQuerySchema,
  employeeReportQuerySchema,
  historyQuerySchema,
  monthlyReportQuerySchema,
  summaryQuerySchema,
} from "./attendance.schema";
import type { CheckInInput } from "./attendance.schema";

export const checkInHandler = asyncHandler(
  async (req: Request<ParamsDictionary, unknown, CheckInInput>, res: Response) => {
    const result = await checkIn(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  },
);

export const checkOutHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await checkOut(req.user!.id);
  res.status(200).json({ success: true, data: result });
});

export const todayHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getToday(req.user!.id);
  res.status(200).json({ success: true, data: result });
});

export const myHistoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = historyQuerySchema.parse(req.query);
  const result = await listMyAttendance(req.user!.id, query);
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
