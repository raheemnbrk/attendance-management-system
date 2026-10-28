import { Router } from "express";
import { validate } from "../../shared/middleware/validate.middleware";
import { authenticate, requireApproved, requireRole } from "../../shared/middleware/auth.middleware";
import { authLimiter, employerWriteLimiter, registerLimiter } from "../../shared/middleware/rate-limit.middleware";
import {
  activateEmployeeHandler,
  approveEmployerHandler,
  changePasswordHandler,
  createEmployeeHandler,
  deactivateEmployeeHandler,
  getEmployeeHandler,
  listEmployeesHandler,
  listEmployersHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerEmployerHandler,
  rejectEmployerHandler,
  resetEmployeePasswordHandler,
  updateEmployeeHandler,
  updateProfileHandler,
} from "./user.controller";
import {
  changePasswordSchema,
  createEmployeeSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerEmployerSchema,
  rejectEmployerSchema,
  resetEmployeePasswordSchema,
  updateEmployeeSchema,
  updateProfileSchema,
} from "./user.schema";

export const userRouter = Router();

userRouter.post("/login", authLimiter, validate(loginSchema), loginHandler);
userRouter.post("/refresh", authLimiter, validate(refreshSchema), refreshHandler);
userRouter.post("/logout", validate(logoutSchema), logoutHandler);
userRouter.post("/register-employer", registerLimiter, validate(registerEmployerSchema), registerEmployerHandler);

const adminOnly = [authenticate, requireRole("ADMIN")] as const;
const employerOnly = [authenticate, requireRole("EMPLOYER"), requireApproved] as const;

userRouter.get("/me", authenticate, meHandler);
userRouter.patch("/me", authenticate, employerWriteLimiter, validate(updateProfileSchema), updateProfileHandler);
userRouter.patch("/me/password", authenticate, employerWriteLimiter, validate(changePasswordSchema), changePasswordHandler);

userRouter.get("/employers", ...adminOnly, listEmployersHandler);
userRouter.patch("/employers/:id/approve", ...adminOnly, approveEmployerHandler);
userRouter.patch("/employers/:id/reject", ...adminOnly, validate(rejectEmployerSchema), rejectEmployerHandler);

userRouter.post("/employees", ...employerOnly, employerWriteLimiter, validate(createEmployeeSchema), createEmployeeHandler);
userRouter.get("/employees", ...employerOnly, listEmployeesHandler);
userRouter.get("/employees/:id", ...employerOnly, getEmployeeHandler);
userRouter.patch("/employees/:id", ...employerOnly, employerWriteLimiter, validate(updateEmployeeSchema), updateEmployeeHandler);
userRouter.patch("/employees/:id/reset-password", ...employerOnly, employerWriteLimiter, validate(resetEmployeePasswordSchema), resetEmployeePasswordHandler);
userRouter.patch("/employees/:id/deactivate", ...employerOnly, employerWriteLimiter, deactivateEmployeeHandler);
userRouter.patch("/employees/:id/activate", ...employerOnly, employerWriteLimiter, activateEmployeeHandler);
