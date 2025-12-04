export type ApiResponse<T> =
  | {
      data: T;
      error?: never;
    }
  | {
      data?: never;
      error: ApiError;
    };

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type PaginatedResponse<T> = {
  items: T[];
  nextToken?: string;
  hasMore: boolean;
};
