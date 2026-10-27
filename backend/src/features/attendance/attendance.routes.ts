import { Router } from "express";
import { authenticate, requireApproved, requireRole } from "../../shared/middleware/auth.middleware";
import { attendanceLimiter } from "../../shared/middleware/rate-limit.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import {
  checkInHandler,
  checkOutHandler,
  employeeHistoryHandler,
  employeeListHandler,
  myHistoryHandler,
  summaryHandler,
  todayHandler,
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
