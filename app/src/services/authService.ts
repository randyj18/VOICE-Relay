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
import { classifyError, formatErrorMessage } from '../utils/errorUtils';
import { validateGithubToken } from '../utils/validationUtils';

export interface LoginRequest {
  githubToken: string;
  userId?: string;
}

export class AuthService {
  private authContext: AuthContext | null = null;
  private apiService: ApiService | null = null;

  /**
   * Login with GitHub token
   * 1. Validate token format
   * 2. Verify token with relay
   * 3. Generate keys if first time
   * 4. Store token and keys
   * 5. Initialize API service
   */
  async login(request: LoginRequest): Promise<AuthContext> {
    try {
      console.log('[Auth] Login initiated');

      // Validate token format first
      console.log('[Auth] Validating token format...');
      const tokenValidation = validateGithubToken(request.githubToken);
      if (!tokenValidation.isValid) {
        console.error('[Auth] Token validation failed:', tokenValidation.error);
        throw new Error(tokenValidation.error);
      }
      console.log('[Auth] Token format valid');

      // Check if user already has keys
      console.log('[Auth] Checking for existing app keys...');
      const existingPrivateKey = await SecureStorage.loadAppPrivateKey();

      let privateKeyPem: string;
      let publicKeyPem: string;

      if (existingPrivateKey) {
        // Use existing keys
        console.log('[Auth] Using existing app keys');
        privateKeyPem = existingPrivateKey;
        publicKeyPem = (await SecureStorage.loadAppPublicKey()) || '';
      } else {
        // Generate new key pair
        console.log('[Auth] Generating new key pair...');
        const keyPair = CryptoUtils.generateKeyPair();
        privateKeyPem = CryptoUtils.getPrivateKeyPem(keyPair.privateKey);
        publicKeyPem = CryptoUtils.getPublicKeyPem(keyPair.publicKey);
        console.log('[Auth] New key pair generated');

        // Store keys
        console.log('[Auth] Storing keys in secure storage');
        await SecureStorage.saveAppPrivateKey(privateKeyPem);
        await SecureStorage.saveAppPublicKey(publicKeyPem);
        // Store key creation metadata
        await SecureStorage.saveKeyPairMetadata({
          created_at: Date.now(),
        });
        console.log('[Auth] Key pair saved successfully');
      }

      // Save GitHub token
      console.log('[Auth] Storing GitHub token');
      await SecureStorage.saveGithubToken(request.githubToken);
      if (request.userId) {
        console.log(`[Auth] Storing user ID: ${request.userId}`);
        await SecureStorage.saveUserId(request.userId);
      }

      // Initialize API service
      // Using deployed Replit backend
      const apiBaseUrl = 'https://f88f9dbd-157d-4ef1-aed2-7ba669e1d94b-00-c50nduy6d8kx.riker.replit.dev';
      console.log('[Auth] Initializing API service with baseURL:', apiBaseUrl);

      this.apiService = initializeApiService({
        baseURL: apiBaseUrl,
        timeout: 30000,
        githubToken: request.githubToken,
      });
      console.log('[Auth] API service initialized');

      // Verify connectivity
      console.log('[Auth] Performing health check on relay');
      const isHealthy = await this.apiService.healthCheck();
      if (isHealthy) {
        console.log('[Auth] Relay health check passed');
      } else {
        console.warn('[Auth] Relay health check failed - relay may be offline');
      }

      // Create auth context
      this.authContext = {
        github_token: request.githubToken,
        user_id: request.userId,
        authenticated: true,
      };

      console.log('[Auth] Login successful - user authenticated');
      return this.authContext;
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      const errorMessage = formatErrorMessage(error, { operation: 'login' });
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if user is already authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      console.log('[Auth] Checking authentication status');
      const token = await SecureStorage.loadGithubToken();
      const privateKey = await SecureStorage.loadAppPrivateKey();
      const authenticated = !!(token && privateKey);
      console.log(`[Auth] Authentication status: ${authenticated}`);
      return authenticated;
    } catch (error) {
      console.error('[Auth] Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Restore session from storage
   */
  async restoreSession(): Promise<AuthContext | null> {
    try {
      console.log('[Auth] Attempting to restore session from storage');
      const token = await SecureStorage.loadGithubToken();
      const userId = await SecureStorage.loadUserId();

      if (!token) {
        console.log('[Auth] No GitHub token found in storage - session not available');
        return null;
      }

      console.log('[Auth] GitHub token found, restoring API service');
      // Re-initialize API service with deployed Replit backend
      const apiBaseUrl = 'https://f88f9dbd-157d-4ef1-aed2-7ba669e1d94b-00-c50nduy6d8kx.riker.replit.dev';
      this.apiService = initializeApiService({
        baseURL: apiBaseUrl,
        timeout: 30000,
        githubToken: token,
      });
      console.log('[Auth] API service re-initialized');

      this.authContext = {
        github_token: token,
        user_id: userId || undefined,
        authenticated: true,
      };

      console.log('[Auth] Session restored successfully');
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
      console.log('[Auth] Logout initiated - clearing all stored data');
      await SecureStorage.clearAll();
      console.log('[Auth] Secure storage cleared');
      this.authContext = null;
      this.apiService = null;
      console.log('[Auth] User logged out successfully');
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
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
      console.log('[Auth] Updating GitHub token');
      await SecureStorage.saveGithubToken(newToken);
      console.log('[Auth] New token saved to storage');
      if (this.apiService) {
        this.apiService.setGithubToken(newToken);
        console.log('[Auth] API service token updated');
      }
      if (this.authContext) {
        this.authContext.github_token = newToken;
        console.log('[Auth] Auth context token updated');
      }
      console.log('[Auth] Token update completed successfully');
    } catch (error) {
      console.error('[Auth] Failed to update token:', error);
      throw new Error(`Failed to update token: ${error}`);
    }
  }

  /**
   * Verify app keys exist and are valid
   */
  async verifyKeys(): Promise<boolean> {
    try {
      console.log('[Auth] Verifying app keys');
      const privateKeyPem = await SecureStorage.loadAppPrivateKey();
      const publicKeyPem = await SecureStorage.loadAppPublicKey();

      if (!privateKeyPem || !publicKeyPem) {
        console.warn('[Auth] One or both keys missing');
        return false;
      }

      console.log('[Auth] Keys found, validating PEM format');
      // Try to load them to verify they're valid PEM
      CryptoUtils.loadPrivateKeyFromPem(privateKeyPem);
      console.log('[Auth] Private key validated');
      CryptoUtils.loadPublicKeyFromPem(publicKeyPem);
      console.log('[Auth] Public key validated');

      console.log('[Auth] Key verification successful');
      return true;
    } catch (error) {
      console.error('[Auth] Key verification failed:', error);
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
