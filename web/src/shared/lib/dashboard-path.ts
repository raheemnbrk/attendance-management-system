import type { Role } from "@/shared/types/auth";

// Non-sensitive session hint cookie: the user's role is needed on the server
// (proxy + layouts) to bounce users out of the other role's area. Tokens stay
// in memory/localStorage; only the role travels in a cookie.
export const ROLE_COOKIE_NAME = "attendance.role";

// 7 days — same lifetime the refresh token gets on sign in.
const ROLE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

// Single source of truth for every role-aware redirect: ADMIN and EMPLOYER go
// to their own dashboard; any other role (including no session) goes to /login
// because employee accounts use the mobile app.
export function getDashboardPath(role?: Role | string | null): string {
  if (role === "ADMIN") {
    return "/admin/dashboard";
  }

  if (role === "EMPLOYER") {
    return "/employer/dashboard";
  }

  return "/login";
}

// True when the path belongs to the admin area ("/admin/...").
export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// True when the path belongs to the employer area ("/employer/...").
export function isEmployerPath(pathname: string): boolean {
  return pathname === "/employer" || pathname.startsWith("/employer/");
}

// Cookie options shared by the server proxy matcher documentation and the
// client helpers; maxAge applies when the role is persisted from the client.
export const roleCookieOptions = `path=/; max-age=${ROLE_COOKIE_MAX_AGE}; samesite=lax`;
