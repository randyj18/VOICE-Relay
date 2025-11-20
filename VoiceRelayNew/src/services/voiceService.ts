/**
 * Voice Service
 *
 * Handles Text-to-Speech (TTS) and Speech-to-Text (STT) for hands-free mode
 * - Speak prompts to user
 * - Listen for user's voice reply
 * - Detect silence (auto-send trigger)
 * - Audio feedback (beeps, confirmation)
 */

import { Platform } from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

export enum VoiceEventType {
  SPEECH_START = 'speechstart',
  SPEECH_END = 'speechend',
  RESULTS = 'results',
  ERROR = 'error',
  PARTIAL_RESULTS = 'partialresults',
}

export interface VoiceEvent {
  type: VoiceEventType;
  data?: string[];
  error?: string;
}

export interface VoiceOptions {
  language?: string;
  locale?: string;
  silenceTimeout?: number;
}

/**
 * Callback for voice events
 */
export type VoiceCallback = (event: VoiceEvent) => void;

export class VoiceService {
  private isListening = false;
  private isSpeaking = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private silenceTimeoutMs = 2000; // 2 seconds of silence = auto-send
  private callbacks: VoiceCallback[] = [];
  private recognitionStarted = false;

  constructor(options?: VoiceOptions) {
    if (options?.silenceTimeout) {
      this.silenceTimeoutMs = options.silenceTimeout;
    }

    // Setup voice recognition listeners
    this.setupVoiceListeners();

    // Setup TTS listeners
    this.setupTtsListeners();
  }

  /**
   * Setup voice recognition event listeners
   */
  private setupVoiceListeners(): void {
    Voice.onSpeechStart = () => {
      console.log('[Voice] Speech started');
      this.recognitionStarted = true;
      this.resetSilenceTimer();
      this.emit({
        type: VoiceEventType.SPEECH_START,
      });
    };

    Voice.onSpeechEnd = () => {
      console.log('[Voice] Speech ended');
      this.emit({
        type: VoiceEventType.SPEECH_END,
      });
    };

    Voice.onSpeechResults = (e: any) => {
      console.log('[Voice] Results:', e.value);
      this.resetSilenceTimer();
      this.emit({
        type: VoiceEventType.RESULTS,
        data: e.value,
      });
    };

    Voice.onSpeechPartialResults = (e: any) => {
      console.log('[Voice] Partial results:', e.value);
      this.resetSilenceTimer();
      this.emit({
        type: VoiceEventType.PARTIAL_RESULTS,
        data: e.value,
      });
    };

    Voice.onSpeechError = (e: any) => {
      console.error('[Voice] Error:', e.error);
      this.emit({
        type: VoiceEventType.ERROR,
        error: e.error,
      });
    };
  }

  /**
   * Setup TTS event listeners
   */
  private setupTtsListeners(): void {
    Tts.addEventListener('tts-start', () => {
      console.log('[TTS] Speaking started');
      this.isSpeaking = true;
    });

    Tts.addEventListener('tts-finish', () => {
      console.log('[TTS] Speaking finished');
      this.isSpeaking = false;
    });

    Tts.addEventListener('tts-cancel', () => {
      console.log('[TTS] Speaking cancelled');
      this.isSpeaking = false;
    });
  }

