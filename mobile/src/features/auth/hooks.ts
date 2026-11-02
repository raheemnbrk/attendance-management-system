import { useMutation } from "@tanstack/react-query";
import { useSession } from "./session-store";
import {
  changePasswordRequest,
  loginRequest,
  logoutDeviceRequest,
  type LoginResponse,
  type PasswordRotationResponse,
} from "./api";
import type { ChangePasswordValues, LoginValues } from "./schema";

/** Runs the login request and, for employees only, persists the session.
 * Non-employee roles are rejected by the caller through the returned role. */
export function useLogin() {
  const { signIn } = useSession();

  return useMutation<LoginResponse, unknown, LoginValues>({
    mutationFn: async (values) => {
      const response = await loginRequest(values);
      const { accessToken, refreshToken, role, user } = response.data;
      if (role !== "EMPLOYEE") {
        return response.data;
      }
      await signIn({ accessToken, refreshToken }, user);
      return response.data;
    },
  });
}

/** Forces a password change and stores the freshly issued token pair. */
export function useChangePassword() {
  const { updateTokens } = useSession();

  return useMutation<PasswordRotationResponse, unknown, ChangePasswordValues>({
    mutationFn: async (values) => {
      const response = await changePasswordRequest(values);
      const { accessToken, refreshToken } = response.data;
      await updateTokens({ accessToken, refreshToken });
      return response.data;
    },
  });
}

/** Revokes the refresh token on the server (best effort), then clears the
 * local session whatever the outcome. */
export function useLogout() {
  const { session, signOut } = useSession();

  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      try {
        await logoutDeviceRequest(session?.tokens.refreshToken ?? null);
      } catch {
        // The token may already be revoked or the network down; the local
        // session is cleared regardless.
      }
      await signOut();
    },
  });
}
