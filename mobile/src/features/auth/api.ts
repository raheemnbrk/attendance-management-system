import { apiPatch, apiRequest, LOGIN_REQUEST_TIMEOUT_MS } from "@/shared/api/client";
import type { AppUser, Role } from "@/shared/types";
import type { ChangePasswordValues, LoginValues } from "./schema";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: Role;
  user: AppUser;
};

export type PasswordRotationResponse = {
  accessToken: string;
  refreshToken: string;
};

export function loginRequest(values: LoginValues): Promise<{ data: LoginResponse }> {
  return apiRequest<LoginResponse>({
    path: "/users/login",
    method: "POST",
    body: values,
    timeoutMs: LOGIN_REQUEST_TIMEOUT_MS,
    // Idempotent enough to repeat: a dropped cold-start connection must not
    // fail the whole login outright.
    retries: 1,
    // No token exists before login; a 401 here means bad credentials, not an
    // expired session, so the refresh/logout flow must stay out of the way.
    auth: false,
    skipAuthRefresh: true,
  });
}

export function changePasswordRequest(
  values: ChangePasswordValues,
): Promise<{ data: PasswordRotationResponse }> {
  // Tokens are re-issued: every old session (including this one) is revoked.
  return apiPatch<PasswordRotationResponse>("/users/me/password", {
    currentPassword: values.currentPassword,
    newPassword: values.newPassword,
  });
}

export function logoutDeviceRequest(refreshToken: string | null): Promise<unknown> {
  if (!refreshToken) {
    return Promise.resolve(null);
  }
  // No bearer token: the access token may already be unusable at this point.
  return apiRequest<null>({ path: "/users/logout", method: "POST", body: { refreshToken }, auth: false });
}
