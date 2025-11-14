/**
 * Type definitions for VOICE Relay Phase 2 app
 */

/**
 * Work Order: Decrypted payload from the relay
 */
export interface WorkOrder {
  topic: string;
  prompt: string;
  reply_instructions: ReplyInstructions;
}

/**
 * Reply Instructions: How and where to send the response
 */
export interface ReplyInstructions {
  destination_url: string;
  http_method: 'POST' | 'PUT';
  reply_encryption_key: string; // PEM-encoded ephemeral public key
}

/**
 * Stored message in local queue
 */
export interface StoredMessage {
  id: string;
  encrypted_blob: string;
  decrypted_work_order?: WorkOrder;
  status: MessageStatus;
  created_at: number; // Unix timestamp
  topic: string;
}

export enum MessageStatus {
  ENCRYPTED = 'encrypted',
  DECRYPTED = 'decrypted',
  REPLIED = 'replied',
  ERROR = 'error',
}

/**
 * User authentication context
 */
export interface AuthContext {
  github_token: string;
  user_id?: string;
  authenticated: boolean;
}

/**
 * App's permanent key pair
 */
export interface AppKeyPair {
  public_key_pem: string;
  private_key_pem: string;
  created_at: number;
}

/**
 * API Response types
 */
export interface GetPublicKeyResponse {
  app_public_key: string;
}

export interface AskResponse {
  status: 'accepted' | 'error';
  message_id?: string;
  detail?: string;
}

/**
 * Settings
 */
export interface AppSettings {
  auto_send: boolean;
  relay_url: string;
  relay_timeout_ms: number;
  messages_limit: number;
}
