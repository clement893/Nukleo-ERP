/**
 * Error Handling Utilities
 * Consolidated error handling utilities for API errors and general errors
 */

import { AxiosError, AxiosRequestConfig } from 'axios';
import { AppError } from './AppError';

/**
 * API Error with proper typing
 */
export interface ApiError extends Error {
  response?: {
    status: number;
    statusText: string;
    data?: {
      detail?: string;
      message?: string;
      errors?: Record<string, unknown>;
    };
    headers?: Record<string, string>;
    config?: AxiosRequestConfig;
  };
  config?: AxiosRequestConfig;
  isAxiosError?: boolean;
  statusCode?: number;
}

/**
 * Type guard to check if error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    ('response' in error || 'isAxiosError' in error || 'statusCode' in error)
  );
}

/**
 * Type guard to check if error is an Axios error
 */
export function isAxiosErrorType(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { isAxiosError?: boolean }).isAxiosError === true
  );
}

/**
 * Extract error message from various error types
 * Supports both English and French fallback messages
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof AppError) {
    return error.message || fallback || 'An error occurred';
  }
  if (isApiError(error)) {
    return (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      fallback ||
      'An error occurred'
    );
  }
  if (error instanceof Error) {
    return error.message || fallback || 'An error occurred';
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback || 'An unknown error occurred';
}

/**
 * Extract error detail from API error response
 * Safe way to access error.response.data.detail
 */
export function getErrorDetail(error: unknown): string | undefined {
  if (error instanceof AppError) {
    return error.details?.detail ? String(error.details.detail) : undefined;
  }
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'detail' in error.response.data
  ) {
    return String(error.response.data.detail);
  }
  return undefined;
}

/**
 * Extract status code from error
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (isApiError(error)) {
    return error.response?.status || error.statusCode;
  }
  if (isAxiosErrorType(error)) {
    return error.response?.status;
  }
  return undefined;
}

