import type { User } from "@prisma/client";

/** Public summary of the employer linked to an employee account. Only these
 * fields are ever exposed, never the full employer user row. */
export type EmployerSummary = {
  id: string;
  name: string;
  company: string | null;
};

export type AuthUser = Omit<User, "passwordHash"> & {
  employer: EmployerSummary | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
