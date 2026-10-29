export type ApiEnvelope<T> = {
  success: true;
  data: T;
};

// Paginated list responses from the backend.
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiErrorEnvelope = {
  success: false;
  message: string;
};

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
