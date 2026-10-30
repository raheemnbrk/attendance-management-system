import { Router } from "express";
import { validate } from "../../shared/middleware/validate.middleware";
import { authenticate, requireRole } from "../../shared/middleware/auth.middleware";
import { adminLimiter } from "../../shared/middleware/rate-limit.middleware";
import {
  activityHandler,
  approveEmployerHandler,
  getEmployerHandler,
  listEmployerEmployeesHandler,
  listEmployersHandler,
  reactivateEmployerHandler,
  rejectEmployerHandler,
  statsHandler,
  suspendEmployerHandler,
  trendsHandler,
  usersCountHandler,
  usersListHandler,
} from "./admin.controller";
import { rejectEmployerSchema } from "./admin.schema";

export const adminRouter = Router();

const adminOnly = [authenticate, requireRole("ADMIN")] as const;

adminRouter.get("/", ...adminOnly, adminLimiter, usersListHandler);
adminRouter.get("/counts", ...adminOnly, adminLimiter, usersCountHandler);
adminRouter.get("/stats", ...adminOnly, adminLimiter, statsHandler);
adminRouter.get("/stats/trends", ...adminOnly, adminLimiter, trendsHandler);
adminRouter.get("/activity", ...adminOnly, adminLimiter, activityHandler);

adminRouter.get("/employers", ...adminOnly, adminLimiter, listEmployersHandler);
adminRouter.get("/employers/:id", ...adminOnly, adminLimiter, getEmployerHandler);
adminRouter.get("/employers/:id/employees", ...adminOnly, adminLimiter, listEmployerEmployeesHandler);
adminRouter.patch("/employers/:id/approve", ...adminOnly, approveEmployerHandler);
adminRouter.patch("/employers/:id/reject", ...adminOnly, validate(rejectEmployerSchema), rejectEmployerHandler);
adminRouter.patch("/employers/:id/suspend", ...adminOnly, adminLimiter, suspendEmployerHandler);
adminRouter.patch("/employers/:id/reactivate", ...adminOnly, adminLimiter, reactivateEmployerHandler);
