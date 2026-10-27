import { Router } from "express";
import { authenticate, requireApproved, requireRole } from "../../shared/middleware/auth.middleware";
import { attendanceLimiter } from "../../shared/middleware/rate-limit.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import {
  attendanceExportHandler,
  checkInHandler,
  checkOutHandler,
  employeeHistoryHandler,
  employeeListHandler,
  employeeReportHandler,
  monthlyReportExportHandler,
  monthlyReportHandler,
  myHistoryHandler,
  summaryHandler,
  todayHandler,
  trendHandler,
} from "./attendance.controller";
import { checkInSchema } from "./attendance.schema";

export const attendanceRouter = Router();

const employeeOnly = [authenticate, requireRole("EMPLOYEE")] as const;
const employerOnly = [authenticate, requireRole("EMPLOYER"), requireApproved] as const;

attendanceRouter.post("/check-in", ...employeeOnly, attendanceLimiter, validate(checkInSchema), checkInHandler);
attendanceRouter.post("/check-out", ...employeeOnly, attendanceLimiter, checkOutHandler);
attendanceRouter.get("/today", ...employeeOnly, todayHandler);
attendanceRouter.get("/me", ...employeeOnly, myHistoryHandler);

attendanceRouter.get("/employees", ...employerOnly, employeeListHandler);
attendanceRouter.get("/employees/:employeeId", ...employerOnly, employeeHistoryHandler);
attendanceRouter.get("/summary", ...employerOnly, summaryHandler);

attendanceRouter.get("/reports/monthly", ...employerOnly, monthlyReportHandler);
attendanceRouter.get("/reports/monthly/export", ...employerOnly, monthlyReportExportHandler);
attendanceRouter.get("/reports/employee/:employeeId", ...employerOnly, employeeReportHandler);
attendanceRouter.get("/trend", ...employerOnly, trendHandler);
attendanceRouter.get("/export", ...employerOnly, attendanceExportHandler);
