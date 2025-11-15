/**
 * Feedback Utilities
 *
 * Provides user feedback mechanisms:
 * - Success notifications (toast-style using Alert)
 * - Error alerts (with better formatting)
 * - Loading state messages
 * - Optimistic UI updates
 */

import { Alert, ToastAndroid, Platform } from 'react-native';

export interface FeedbackOptions {
  duration?: number; // Duration in ms (for toast)
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

/**
 * Show success message using native toast
 * Falls back to Alert on iOS
 */
export function showSuccess(
  message: string,
  options?: FeedbackOptions
): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(
      `✓ ${message}`,
      options?.duration || ToastAndroid.SHORT
    );
  } else {
    // iOS: Use Alert for success
    Alert.alert('Success', message, [
      {
        text: 'OK',
        onPress: options?.onAction,
        style: 'default',
      },
    ]);
  }
}

/**
 * Show error message as alert (more intrusive than toast)
 * Use for important errors that need user attention
 */
export function showError(
  title: string,
  message: string,
  options?: FeedbackOptions & { showRetryButton?: boolean; onRetry?: () => void }
): void {
  const buttons = [
    {
      text: 'OK',
      onPress: options?.onAction,
      style: 'default' as const,
    },
  ];

  if (options?.showRetryButton && options?.onRetry) {
    buttons.unshift({
      text: 'Retry',
      onPress: options.onRetry,
      style: 'default' as const,
    });
  }

  Alert.alert(title, message, buttons);
}

/**
 * Show info message (neutral tone)
 */
export function showInfo(
  message: string,
  options?: FeedbackOptions
): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, options?.duration || ToastAndroid.SHORT);
  } else {
    Alert.alert('Info', message, [
      {
        text: 'OK',
        onPress: options?.onAction,
        style: 'default',
      },
    ]);
  }
}

/**
 * Show confirmation dialog
 */
export function showConfirmation(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  Alert.alert(title, message, [
    {
      text: 'Cancel',
      onPress: onCancel,
      style: 'cancel',
    },
    {
      text: 'Confirm',
      onPress: onConfirm,
      style: 'destructive',
    },
  ]);
}

/**
 * Loading state message helper
 * Returns appropriate loading message based on operation
 */
export function getLoadingMessage(operation: string, step?: number): string {
  const messages: { [key: string]: string[] } = {
    login: ['Validating token...', 'Generating keys...', 'Saving credentials...'],
    decrypt: ['Decrypting message...'],
    encrypt: ['Encrypting reply...'],
    send: ['Sending reply...', 'Updating status...'],
    logout: ['Clearing data...'],
    initialize: ['Restoring session...', 'Loading messages...'],
  };

  const operationMessages = messages[operation.toLowerCase()] || [
    `Processing ${operation.toLowerCase()}...`,
  ];

  if (step !== undefined && step < operationMessages.length) {
    return operationMessages[step];
  }

  return operationMessages[0];
}

/**
 * Format operation messages for different phases
 */
export const OperationMessages = {
  // Login flow
  LOGIN_VALIDATING: 'Validating token...',
  LOGIN_GENERATING_KEYS: 'Generating encryption keys...',
  LOGIN_SAVING: 'Saving credentials...',
  LOGIN_SUCCESS: 'Logged in successfully!',

  // Message decrypt flow
  DECRYPT_DECRYPTING: 'Decrypting message...',
  DECRYPT_SUCCESS: 'Message decrypted ✓',

  // Reply flow
  ENCRYPT_ENCRYPTING: 'Encrypting reply...',
  SEND_SENDING: 'Sending reply...',
  REPLY_SUCCESS: 'Reply sent ✓',

  // General
  INITIALIZING: 'Initializing app...',
  RESTORING_SESSION: 'Restoring session...',
  LOADING_MESSAGES: 'Loading messages...',
  READY: 'Ready',
};

/**
 * Create consistent status message format
 */
export function createStatusMessage(
  phase: string,
  isLoading: boolean = false
): string {
  if (!isLoading) {
    return OperationMessages[phase as keyof typeof OperationMessages] || phase;
  }
  return `${OperationMessages[phase as keyof typeof OperationMessages] || phase}...`;
}
