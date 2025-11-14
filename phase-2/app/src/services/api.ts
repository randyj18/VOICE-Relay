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
    this.githubToken = config.githubToken;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use(config => {
      config.headers.Authorization = `Bearer github|${this.extractUserId()}|${this.githubToken}`;
      return config;
    });
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
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get user's public key from the relay
   * This is used for the agent to encrypt work orders
   */
  async getPublicKey(): Promise<string> {
    try {
      const response = await this.client.post<GetPublicKeyResponse>(
        '/auth/get-public-key',
        {}
      );

      if (!response.data.app_public_key) {
        throw new Error('No public key in response');
      }

      return response.data.app_public_key;
    } catch (error) {
      const axiosError = error as AxiosError;
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
      // TODO: Implement when relay adds /messages endpoint
      // For Phase 2: Messages come via push notification
      return [];
    } catch (error) {
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
      const config = {
        method: httpMethod.toLowerCase(),
        url: destinationUrl,
        data: {
          encrypted_reply: encryptedReply,
        },
        timeout: 10000,
      };

      const response = await axios(config);
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to submit reply: ${axiosError.response?.status} ${axiosError.message}`
      );
    }
  }

  /**
   * Set new GitHub token
   */
  setGithubToken(token: string): void {
    this.githubToken = token;
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
