// Common types used across Redux slices
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

