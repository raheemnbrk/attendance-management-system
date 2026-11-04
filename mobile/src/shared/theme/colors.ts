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
  /** Skeleton placeholder base, close to the surface it sits on. */
  skeletonBase: string;
  /** Skeleton shimmer highlight, slightly lighter than skeletonBase. */
  skeletonHighlight: string;
  /** Slightly raised surface for inputs sitting inside a card. */
  surfaceElevated: string;
  /** Stronger border tone that stays visible over surfaceElevated. */
  borderStrong: string;
  /** Soft red reserved for inline, low-noise error labels. */
  destructiveText: string;
  overlay: string;
  shadow: string;
  /** Liquid glass navigation tokens (per scheme). */
  glassOverlay: string;
  glassBorder: string;
  glassHighlight: string;
};

export const lightColors: ThemeColors = {
  background: "#F6F8F8",
  card: "#FFFFFF",
  foreground: "#0F1F1F",
  muted: "#EEF3F3",
  mutedForeground: "#5B6B6B",
  border: "#E1E7E7",
  primary: "#0F766E",
  primaryForeground: "#FFFFFF",
  primarySoft: "#CCFBF1",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  destructiveSoft: "#FEE4E2",
  success: "#16A34A",
  successSoft: "rgba(22, 163, 74, 0.14)",
  warning: "#F59E0B",
  warningSoft: "rgba(245, 158, 11, 0.16)",
  info: "#2563EB",
  infoSoft: "rgba(37, 99, 235, 0.10)",
  skeletonBase: "#E5EAEA",
  skeletonHighlight: "#F2F5F5",
  surfaceElevated: "#FFFFFF",
  borderStrong: "#CBD5D5",
  destructiveText: "#B42318",
  overlay: "rgba(15, 23, 42, 0.45)",
  shadow: "#0F1F1F",
  glassOverlay: "rgba(255, 255, 255, 0.55)",
  glassBorder: "rgba(255, 255, 255, 0.7)",
  glassHighlight: "rgba(255, 255, 255, 0.25)",
};

export const darkColors: ThemeColors = {
  background: "#0B1212",
  card: "#121C1C",
  foreground: "#E8F0F0",
  muted: "#1B2727",
  mutedForeground: "#8FA3A3",
  border: "#223030",
  primary: "#2DD4BF",
  primaryForeground: "#042F2E",
  primarySoft: "#0F2F2C",
  destructive: "#F87171",
  destructiveForeground: "#0B1212",
  destructiveSoft: "rgba(240, 68, 56, 0.16)",
  success: "#22C55E",
  successSoft: "rgba(34, 197, 94, 0.16)",
  warning: "#FBBF24",
  warningSoft: "rgba(251, 191, 36, 0.16)",
  info: "#60A5FA",
  infoSoft: "rgba(96, 165, 250, 0.14)",
  skeletonBase: "#1F2A2A",
  skeletonHighlight: "#2A3838",
  surfaceElevated: "#0A0F0F",
  borderStrong: "#2A3A3A",
  destructiveText: "#FDA29B",
  overlay: "rgba(0, 0, 0, 0.60)",
  shadow: "#000000",
  glassOverlay: "rgba(18, 28, 28, 0.55)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  glassHighlight: "rgba(255, 255, 255, 0.10)",
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

