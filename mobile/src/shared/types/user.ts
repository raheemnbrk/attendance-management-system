export type Role = "ADMIN" | "EMPLOYER" | "EMPLOYEE";

export type AccountStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Public summary of the employer linked to an employee account, as returned
 * by login and /users/me for EMPLOYEE users. */
export type EmployerSummary = {
  id: string;
  name: string;
  company: string | null;
};

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
  employer: EmployerSummary | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};
