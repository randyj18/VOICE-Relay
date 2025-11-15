/**
 * Retry Utilities
 *
 * Provides automatic retry logic with exponential backoff.
 * Implements:
 * - Exponential backoff: 2s, 4s, 8s, 16s
 * - Maximum retry attempts
 * - Retryable error detection
 * - Retry attempt tracking
 */

import { isRetryableError } from './errorUtils';

export interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  finalError?: string;
}

/**
 * Default retry configuration
 * Exponential backoff: 2s, 4s, 8s, 16s
 */
const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 4,
  initialDelayMs: 2000,
  maxDelayMs: 16000,
  backoffMultiplier: 2,
  shouldRetry: (error) => isRetryableError(error),
};

/**
 * Execute function with automatic retry and exponential backoff
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => apiService.getPublicKey(),
 *   { maxAttempts: 3 }
 * );
 *
 * if (result.success) {
 *   console.log('Got public key:', result.data);
 * } else {
 *   console.error('Failed after retries:', result.finalError);
 * }
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<RetryResult<T>> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: unknown;
  let delayMs = mergedConfig.initialDelayMs;

  for (let attempt = 0; attempt < mergedConfig.maxAttempts; attempt++) {
    try {
      console.log(
        `[Retry] Attempt ${attempt + 1}/${mergedConfig.maxAttempts}`
      );
      const data = await fn();
      console.log(`[Retry] Success on attempt ${attempt + 1}`);
      return {
        success: true,
        data,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error;
      console.error(`[Retry] Attempt ${attempt + 1} failed:`, error);

      // Check if we should retry
      if (!mergedConfig.shouldRetry(error, attempt)) {
        console.log(`[Retry] Error is not retryable, giving up`);
        return {
          success: false,
          error,
          attempts: attempt + 1,
          finalError: getErrorMessage(error),
        };
      }

      // Don't delay after last attempt
      if (attempt < mergedConfig.maxAttempts - 1) {
        console.log(`[Retry] Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);

        // Calculate next delay with exponential backoff
        delayMs = Math.min(
          delayMs * mergedConfig.backoffMultiplier,
          mergedConfig.maxDelayMs
        );
      }
    }
  }

  // All retries exhausted
  console.error(
    `[Retry] All ${mergedConfig.maxAttempts} attempts failed`
  );
  return {
    success: false,
    error: lastError,
    attempts: mergedConfig.maxAttempts,
    finalError: getErrorMessage(lastError),
  };
}

/**
 * Retry with custom onRetry callback for UI updates
 */
export async function retryWithCallback<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, nextDelayMs: number) => void,
  config?: RetryConfig
): Promise<RetryResult<T>> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: unknown;
  let delayMs = mergedConfig.initialDelayMs;

  for (let attempt = 0; attempt < mergedConfig.maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error;

      if (!mergedConfig.shouldRetry(error, attempt)) {
        return {
          success: false,
          error,
          attempts: attempt + 1,
          finalError: getErrorMessage(error),
        };
      }

      if (attempt < mergedConfig.maxAttempts - 1) {
        onRetry?.(attempt + 1, delayMs);
        await delay(delayMs);
        delayMs = Math.min(
          delayMs * mergedConfig.backoffMultiplier,
          mergedConfig.maxDelayMs
        );
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: mergedConfig.maxAttempts,
    finalError: getErrorMessage(lastError),
  };
}

/**
 * Simple delay utility
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get human-readable error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Calculate backoff delay for given attempt
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelayMs: number = 2000,
  multiplier: number = 2,
  maxDelayMs: number = 16000
): number {
  const delay = initialDelayMs * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelayMs);
}

/**
 * Format retry status message
 */
export function formatRetryMessage(attempt: number, maxAttempts: number): string {
  return `Retrying... (${attempt}/${maxAttempts})`;
}

/**
 * Create a retryable wrapper for a function
 * Returns a function that automatically retries on failure
 */
export function makeRetryable<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config?: RetryConfig
): (...args: T) => Promise<RetryResult<R>> {
  return async (...args: T) => {
    return retryWithBackoff(() => fn(...args), config);
  };
}
