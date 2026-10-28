import { format, parseISO } from "date-fns";

// "Today" in the browser's local timezone as YYYY-MM-DD, matching what the
// backend expects for query params.
export function todayLocalISO(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function formatDate(isoDate: string): string {
  return format(parseISO(`${isoDate}T00:00:00`), "PP");
}

export function formatTime(isoDateTime: string): string {
  return format(parseISO(isoDateTime), "h:mm a");
}

export function formatDateTime(isoDateTime: string): string {
  return format(parseISO(isoDateTime), "PPp");
}

// 452 -> "7h 32m"; null or negative renders as an em dash.
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// "2026-10" -> "October 2026" using the browser's locale.
export function formatMonth(monthIso: string): string {
  return format(parseISO(`${monthIso}-01T00:00:00`), "MMMM yyyy");
}

// Google Maps link for attendance coordinates, or null when missing.
export function mapLink(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string | null {
  if (latitude == null || longitude == null) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
