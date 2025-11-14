/**
 * Settings Service
 *
 * Manages app settings for voice mode and general preferences
 * - Auto-send toggle
 * - Language selection
 * - Silence timeout (ms)
 * - Keep-awake preference
 */

import { SecureStorage } from '../storage/secureStorage';
import { AppSettings } from '../types';

export class SettingsService {
  /**
   * Get all settings
   */
  static async getSettings(): Promise<AppSettings> {
    return await SecureStorage.loadSettings();
  }

  /**
   * Update specific setting
   */
  static async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    const settings = await this.getSettings();
    settings[key] = value;
    await SecureStorage.saveSettings(settings);
  }

  /**
   * Enable/disable auto-send
   */
  static async setAutoSend(enabled: boolean): Promise<void> {
    await this.updateSetting('auto_send', enabled);
  }

  /**
   * Get auto-send setting
   */
  static async isAutoSendEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.auto_send;
  }

  /**
   * Set relay URL
   */
  static async setRelayUrl(url: string): Promise<void> {
    await this.updateSetting('relay_url', url);
  }

  /**
   * Get relay URL
   */
  static async getRelayUrl(): Promise<string> {
    const settings = await this.getSettings();
    return settings.relay_url;
  }

  /**
   * Set relay timeout (milliseconds)
   */
  static async setRelayTimeout(ms: number): Promise<void> {
    await this.updateSetting('relay_timeout_ms', ms);
  }

  /**
   * Get relay timeout
   */
  static async getRelayTimeout(): Promise<number> {
    const settings = await this.getSettings();
    return settings.relay_timeout_ms;
  }

  /**
   * Set message limit (max prompts per month)
   */
  static async setMessageLimit(limit: number): Promise<void> {
    await this.updateSetting('messages_limit', limit);
  }

  /**
   * Get message limit
   */
  static async getMessageLimit(): Promise<number> {
    const settings = await this.getSettings();
    return settings.messages_limit;
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(): Promise<void> {
    const defaults: AppSettings = {
      auto_send: false,
      relay_url: 'https://relay.voice-app.com',
      relay_timeout_ms: 30000,
      messages_limit: 100,
    };
    await SecureStorage.saveSettings(defaults);
  }

  /**
   * Validate URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate timeout (min 5s, max 60s)
   */
  static isValidTimeout(ms: number): boolean {
    return ms >= 5000 && ms <= 60000;
  }

  /**
   * Validate message limit (min 1, max 10000)
   */
  static isValidMessageLimit(limit: number): boolean {
    return limit >= 1 && limit <= 10000;
  }
}
