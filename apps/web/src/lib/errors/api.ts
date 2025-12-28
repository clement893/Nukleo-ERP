/**
 * API Error Handling
 * Centralized error handling for API calls
 */

/**
 * API Error Handling
 * Centralized error handling for API calls with Sentry integration
 */

import { AxiosError } from 'axios';
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './AppError';
import { ErrorCode, type ApiErrorResponse } from './types';
import { captureException } from '@/lib/sentry/client';

/**
 * Convert HTTP status code to ErrorCode
 */
function statusCodeToErrorCode(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCode.INTERNAL_SERVER_ERROR;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Create AppError from HTTP status code
 */
function createErrorFromStatusCode(
  statusCode: number,
  message: string,
  details?: Record<string, unknown>
): AppError {
  const code = statusCodeToErrorCode(statusCode);

  switch (code) {
    case ErrorCode.BAD_REQUEST:
      return new BadRequestError(message, details);
    case ErrorCode.UNAUTHORIZED:
      return new UnauthorizedError(message, details);
    case ErrorCode.FORBIDDEN:
      return new ForbiddenError(message, details);
    case ErrorCode.NOT_FOUND:
      return new NotFoundError(message, details);
    case ErrorCode.CONFLICT:
      return new ConflictError(message, details);
    case ErrorCode.VALIDATION_ERROR:
      return new ValidationError(message, details);
    default:
      return new InternalServerError(message, details);
  }
}

/**
 * Handles Axios errors and converts them to standardized AppError instances.
 * 
 * This function provides detailed error messages based on the error type:
 * - Network errors: Clear message about connection issues
 * - API errors: Uses server-provided message or generates contextual message
 * - Validation errors: Includes field-level validation details
 * - Unknown errors: Provides fallback message with error details
 * 
 * @param error - The error to handle (AxiosError, AppError, Error, or unknown)
 * @returns A standardized AppError instance with detailed information
 * 
 * @example
 * ```typescript
 * try {
 *   await apiClient.get('/users');
 * } catch (error) {
 *   const appError = handleApiError(error);
 *   logger.error('', appError.message); // Detailed error message
 *   logger.error('', appError.details); // Additional context
 * }
 * ```
 */
export function handleApiError(error: unknown): AppError {
  // Already an AppError - return as-is
  if (error instanceof AppError) {
    return error;
  }

  // Axios error - extract detailed information
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status ?? 500;
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    const requestUrl = error.config?.url ?? 'unknown';
    const requestMethod = error.config?.method?.toUpperCase() ?? 'UNKNOWN';

    // Generate contextual error message based on status code
    let message = responseData?.error?.message ?? error.message;
    
    if (!message || message === 'Request failed with status code') {
      // Generate user-friendly messages for common status codes
      switch (statusCode) {
        case 400:
          message = `Invalid request to ${requestMethod} ${requestUrl}. Please check your input and try again.`;
          break;
        case 401:
          message = 'Your session has expired. Please log in again.';
          break;
        case 403:
          message = `You don't have permission to access ${requestUrl}.`;
          break;
        case 404:
          message = `The resource at ${requestUrl} was not found.`;
          break;
        case 409:
          message = `A conflict occurred while processing your request to ${requestUrl}.`;
          break;
        case 422:
          message = 'Validation failed. Please check your input and try again.';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          message = 'Server error occurred. Our team has been notified. Please try again later.';
          break;
        case 503:
          message = 'Service temporarily unavailable. Please try again in a few moments.';
          break;
        default:
          message = `An error occurred while processing your request (${statusCode}).`;
      }
    }

    // Extract comprehensive details from API response
    const details: Record<string, unknown> = {
      url: requestUrl,
      method: requestMethod,
      statusCode,
      ...responseData?.error?.details,
    };

    // Add validation errors if present (for 422 errors)
    if (responseData?.error?.validationErrors) {
      const validationErrors = responseData.error.validationErrors;
      details.validationErrors = validationErrors;
      
      // FastAPI returns validationErrors as an array of {field, message, code}
      // Extract field names and messages for better error message
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        const fields = validationErrors
          .map((err: any) => err.field)
          .filter((field: any) => field)
          .join(', ');
        
        // Extract the actual validation messages (they contain detailed info)
        const validationMessages = validationErrors
          .map((err: any) => err.message)
          .filter((msg: any) => typeof msg === 'string' && msg.length > 0);
        
        if (fields) {
          message = `Validation failed for fields: ${fields}. ${message}`;
        }
        
        // If we have detailed validation messages, use the first one as the main message
        // (it contains the formatted error details from Pydantic)
        if (validationMessages.length > 0 && (validationMessages[0].includes('Color format') || validationMessages[0].includes('contrast') || validationMessages[0].includes('Invalid color'))) {
          // Use the detailed message from backend
          message = validationMessages[0];
        } else if (validationMessages.length > 0) {
          // Use the first validation message even if it doesn't match the pattern
          // It might contain useful information
          message = validationMessages[0];
        }
      } else if (typeof validationErrors === 'object') {
        // Handle object format (legacy or other formats)
        const validationFields = Object.keys(validationErrors).join(', ');
        message = `Validation failed for fields: ${validationFields}. ${message}`;
      }
    }

    const appError = createErrorFromStatusCode(statusCode, message, details);
    
    // Send to Sentry for server errors (5xx) and unexpected client errors
    // Don't send 401 errors to Sentry - they're expected for unauthorized users
    if (statusCode >= 500 || (statusCode >= 400 && statusCode !== 401 && !responseData?.error?.message)) {
      captureException(new Error(message), {
        tags: {
          errorType: 'api_error',
          statusCode: String(statusCode),
          method: requestMethod,
        },
        extra: details,
      });
    }
    
    return appError;
  }

  // Network error - provide clear guidance with retry suggestion
  if (error instanceof Error) {
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      const networkError = new AppError(
        ErrorCode.NETWORK_ERROR,
        'Unable to connect to the server. Please check your internet connection and try again.',
        0,
        {
          originalMessage: error.message,
          suggestion: 'Check your network connection or try again in a few moments.',
          retryable: true,
          retryDelay: 2000, // Suggest retry after 2 seconds
        }
      );
      
      // Log network errors to Sentry (less critical, but useful for monitoring)
      captureException(error, {
        tags: {
          errorType: 'network_error',
        },
        level: 'warning',
      });
      
      return networkError;
    }
    
    const unexpectedError = new InternalServerError(
      `An unexpected error occurred: ${error.message}`,
      { originalError: error.message }
    );
    
    // Send unexpected errors to Sentry
    captureException(error, {
      tags: {
        errorType: 'unexpected_error',
      },
    });
    
    return unexpectedError;
  }

  // Unknown error - provide fallback with context
  const unknownError = new InternalServerError(
    'An unknown error occurred. Please try again or contact support if the problem persists.',
    { errorType: typeof error, errorValue: String(error) }
  );
  
  // Send unknown errors to Sentry
  captureException(new Error('Unknown error type'), {
    tags: {
      errorType: 'unknown_error',
    },
    extra: { errorType: typeof error, errorValue: String(error) },
  });
  
  return unknownError;
}

