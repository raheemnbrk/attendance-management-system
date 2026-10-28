import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { asyncHandler } from "../../shared/utils/async-handler";
import {
  approveEmployer,
  changePassword,
  createEmployee,
  getCurrentUser,
  getEmployee,
  listEmployers,
  listEmployees,
  login,
  logout,
  refresh,
  registerEmployer,
  rejectEmployer,
  resetEmployeePassword,
  setEmployeeActive,
  updateEmployee,
  updateProfile,
} from "./user.service";
import { employerStatusQuerySchema, listEmployeesQuerySchema } from "./user.schema";
import type {
  ChangePasswordInput,
  CreateEmployeeInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterEmployerInput,
  RejectEmployerInput,
  ResetEmployeePasswordInput,
  UpdateEmployeeInput,
  UpdateProfileInput,
} from "./user.schema";

export const loginHandler = asyncHandler(
  async (req: Request<ParamsDictionary, unknown, LoginInput>, res: Response) => {
    const result = await login(req.body);
    res.status(200).json({ success: true, data: result });
  },
);

export const refreshHandler = asyncHandler(
  async (req: Request<ParamsDictionary, unknown, RefreshInput>, res: Response) => {
    const result = await refresh(req.body);
    res.status(200).json({ success: true, data: result });
  },
);

export const logoutHandler = asyncHandler(
  async (req: Request<ParamsDictionary, unknown, LogoutInput>, res: Response) => {
    await logout(req.body);
    res.status(200).json({ success: true });
  },
);

export const registerEmployerHandler = asyncHandler(
  async (req: Request<ParamsDictionary, unknown, RegisterEmployerInput>, res: Response) => {
    await registerEmployer(req.body);
    res.status(201).json({
      success: true,
      message: "Registration submitted, awaiting admin approval",
    });
  },
);

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

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = getCurrentUser(req.user!);
  res.status(200).json({ success: true, data: result });
});

export const updateProfileHandler = asyncHandler(
  async (req: Request<unknown, unknown, UpdateProfileInput>, res: Response) => {
    const result = await updateProfile(req.user!, req.body);
    res.status(200).json({ success: true, data: result });
  },
);

export const changePasswordHandler = asyncHandler(
  async (req: Request<unknown, unknown, ChangePasswordInput>, res: Response) => {
    const result = await changePassword(req.user!, req.body);
    res.status(200).json({ success: true, data: result });
  },
);

export const createEmployeeHandler = asyncHandler(
  async (req: Request<unknown, unknown, CreateEmployeeInput>, res: Response) => {
    const result = await createEmployee(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  },
);

export const listEmployeesHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listEmployeesQuerySchema.parse(req.query);
  const result = await listEmployees(req.user!.id, query);
  res.status(200).json({ success: true, data: result });
});

export const getEmployeeHandler = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const result = await getEmployee(req.user!.id, req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const updateEmployeeHandler = asyncHandler(
  async (req: Request<{ id: string }, unknown, UpdateEmployeeInput>, res: Response) => {
    const result = await updateEmployee(req.user!.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  },
);

export const resetEmployeePasswordHandler = asyncHandler(
  async (req: Request<{ id: string }, unknown, ResetEmployeePasswordInput>, res: Response) => {
    const result = await resetEmployeePassword(req.user!.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  },
);

export const deactivateEmployeeHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const result = await setEmployeeActive(req.user!.id, req.params.id, false);
    res.status(200).json({ success: true, data: result });
  },
);

export const activateEmployeeHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const result = await setEmployeeActive(req.user!.id, req.params.id, true);
    res.status(200).json({ success: true, data: result });
  },
);