  /**
   * Emit event to all registered callbacks
   */
  private emit(event: VoiceEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[Voice] Callback error:', error);
      }
    });
  }

  /**
   * Register callback for voice events
   */
  onVoiceEvent(callback: VoiceCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Unregister callback
   */
  offVoiceEvent(callback: VoiceCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Speak text using TTS
   * Uses platform-specific optimizations when available
   */
  async speak(text: string): Promise<void> {
    try {
      console.log('[TTS] Speaking:', text);

      // Stop listening while speaking
      if (this.isListening) {
        await this.stopListening();
      }

      // Prepare TTS options with platform-specific parameters
      const ttsOptions: any = {
        text,
      };

      // Add platform-specific parameters
      if (Platform.OS === 'android') {
        // Android-specific TTS parameters for better audio control
        ttsOptions.androidParams = {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 1,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        };
      } else if (Platform.OS === 'ios') {
        // iOS-specific TTS parameters (optional, uses system defaults if not set)
        // Can be extended with iOS-specific properties if needed
      }

      await Tts.speak(ttsOptions);
    } catch (error) {
      throw new Error(`TTS failed: ${error}`);
    }
  }

  /**
   * Stop speaking
   */
  async stop(): Promise<void> {
    try {
      await Tts.stop();
      this.isSpeaking = false;
    } catch (error) {
      throw new Error(`Failed to stop TTS: ${error}`);
    }
  }

  /**
   * Start listening for voice input
   */
  async startListening(options?: VoiceOptions): Promise<void> {
    try {
      if (this.isListening) {
        console.warn('[Voice] Already listening');
        return;
      }

      console.log('[Voice] Starting recognition');

      // Stop speaking first
      if (this.isSpeaking) {
        await this.stop();
      }

      // Update silence timeout if provided
      if (options?.silenceTimeout) {
        this.silenceTimeoutMs = options.silenceTimeout;
      }

      this.isListening = true;
      this.recognitionStarted = false;

      await Voice.start(options?.locale || 'en-US');
    } catch (error) {
      this.isListening = false;
      throw new Error(`Failed to start listening: ${error}`);
    }
  }

  /**
   * Stop listening for voice input
   */
  async stopListening(): Promise<void> {
    try {
      if (!this.isListening) {
        console.warn('[Voice] Not listening');
        return;
      }

      console.log('[Voice] Stopping recognition');

      this.clearSilenceTimer();
      this.isListening = false;
      this.recognitionStarted = false;

      await Voice.stop();
    } catch (error) {
      throw new Error(`Failed to stop listening: ${error}`);
    }
  }

  /**
   * Cancel voice recognition
   */
  async cancel(): Promise<void> {
    try {
      await Voice.cancel();
      this.isListening = false;
      this.recognitionStarted = false;
      this.clearSilenceTimer();
    } catch (error) {
      throw new Error(`Failed to cancel listening: ${error}`);
    }
  }

  /**
   * Destroy service and clean up
   */
  async destroy(): Promise<void> {
    try {
      this.clearSilenceTimer();
      await this.cancel();
      await this.stop();
      Voice.removeAllListeners();
    } catch (error) {
      console.error('[Voice] Error during cleanup:', error);
    }
  }

  /**
   * Reset silence timer (restarts countdown)
   */
  private resetSilenceTimer(): void {
    this.clearSilenceTimer();

    if (!this.isListening || !this.recognitionStarted) {
      return;
    }

    // Start silence countdown
    this.silenceTimer = setTimeout(() => {
      console.log('[Voice] Silence detected, stopping listening');
      this.stopListening().catch(error => {
        console.error('[Voice] Error stopping after silence:', error);
      });
    }, this.silenceTimeoutMs);
  }

  /**
   * Clear silence timer
   */
  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Play a beep sound (audio feedback)
   */
  async playBeep(soundType: 'start' | 'end' | 'error' = 'start'): Promise<void> {
    try {
      // Use TTS to generate a simple tone
      // In production, use actual audio files or native sound APIs
      const duration = soundType === 'error' ? 500 : 100;
      console.log(`[Audio] Beep: ${soundType} (${duration}ms)`);

      // TODO: Integrate with react-native-sound or similar
    } catch (error) {
      console.error('[Audio] Beep failed:', error);
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    try {
      // Default to English, Spanish, French, German, Chinese
      return ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ja-JP'];
    } catch (error) {
      console.error('[Voice] Failed to get languages:', error);
      return ['en-US'];
    }
  }

  /**
   * Set language for recognition and TTS
   */
  async setLanguage(locale: string): Promise<void> {
    try {
      console.log(`[Voice] Setting language to ${locale}`);
      // Language is set per call in startListening and speak
      // Store for future use if needed
    } catch (error) {
      throw new Error(`Failed to set language: ${error}`);
    }
  }
}

/**
 * Singleton instance
 */
let voiceServiceInstance: VoiceService | null = null;

export function initializeVoiceService(options?: VoiceOptions): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(options);
  }
  return voiceServiceInstance;
}

export function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    throw new Error('Voice Service not initialized. Call initializeVoiceService first.');
  }
  return voiceServiceInstance;
}
