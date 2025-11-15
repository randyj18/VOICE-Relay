/**
 * Secure Storage Service
 *
 * Manages persistent storage of sensitive data:
 * - User's private key (encrypted at rest on device)
 * - GitHub OAuth token
 * - Message queue
 * - Settings
 *
 * In production: Use React Native's secure storage solutions:
 * - iOS: Keychain
 * - Android: Keystore / EncryptedSharedPreferences
 *
 * For Phase 2: Use AsyncStorage (later upgrade to react-native-keychain)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppKeyPair, AuthContext, StoredMessage, AppSettings, MessageStatus, WorkOrder } from "../types";

const STORAGE_KEYS = {
  APP_PRIVATE_KEY: '@voice_relay:app_private_key',
  APP_PUBLIC_KEY: '@voice_relay:app_public_key',
  GITHUB_TOKEN: '@voice_relay:github_token',
  USER_ID: '@voice_relay:user_id',
  MESSAGE_QUEUE: '@voice_relay:message_queue',
  SETTINGS: '@voice_relay:settings',
  LAST_SYNC: '@voice_relay:last_sync',
};

export class SecureStorage {
  /**
   * Save app's private key (SENSITIVE!)
   * In production, this should be encrypted at rest
   */
  static async saveAppPrivateKey(privateKeyPem: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_PRIVATE_KEY, privateKeyPem);
    } catch (error) {
      throw new Error(`Failed to save private key: ${error}`);
    }
  }

  /**
   * Load app's private key
   */
  static async loadAppPrivateKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.APP_PRIVATE_KEY);
    } catch (error) {
      throw new Error(`Failed to load private key: ${error}`);
    }
  }

  /**
   * Save app's public key
   */
  static async saveAppPublicKey(publicKeyPem: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_PUBLIC_KEY, publicKeyPem);
    } catch (error) {
      throw new Error(`Failed to save public key: ${error}`);
    }
  }

  /**
   * Load app's public key
   */
  static async loadAppPublicKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.APP_PUBLIC_KEY);
    } catch (error) {
      throw new Error(`Failed to load public key: ${error}`);
    }
  }

  /**
   * Save GitHub OAuth token (SENSITIVE!)
   */
  static async saveGithubToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
    } catch (error) {
      throw new Error(`Failed to save GitHub token: ${error}`);
    }
  }

  /**
   * Load GitHub OAuth token
   */
  static async loadGithubToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
    } catch (error) {
      throw new Error(`Failed to load GitHub token: ${error}`);
    }
  }

  /**
   * Save user ID
   */
  static async saveUserId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      throw new Error(`Failed to save user ID: ${error}`);
    }
  }

  /**
   * Load user ID
   */
  static async loadUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      throw new Error(`Failed to load user ID: ${error}`);
    }
  }

  /**
   * Save encrypted message to queue
   */
  static async addMessage(message: StoredMessage): Promise<void> {
    try {
      const queue = await SecureStorage.loadMessageQueue();
      queue.push(message);
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      throw new Error(`Failed to add message: ${error}`);
    }
  }

  /**
   * Load all messages from queue
   */
  static async loadMessageQueue(): Promise<StoredMessage[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      throw new Error(`Failed to load message queue: ${error}`);
    }
  }

  /**
   * Update message status (e.g., ENCRYPTED -> DECRYPTED)
   */
  static async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    decryptedWorkOrder?: WorkOrder
  ): Promise<void> {
    try {
      const queue = await SecureStorage.loadMessageQueue();
      const message = queue.find(m => m.id === messageId);
      if (message) {
        message.status = status;
        if (decryptedWorkOrder) {
          message.decrypted_work_order = decryptedWorkOrder;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_QUEUE, JSON.stringify(queue));
      }
    } catch (error) {
      throw new Error(`Failed to update message: ${error}`);
    }
  }

  /**
   * Remove message from queue
   */
  static async removeMessage(messageId: string): Promise<void> {
    try {
      const queue = await SecureStorage.loadMessageQueue();
      const filtered = queue.filter(m => m.id !== messageId);
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_QUEUE, JSON.stringify(filtered));
    } catch (error) {
      throw new Error(`Failed to remove message: ${error}`);
    }
  }

  /**
   * Clear entire message queue
   */
  static async clearMessageQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_QUEUE, JSON.stringify([]));
    } catch (error) {
      throw new Error(`Failed to clear message queue: ${error}`);
    }
  }

  /**
   * Save app settings
   */
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      throw new Error(`Failed to save settings: ${error}`);
    }
  }

  /**
   * Load app settings with defaults
   */
  static async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const defaults: AppSettings = {
        auto_send: false,
        relay_url: 'https://relay.voice-app.com',
        relay_timeout_ms: 30000,
        messages_limit: 100,
      };
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch (error) {
      throw new Error(`Failed to load settings: ${error}`);
    }
  }

  /**
   * Save last sync timestamp
   */
  static async saveLastSync(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      throw new Error(`Failed to save last sync: ${error}`);
    }
  }

  /**
   * Load last sync timestamp
   */
  static async loadLastSync(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      throw new Error(`Failed to load last sync: ${error}`);
    }
  }

  /**
   * Clear ALL data (for logout / factory reset)
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      throw new Error(`Failed to clear all data: ${error}`);
    }
  }

  /**
   * Check if user is initialized (has keys and token)
   */
  static async isInitialized(): Promise<boolean> {
    try {
      const privateKey = await SecureStorage.loadAppPrivateKey();
      const token = await SecureStorage.loadGithubToken();
      return !!(privateKey && token);
    } catch {
      return false;
    }
  }

  /**
   * Increment message usage counter
   */
  static async incrementMessageUsage(): Promise<number> {
    try {
      const settings = await this.loadSettings();
      const newCount = (settings.messages_used || 0) + 1;
      settings.messages_used = newCount;
      settings.messages_reset_date = settings.messages_reset_date || Date.now();
      await this.saveSettings(settings);
      return newCount;
    } catch (error) {
      throw new Error(`Failed to increment message usage: ${error}`);
    }
  }

  /**
   * Reset monthly message usage
   */
  static async resetMonthlyUsage(): Promise<void> {
    try {
      const settings = await this.loadSettings();
      settings.messages_used = 0;
      settings.messages_reset_date = Date.now();
      await this.saveSettings(settings);
    } catch (error) {
      throw new Error(`Failed to reset usage: ${error}`);
    }
  }

  /**
   * Check if monthly reset is needed (30 days since last reset)
   */
  static async checkAndResetIfNeeded(): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      const resetDate = settings.messages_reset_date || Date.now();
      const daysSinceReset = (Date.now() - resetDate) / (1000 * 60 * 60 * 24);

      if (daysSinceReset >= 30) {
        await this.resetMonthlyUsage();
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(`Failed to check reset: ${error}`);
    }
  }
}
