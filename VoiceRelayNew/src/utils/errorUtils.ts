/**
 * Error Utilities
 *
 * Provides consistent error classification, categorization, and user-friendly message formatting.
 * Maps technical errors to actionable, non-technical user messages.
 */

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CRYPTO_ERROR = 'CRYPTO_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ClassifiedError {
  type: ErrorType;
  userMessage: string;
  technicalMessage: string;
  isRetryable: boolean;
  code?: string;
}

/**
 * Classify and format errors for user display
 * Returns user-friendly message instead of technical jargon
 */
export function classifyError(error: unknown): ClassifiedError {
  const errorMessage = getErrorMessage(error);

  // Network errors
  if (
    errorMessage.includes('Network') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('Cannot reach')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      userMessage: "Can't reach the server. Check your internet connection.",
      technicalMessage: errorMessage,
      isRetryable: true,
      code: 'NETWORK_ERROR',
    };
  }

  // Auth/Token errors
  if (
    errorMessage.includes('token') ||
    errorMessage.includes('401') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('Invalid token') ||
    errorMessage.includes('Bearer')
  ) {
    return {
      type: ErrorType.AUTH_ERROR,
      userMessage: 'Invalid token format. Use: Bearer github|username|token',
      technicalMessage: errorMessage,
      isRetryable: false,
      code: 'AUTH_ERROR',
    };
  }

  // Crypto/Key errors
  if (
    errorMessage.includes('decrypt') ||
    errorMessage.includes('encrypt') ||
    errorMessage.includes('key') ||
    errorMessage.includes('PEM') ||
    errorMessage.includes('private key') ||
    errorMessage.includes('public key')
  ) {
    return {
      type: ErrorType.CRYPTO_ERROR,
      userMessage: 'Decryption failed. Your keys might be corrupted. Try logging out and in again.',
      technicalMessage: errorMessage,
      isRetryable: false,
      code: 'CRYPTO_ERROR',
    };
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('required') ||
    errorMessage.includes('empty') ||
    errorMessage.includes('too large') ||
    errorMessage.includes('invalid')
  ) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      userMessage: 'Invalid input. Please check your entry and try again.',
      technicalMessage: errorMessage,
      isRetryable: false,
      code: 'VALIDATION_ERROR',
    };
  }

  // Storage errors
  if (
    errorMessage.includes('storage') ||
    errorMessage.includes('write') ||
    errorMessage.includes('read') ||
    errorMessage.includes('file')
  ) {
    return {
      type: ErrorType.STORAGE_ERROR,
      userMessage: 'Failed to save data. Please check your device storage.',
      technicalMessage: errorMessage,
      isRetryable: true,
      code: 'STORAGE_ERROR',
    };
  }

  // Default: Unknown error
  return {
    type: ErrorType.UNKNOWN_ERROR,
    userMessage: 'Something went wrong. Please try again.',
    technicalMessage: errorMessage,
    isRetryable: true,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Get string representation of error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return String(error);
}

/**
 * Format error for display with optional retry context
 */
export function formatErrorMessage(
  error: unknown,
  context?: { retryCount?: number; operation?: string }
): string {
  const classified = classifyError(error);
  let message = classified.userMessage;

  // Add context if provided
  if (context?.operation) {
    message = `Failed to ${context.operation}. ${classified.userMessage}`;
  }

  // Add retry attempt info if applicable
  if (context?.retryCount !== undefined && context.retryCount > 0) {
    message += ` (Attempt ${context.retryCount + 1})`;
  }

  return message;
}

/**
 * Check if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  return classifyError(error).isRetryable;
}

/**
 * Get technical error message for logging
 */
export function getTechnicalMessage(error: unknown): string {
  return classifyError(error).technicalMessage;
}
