import { z } from "zod";
import type { UsersQuery } from "./users.types";

export const DEFAULT_USERS_QUERY: UsersQuery = {
  search: "",
  role: "all",
  status: "all",
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
};

// URL query contract of /admin/users; invalid or missing params fall back to
// their default so a hand-edited or stale URL can never break the page.
export const usersQuerySchema = z.object({
  search: z.string().trim().max(100).catch(DEFAULT_USERS_QUERY.search),
  role: z
    .enum(["ADMIN", "EMPLOYER", "EMPLOYEE", "all"])
    .catch(DEFAULT_USERS_QUERY.role),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "all"])
    .catch(DEFAULT_USERS_QUERY.status),
  page: z.coerce.number().int().min(1).catch(DEFAULT_USERS_QUERY.page),
  limit: z.coerce.number().int().min(1).max(50).catch(DEFAULT_USERS_QUERY.limit),
  sortBy: z.enum(["name", "createdAt"]).catch(DEFAULT_USERS_QUERY.sortBy),
  sortOrder: z.enum(["asc", "desc"]).catch(DEFAULT_USERS_QUERY.sortOrder),
});
