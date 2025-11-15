/**
 * Validation Utilities
 *
 * Provides:
 * - Token format validation
 * - Message/reply size validation
 * - Real-time input validation
 * - Field error messages
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

/**
 * Validate GitHub token format
 * Expected format: Bearer github|username|token or just the token
 */
export function validateGithubToken(token: string): ValidationResult {
  if (!token || !token.trim()) {
    return {
      isValid: false,
      error: 'Token is required',
    };
  }

  const trimmed = token.trim();

  // For Phase 2: Accept "Bearer github|testuser123|fake_token" or similar format
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    const parts = trimmed.substring(7).split('|');
    if (parts.length !== 3 || parts[0] !== 'github') {
      return {
        isValid: false,
        error: 'Invalid token format. Use: Bearer github|username|token',
      };
    }
    if (!parts[1] || !parts[2]) {
      return {
        isValid: false,
        error: 'Token username or value missing',
      };
    }
    return { isValid: true };
  }

  // Also accept raw token
  if (trimmed.length < 10) {
    return {
      isValid: false,
      error: 'Token is too short. Must be at least 10 characters',
    };
  }

  return { isValid: true };
}

/**
 * Validate reply message
 */
export function validateReply(reply: string): ValidationResult {
  if (!reply || !reply.trim()) {
    return {
      isValid: false,
      error: 'Reply cannot be empty',
    };
  }

  const trimmed = reply.trim();

  if (trimmed.length > 10000) {
    return {
      isValid: false,
      error: `Reply is too long (${trimmed.length}/10000 chars). Keep it under 10,000 characters.`,
    };
  }

  if (trimmed.length > 8000) {
    return {
      isValid: true,
      warning: `Reply is getting long (${trimmed.length}/10000 chars). Consider being more concise.`,
    };
  }

  return { isValid: true };
}

/**
 * Validate message ID
 */
export function validateMessageId(id: string): ValidationResult {
  if (!id || !id.trim()) {
    return {
      isValid: false,
      error: 'Message ID is required',
    };
  }

  if (!id.startsWith('msg_')) {
    return {
      isValid: false,
      error: 'Invalid message ID format',
    };
  }

  return { isValid: true };
}

/**
 * Check if a string is empty or whitespace only
 */
export function isEmpty(value: string): boolean {
  return !value || !value.trim();
}

/**
 * Get character count with max limit feedback
 */
export function getCharacterCountStatus(
  current: number,
  max: number = 10000
): {
  count: string;
  percentage: number;
  status: 'normal' | 'warning' | 'error';
} {
  const percentage = (current / max) * 100;
  let status: 'normal' | 'warning' | 'error' = 'normal';

  if (percentage > 100) {
    status = 'error';
  } else if (percentage > 80) {
    status = 'warning';
  }

  return {
    count: `${current}/${max}`,
    percentage,
    status,
  };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: 'URL is required',
    };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch (e) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Validate PEM-formatted key
 */
export function validatePemKey(key: string): ValidationResult {
  if (!key || !key.trim()) {
    return {
      isValid: false,
      error: 'Key is required',
    };
  }

  const trimmed = key.trim();

  if (!trimmed.includes('-----BEGIN') || !trimmed.includes('-----END')) {
    return {
      isValid: false,
      error: 'Invalid PEM format. Missing BEGIN/END markers.',
    };
  }

  return { isValid: true };
}

/**
 * Multi-rule validation
 */
export function validateWithRules(
  value: string,
  rules: ValidationRule[]
): ValidationResult {
  for (const rule of rules) {
    if (!rule.test(value)) {
      return {
        isValid: false,
        error: rule.message,
      };
    }
  }
  return { isValid: true };
}

/**
 * Sanitize user input (basic)
 */
export function sanitizeInput(input: string): string {
  return input.trim();
}

/**
 * Format error message for display
 */
export function formatValidationError(error: string): string {
  return error;
}
