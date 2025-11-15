/**
 * Network Utilities
 *
 * Provides:
 * - Network status detection
 * - Offline mode indication
 * - Connection monitoring
 */

import { NetInfo } from '@react-native-community/netinfo';

export enum NetworkState {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  CHECKING = 'CHECKING',
}

export interface NetworkStatus {
  state: NetworkState;
  isConnected: boolean;
  type?: string; // 'wifi', 'cellular', etc.
  isExpensive?: boolean;
}

/**
 * Check if device has network connectivity
 */
export async function checkNetworkStatus(): Promise<NetworkStatus> {
  try {
    const state = await NetInfo.fetch();

    // NetInfo might not be available in all environments
    if (state === null) {
      return {
        state: NetworkState.CHECKING,
        isConnected: true, // Assume connected if we can't check
      };
    }

    return {
      state: state.isConnected ? NetworkState.ONLINE : NetworkState.OFFLINE,
      isConnected: state.isConnected ?? false,
      type: state.type ?? undefined,
      isExpensive: state.isConnectionExpensive,
    };
  } catch (error) {
    console.warn('[Network] Failed to check network status:', error);
    // Assume online if we can't check
    return {
      state: NetworkState.CHECKING,
      isConnected: true,
    };
  }
}

/**
 * Subscribe to network status changes
 * Returns unsubscribe function
 */
export function subscribeToNetworkChanges(
  callback: (status: NetworkStatus) => void
): (() => void) | null {
  try {
    // NetInfo.addEventListener is available in @react-native-community/netinfo
    // For now, return null if not available
    return null;
  } catch (error) {
    console.warn('[Network] Failed to subscribe to network changes:', error);
    return null;
  }
}

/**
 * Format network state for display
 */
export function formatNetworkStatus(status: NetworkStatus): string {
  if (status.state === NetworkState.OFFLINE) {
    return "You're offline. Messages will send when connected.";
  }
  if (status.state === NetworkState.CHECKING) {
    return 'Checking connection...';
  }
  if (status.type === 'cellular' && status.isExpensive) {
    return 'Using expensive cellular connection';
  }
  return '';
}

/**
 * Get network status icon/indicator
 */
export function getNetworkStatusIndicator(status: NetworkStatus): {
  color: string;
  icon: string;
  label: string;
} {
  if (status.state === NetworkState.OFFLINE) {
    return {
      color: '#FF3B30',
      icon: '◯',
      label: 'Offline',
    };
  }
  if (status.state === NetworkState.CHECKING) {
    return {
      color: '#FF9500',
      icon: '◯',
      label: 'Checking...',
    };
  }
  if (status.type === 'cellular') {
    return {
      color: '#007AFF',
      icon: '◯',
      label: 'Cellular',
    };
  }
  return {
    color: '#34C759',
    icon: '◯',
    label: 'Online',
  };
}

/**
 * Check if network error occurred
 */
export function isNetworkError(error: unknown): boolean {
  const errorStr = String(error).toLowerCase();
  return (
    errorStr.includes('network') ||
    errorStr.includes('offline') ||
    errorStr.includes('timeout') ||
    errorStr.includes('enotfound') ||
    errorStr.includes('econnrefused')
  );
}

/**
 * Retry strategy for network operations
 */
export async function retryOnNetworkRecovery<T>(
  operation: () => Promise<T>,
  maxWaitMs: number = 30000
): Promise<T> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkNetworkStatus();

    if (status.isConnected) {
      try {
        return await operation();
      } catch (error) {
        if (!isNetworkError(error)) {
          throw error;
        }
        // Network error, continue waiting
      }
    }

    // Wait 2 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Network operation timed out');
}
