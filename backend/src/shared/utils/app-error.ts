export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  /** Stable, machine-readable identifier surfaced to clients (e.g. "TOO_EARLY"). */
  public readonly code?: string;

  constructor(statusCode: number, message: string, code?: string, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
