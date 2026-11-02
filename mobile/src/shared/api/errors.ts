export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const NETWORK_ERROR_MESSAGE = "No connection. Check your internet and try again.";

export const TIMEOUT_ERROR_MESSAGE =
  "The server is taking too long to respond. It may be waking up, please try again.";

export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

/** React Native reports network failures (including aborted in-flight
 * requests) by rejecting fetch with a TypeError. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

/** Turns any thrown value into a short, human-friendly message for the UI.
 * Only genuine network failures and aborted timeouts get a canned message;
 * everything else keeps its real message. */
export function toFriendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    if (isTimeoutError(error)) {
      return TIMEOUT_ERROR_MESSAGE;
    }
    if (isNetworkError(error)) {
      return NETWORK_ERROR_MESSAGE;
    }
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

/** True when the friendly mapping should be a warning-style notice. */
export function isRetryableStatus(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === undefined || error.status >= 500 || error.status === 429;
  }
  return isTimeoutError(error) || isNetworkError(error);
}
