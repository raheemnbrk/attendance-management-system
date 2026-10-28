import { apiRequest } from "@/shared/lib/api";
import type { AuthUser } from "@/shared/types/auth";

export type UpdateProfileInput = {
  name: string;
  company: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  return apiRequest<AuthUser>({ method: "PATCH", url: "/users/me", data: input });
}

export async function changePassword(input: ChangePasswordInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>({
    method: "PATCH",
    url: "/users/me/password",
    data: input,
  });
}
