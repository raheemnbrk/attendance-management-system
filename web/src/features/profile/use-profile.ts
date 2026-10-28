"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth.store";
import { changePassword, updateProfile } from "./profile.service";
import type { ChangePasswordInput, UpdateProfileInput } from "./profile.service";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    // Keep the header menu (initials, name) in sync with the saved profile.
    onSuccess: (user) => useAuthStore.setState({ user }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
  });
}
