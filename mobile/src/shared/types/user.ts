export type Role = "ADMIN" | "EMPLOYER" | "EMPLOYEE";

export type AccountStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Shape of the public user object the API returns (no password hash). */
export type AppUser = {
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
  mustChangePassword: boolean;
  createdAt: string;
};
