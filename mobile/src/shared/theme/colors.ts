export type ColorSchemeName = "light" | "dark";

export type ThemeColors = {
  background: string;
  card: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  destructive: string;
  destructiveForeground: string;
  destructiveSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  skeleton: string;
  overlay: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  foreground: "#0F172A",
  muted: "#F1F5F9",
  mutedForeground: "#64748B",
  border: "#E2E8F0",
  primary: "#0F766E",
  primaryForeground: "#FFFFFF",
  primarySoft: "#CCFBF1",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  destructiveSoft: "#FEE2E2",
  success: "#16A34A",
  successSoft: "rgba(22, 163, 74, 0.14)",
  warning: "#F59E0B",
  warningSoft: "rgba(245, 158, 11, 0.16)",
  info: "#2563EB",
  infoSoft: "rgba(37, 99, 235, 0.10)",
  skeleton: "#E2E8F0",
  overlay: "rgba(15, 23, 42, 0.45)",
  shadow: "#0F172A",
};

export const darkColors: ThemeColors = {
  background: "#0B1120",
  card: "#111827",
  foreground: "#F1F5F9",
  muted: "#1E293B",
  mutedForeground: "#94A3B8",
  border: "#1F2937",
  primary: "#2DD4BF",
  primaryForeground: "#042F2E",
  primarySoft: "#0F2F2C",
  destructive: "#F87171",
  destructiveForeground: "#0B1120",
  destructiveSoft: "rgba(248, 113, 113, 0.14)",
  success: "#22C55E",
  successSoft: "rgba(34, 197, 94, 0.16)",
  warning: "#FBBF24",
  warningSoft: "rgba(251, 191, 36, 0.16)",
  info: "#60A5FA",
  infoSoft: "rgba(96, 165, 250, 0.14)",
  skeleton: "#1E293B",
  overlay: "rgba(0, 0, 0, 0.60)",
  shadow: "#000000",
};

export const palettes: Record<ColorSchemeName, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 34,
} as const;

export const hitSlop = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
} as const;