/**
 * Checks if the error is a client error (4xx status code).
 * 
 * Client errors indicate issues with the request itself, such as:
 * - Invalid input (400)
 * - Authentication required (401)
 * - Insufficient permissions (403)
 * - Resource not found (404)
 * - Validation errors (422)
 * 
 * @param error - The AppError instance to check
 * @returns True if the error is a client error (4xx), false otherwise
 */
export function isClientError(error: AppError): boolean {
  return error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Checks if the error is a server error (5xx status code).
 * 
 * Server errors indicate issues on the server side, such as:
 * - Internal server errors (500)
 * - Service unavailable (503)
 * - Gateway errors (502)
 * 
 * @param error - The AppError instance to check
 * @returns True if the error is a server error (5xx), false otherwise
 */
export function isServerError(error: AppError): boolean {
  return error.statusCode >= 500;
}

/**
 * Checks if the error is a network error.
 * 
 * Network errors occur when:
 * - The request cannot reach the server
 * - Connection timeout
 * - DNS resolution failure
 * - No internet connection
 * 
 * @param error - The AppError instance to check
 * @returns True if the error is a network error, false otherwise
 */
export function isNetworkError(error: AppError): boolean {
  return error.code === ErrorCode.NETWORK_ERROR || error.statusCode === 0;
}

