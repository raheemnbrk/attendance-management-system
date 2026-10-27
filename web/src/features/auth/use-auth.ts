"use client";

import { useMutation } from "@tanstack/react-query";
import { login as loginRequest, logout as logoutRequest } from "./auth.service";
import { getStoredRefreshToken, useAuthStore } from "./auth.store";
import type { LoginInput } from "./auth.schema";

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: LoginInput) => loginRequest(input),
    onSuccess: (data) =>
      setSession(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getStoredRefreshToken();

      if (refreshToken) {
        try {
          await logoutRequest(refreshToken);
        } catch {
          // The local session is cleared even if the server call fails.
        }
      }
    },
    onSettled: () => clearSession(),
  });
}
