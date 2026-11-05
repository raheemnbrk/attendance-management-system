export type ApiSuccess<TData> = {
  success: true;
  data: TData;
  message?: string;
  /** ISO timestamp generated server-side, used to correct the phone clock. */
  serverTime?: string;
};

export type ApiFailure = {
  success: false;
  message: string;
  /** Machine-readable server error identifier, e.g. "TOO_EARLY". */
  code?: string;
};

export type ApiEnvelope<TData> = ApiSuccess<TData> | ApiFailure;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type PaginatedResult<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
