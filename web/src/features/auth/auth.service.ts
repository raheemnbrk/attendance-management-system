import { apiRequest } from "@/shared/lib/api";
import type { AuthUser, LoginResponse, TokenPair } from "@/shared/types/auth";
import type { LoginInput, RegisterEmployerInput } from "./auth.schema";

export async function login(input: LoginInput): Promise<LoginResponse> {
  return apiRequest<LoginResponse>({ method: "POST", url: "/users/login", data: input });
}

// New employer accounts start as PENDING until an admin approves them.
export async function registerEmployer(input: RegisterEmployerInput): Promise<{ userId: string }> {
  return apiRequest<{ userId: string }>({
    method: "POST",
    url: "/users/register-employer",
    data: input,
  });
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  return apiRequest<TokenPair>({
    method: "POST",
    url: "/users/refresh",
    data: { refreshToken },
  });
}

export async function logout(refreshToken: string): Promise<void> {
  await apiRequest<null>({ method: "POST", url: "/users/logout", data: { refreshToken } });
}

export async function me(): Promise<AuthUser> {
  return apiRequest<AuthUser>({ method: "GET", url: "/users/me" });
}
