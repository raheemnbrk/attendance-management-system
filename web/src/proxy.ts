import { NextResponse, type NextRequest } from "next/server";
import {
  ROLE_COOKIE_NAME,
  getDashboardPath,
  isAdminPath,
  isEmployerPath,
} from "@/shared/lib/dashboard-path";

// Role-based access at the edge (the Next 16 successor of middleware.ts):
// an EMPLOYER opening /admin/* is sent to their own dashboard and an ADMIN
// opening /employer/* theirs — never a 403 page. The role comes from the
// non-sensitive session cookie the web client sets on sign in / sign out.
//
// Unknown cases (no role cookie yet — e.g. the session is still being
// restored client-side) fall through to the client-side route guards, which
// finish the same redirect once the role is known.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminPath(pathname) && !isEmployerPath(pathname)) {
    return NextResponse.next();
  }

  // /admin/* is admin-only, /employer/* employer-only; any other known role
  // (ADMIN, EMPLOYER, EMPLOYEE) gets redirected where it belongs.
  const expectedRole = isAdminPath(pathname) ? "ADMIN" : "EMPLOYER";
  const role = request.cookies.get(ROLE_COOKIE_NAME)?.value;

  if (role && role !== expectedRole) {
    return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employer/:path*"],
};
