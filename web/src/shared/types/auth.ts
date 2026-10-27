export type Role = "ADMIN" | "EMPLOYER" | "EMPLOYEE";

export type AccountStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  company: string | null;
  status: AccountStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  employerId: string | null;
  isActive: boolean;
  createdAt: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = TokenPair & {
  user: AuthUser;
};
