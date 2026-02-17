/**
 * @module types/api
 * @description Shared API response and request types used across the application.
 *
 * These types reflect the actual backend response envelope. The API returns:
 *   { status: boolean; message: string; data: T; }
 * with an optional pagination wrapper when lists are returned.
 */

export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  term?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp?: string;
  path?: string;
  status: boolean;
  data?: any;
  response?: any;
}
