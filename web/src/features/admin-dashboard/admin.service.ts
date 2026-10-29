import { apiRequest } from "@/shared/lib/api";

export type PlatformStats = {
  employers: {
    pending: number;
    approved: number;
    rejected: number;
  };
  totalEmployees: number;
  checkInsToday: number;
};

export type TrendEntry = {
  date: string;
  count: number;
};

export type PlatformTrends = {
  registrations: TrendEntry[];
  checkIns: TrendEntry[];
};

export type AdminActivityType =
  | "EMPLOYER_REGISTERED"
  | "EMPLOYER_APPROVED"
  | "EMPLOYER_REJECTED";

export type AdminActivityEvent = {
  type: AdminActivityType;
  employerId: string;
  employerName: string;
  company: string | null;
  at: string;
};

export async function fetchAdminStats(): Promise<PlatformStats> {
  return apiRequest<PlatformStats>({
    method: "GET",
    url: "/users/stats",
  });
}

export async function fetchAdminTrends(days: 7 | 30): Promise<PlatformTrends> {
  return apiRequest<PlatformTrends>({
    method: "GET",
    url: "/users/stats/trends",
    params: { days },
  });
}

export async function fetchAdminActivity(limit = 10): Promise<AdminActivityEvent[]> {
  return apiRequest<AdminActivityEvent[]>({
    method: "GET",
    url: "/users/activity",
    params: { limit },
  });
}
