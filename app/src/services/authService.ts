/**
 * Authentication Service
 *
 * Handles:
 * 1. GitHub OAuth flow
 * 2. Key pair generation on first login
 * 3. Key storage (encrypted at rest)
 * 4. Session management
 * 5. Logout and account management
 */

import { CryptoUtils } from '../utils/crypto';
import { SecureStorage } from '../storage/secureStorage';
import { ApiService, initializeApiService } from './api';
import { AuthContext } from '../types';

export interface LoginRequest {
  githubToken: string;
  userId?: string;
}

export class AuthService {
  private authContext: AuthContext | null = null;
  private apiService: ApiService | null = null;

  /**
   * Login with GitHub token
   * 1. Verify token with relay
   * 2. Generate keys if first time
   * 3. Store token and keys
   * 4. Initialize API service
   */
  async login(request: LoginRequest): Promise<AuthContext> {
    try {
      // Check if user already has keys
      const existingPrivateKey = await SecureStorage.loadAppPrivateKey();

      let privateKeyPem: string;
      let publicKeyPem: string;

      if (existingPrivateKey) {
        // Use existing keys
        privateKeyPem = existingPrivateKey;
        publicKeyPem = (await SecureStorage.loadAppPublicKey()) || '';
      } else {
        // Generate new key pair
        console.log('[Auth] Generating new key pair...');
        const keyPair = CryptoUtils.generateKeyPair();
        privateKeyPem = CryptoUtils.getPrivateKeyPem(keyPair.privateKey);
        publicKeyPem = CryptoUtils.getPublicKeyPem(keyPair.publicKey);

        // Store keys
        await SecureStorage.saveAppPrivateKey(privateKeyPem);
        await SecureStorage.saveAppPublicKey(publicKeyPem);
        console.log('[Auth] Key pair saved');
      }

      // Save GitHub token
      await SecureStorage.saveGithubToken(request.githubToken);
      if (request.userId) {
        await SecureStorage.saveUserId(request.userId);
      }

      // Initialize API service
      // API_BASE_URL supports environment variables or defaults to localhost/Replit
      const apiBaseUrl = process.env.REACT_APP_API_URL ||
                         'https://f88f9dbd-157d-4ef1-aed2-7ba669e1d94b-00-c50nduy6d8kx.riker.replit.dev';

      this.apiService = initializeApiService({
        baseURL: apiBaseUrl,
        timeout: 30000,
        githubToken: request.githubToken,
      });

      // Verify connectivity
      const isHealthy = await this.apiService.healthCheck();
      if (!isHealthy) {
        console.warn('[Auth] Relay health check failed');
      }

      // Create auth context
      this.authContext = {
        github_token: request.githubToken,
        user_id: request.userId,
        authenticated: true,
      };

      console.log('[Auth] Login successful');
      return this.authContext;
    } catch (error) {
      throw new Error(`Login failed: ${error}`);
    }
  }

  /**
   * Check if user is already authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStorage.loadGithubToken();
      const privateKey = await SecureStorage.loadAppPrivateKey();
      return !!(token && privateKey);
    } catch {
      return false;
    }
  }

  /**
   * Restore session from storage
   */
  async restoreSession(): Promise<AuthContext | null> {
    try {
      const token = await SecureStorage.loadGithubToken();
      const userId = await SecureStorage.loadUserId();

      if (!token) {
        return null;
      }

      // Re-initialize API service
      this.apiService = initializeApiService({
        baseURL: 'http://localhost:8000',
        timeout: 30000,
        githubToken: token,
      });

      this.authContext = {
        github_token: token,
        user_id: userId || undefined,
        authenticated: true,
      };

      console.log('[Auth] Session restored');
      return this.authContext;
    } catch (error) {
      console.error('[Auth] Failed to restore session:', error);
      return null;
    }
  }

  /**
   * Logout and clear all data
   */
  async logout(): Promise<void> {
    try {
      await SecureStorage.clearAll();
      this.authContext = null;
      this.apiService = null;
      console.log('[Auth] Logged out');
    } catch (error) {
      throw new Error(`Logout failed: ${error}`);
    }
  }

  /**
   * Get current auth context
   */
  getAuthContext(): AuthContext | null {
    return this.authContext;
  }

  /**
   * Get API service instance
   */
  getApiService(): ApiService {
    if (!this.apiService) {
      throw new Error('API Service not initialized. Must login first.');
    }
    return this.apiService;
  }

  /**
   * Update GitHub token (e.g., after refresh)
   */
  async updateGithubToken(newToken: string): Promise<void> {
    try {
      await SecureStorage.saveGithubToken(newToken);
      if (this.apiService) {
        this.apiService.setGithubToken(newToken);
      }
      if (this.authContext) {
        this.authContext.github_token = newToken;
      }
    } catch (error) {
      throw new Error(`Failed to update token: ${error}`);
    }
  }

  /**
   * Verify app keys exist and are valid
   */
  async verifyKeys(): Promise<boolean> {
    try {
      const privateKeyPem = await SecureStorage.loadAppPrivateKey();
      const publicKeyPem = await SecureStorage.loadAppPublicKey();

      if (!privateKeyPem || !publicKeyPem) {
        return false;
      }

      // Try to load them to verify they're valid PEM
      CryptoUtils.loadPrivateKeyFromPem(privateKeyPem);
      CryptoUtils.loadPublicKeyFromPem(publicKeyPem);

      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance
 */
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}
