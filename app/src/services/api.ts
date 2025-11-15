/**
 * API Service
 *
 * Handles all communication with the VOICE Relay backend
 * - Authentication
 * - Fetching public keys
 * - Sending encrypted work orders
 * - Retrieving encrypted messages
 * - Submitting encrypted replies
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { GetPublicKeyResponse, AskResponse } from '../types';

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  githubToken: string;
}

export class ApiService {
  private client: AxiosInstance;
  private githubToken: string;

  constructor(config: ApiConfig) {
    console.log('[API] Initializing API service');
    this.githubToken = config.githubToken;

    console.log(`[API] Creating axios instance with baseURL: ${config.baseURL}`);
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    console.log('[API] Adding authentication interceptor');
    this.client.interceptors.request.use(config => {
      const userId = this.extractUserId();
      config.headers.Authorization = `Bearer github|${userId}|${this.githubToken}`;
      console.log(`[API] Request interceptor: Setting auth header with user ID: ${userId}`);
      return config;
    });

    // Add response logging interceptor
    this.client.interceptors.response.use(
      response => {
        console.log(`[API] Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      error => {
        console.error(`[API] Response error:`, error.message);
        return Promise.reject(error);
      }
    );
    console.log('[API] API service initialized');
  }

  /**
   * Extract user_id from GitHub token
   * Format: github_<user_id>_<rest>
   */
  private extractUserId(): string {
    // For Phase 2: Parse from GitHub token or use a default
    // In production: Validate with GitHub API
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Health check - Verify relay is online
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('[API] Health check: GET /health');
      const response = await this.client.get('/health');
      console.log(`[API] Health check successful: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      console.error('[API] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get user's public key from the relay
   * This is used for the agent to encrypt work orders
   */
  async getPublicKey(): Promise<string> {
    try {
      console.log('[API] Getting public key: POST /auth/get-public-key');
      const response = await this.client.post<GetPublicKeyResponse>(
        '/auth/get-public-key',
        {}
      );

      if (!response.data.app_public_key) {
        console.error('[API] Response missing app_public_key');
        throw new Error('No public key in response');
      }

      console.log('[API] Public key retrieved successfully');
      return response.data.app_public_key;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`[API] Failed to get public key:`, axiosError.message);
      throw new Error(
        `Failed to get public key: ${axiosError.response?.status} ${axiosError.message}`
      );
    }
  }

  /**
   * Fetch encrypted messages from the relay
   * (Stub for Phase 2 - implementation depends on relay message fetch endpoint)
   */
  async fetchMessages(): Promise<string[]> {
    try {
      console.log('[API] Fetching messages (stub for Phase 2)');
      // TODO: Implement when relay adds /messages endpoint
      // For Phase 2: Messages come via push notification
      console.log('[API] Messages fetched (Phase 2 uses push notifications)');
      return [];
    } catch (error) {
      console.error('[API] Failed to fetch messages:', error);
      throw new Error(`Failed to fetch messages: ${error}`);
    }
  }

  /**
   * Submit encrypted reply to destination URL
   * (Agent or relay forwards this to the destination)
   */
  async submitReply(
    destinationUrl: string,
    httpMethod: string,
    encryptedReply: string
  ): Promise<boolean> {
    try {
      console.log(`[API] Submitting reply: ${httpMethod.toUpperCase()} ${destinationUrl}`);
      const config = {
        method: httpMethod.toLowerCase(),
        url: destinationUrl,
        data: {
          encrypted_reply: encryptedReply,
        },
        timeout: 10000,
      };

      console.log('[API] Sending encrypted reply to destination');
      const response = await axios(config);
      console.log(`[API] Reply submitted successfully: ${response.status}`);
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`[API] Failed to submit reply:`, axiosError.message);
      throw new Error(
        `Failed to submit reply: ${axiosError.response?.status} ${axiosError.message}`
      );
    }
  }

  /**
   * Set new GitHub token
   */
  setGithubToken(token: string): void {
    console.log('[API] Updating GitHub token');
    this.githubToken = token;
    console.log('[API] GitHub token updated');
  }
}

/**
 * Singleton instance
 */
let apiServiceInstance: ApiService | null = null;

export function initializeApiService(config: ApiConfig): ApiService {
  apiServiceInstance = new ApiService(config);
  return apiServiceInstance;
}

export function getApiService(): ApiService {
  if (!apiServiceInstance) {
    throw new Error('API Service not initialized. Call initializeApiService first.');
  }
  return apiServiceInstance;
}
