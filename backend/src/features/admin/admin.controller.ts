import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { asyncHandler } from "../../shared/utils/async-handler";
import {
  approveEmployer,
  getAdminActivity,
  getAdminStats,
  getAdminTrends,
  getEmployerDetails,
  listAllUsers,
  listEmployerEmployees,
  listEmployers,
  listUserRoleCounts,
  rejectEmployer,
  setEmployerSuspended,
} from "./admin.service";
import {
  activityQuerySchema,
  employerEmployeesQuerySchema,
  employerStatusQuerySchema,
  trendsQuerySchema,
  userListQuerySchema,
} from "./admin.schema";
import type { RejectEmployerInput } from "./admin.schema";

export const statsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = await getAdminStats();
  res.status(200).json({ success: true, data: result });
});

export const trendsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = trendsQuerySchema.parse(req.query);
  const result = await getAdminTrends(query.days);
  res.status(200).json({ success: true, data: result });
});

export const activityHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = activityQuerySchema.parse(req.query);
  const result = await getAdminActivity(query.limit);
  res.status(200).json({ success: true, data: result });
});

export const getEmployerHandler = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const result = await getEmployerDetails(req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const listEmployerEmployeesHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const query = employerEmployeesQuerySchema.parse(req.query);
    const result = await listEmployerEmployees(req.params.id, query);
    res.status(200).json({ success: true, data: result });
  },
);

export const suspendEmployerHandler = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const result = await setEmployerSuspended(req.params.id, false);
  res.status(200).json({ success: true, data: result });
});

export const reactivateEmployerHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const result = await setEmployerSuspended(req.params.id, true);
    res.status(200).json({ success: true, data: result });
  },
);

export const usersListHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = userListQuerySchema.parse(req.query);
  const result = await listAllUsers(query);
  res.status(200).json({ success: true, data: result });
});

export const usersCountHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = await listUserRoleCounts();
  res.status(200).json({ success: true, data: result });
});

export const listEmployersHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = employerStatusQuerySchema.parse(req.query);
  const result = await listEmployers(query);
  res.status(200).json({ success: true, data: result });
});

export const approveEmployerHandler = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const result = await approveEmployer(req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const rejectEmployerHandler = asyncHandler(
  async (req: Request<{ id: string }, unknown, RejectEmployerInput>, res: Response) => {
    const result = await rejectEmployer(req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  },
);
