export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const networkErrorMessage = "No connection. Check your internet and try again.";
const timeoutMessage = "The connection timed out. Please try again.";

/** Turns any thrown value into a short, human-friendly message for the UI. */
export function toFriendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return timeoutMessage;
    }
    if (typeof error.message === "string" && /network|fetch|connect/i.test(error.message)) {
      return networkErrorMessage;
    }
    return networkErrorMessage;
  }

  return networkErrorMessage;
}

/** True when the friendly mapping should be a warning-style notice. */
export function isRetryableStatus(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === undefined || error.status >= 500 || error.status === 429;
  }
  return true;
}
