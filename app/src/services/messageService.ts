/**
 * Message Service
 *
 * High-level service for managing message lifecycle:
 * 1. Receive encrypted message
 * 2. Decrypt with app's private key
 * 3. Parse and store decrypted work order
 * 4. Prepare reply
 * 5. Encrypt reply with ephemeral key
 * 6. Submit reply
 */

import { CryptoUtils } from '../utils/crypto';
import { SecureStorage } from '../storage/secureStorage';
import { ApiService } from './api';
import { SettingsService } from './settingsService';
import { WorkOrder, StoredMessage, MessageStatus } from '../types';

export class MessageService {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Receive encrypted message (via push notification)
   * Store in local queue for processing
   */
  async receiveEncryptedMessage(encryptedBlob: string): Promise<StoredMessage> {
    try {
      console.log('[MessageService] Receiving encrypted message');
      const messageId = this.generateMessageId();
      console.log(`[MessageService] Generated message ID: ${messageId}`);

      const message: StoredMessage = {
        id: messageId,
        encrypted_blob: encryptedBlob,
        status: MessageStatus.ENCRYPTED,
        created_at: Date.now(),
        topic: 'Unknown',
      };

      console.log(`[MessageService] Adding message to queue with status: ${message.status}`);
      await SecureStorage.addMessage(message);
      console.log(`[MessageService] Message added to queue successfully`);
      return message;
    } catch (error) {
      console.error('[MessageService] Failed to receive encrypted message:', error);
      throw new Error(`Failed to receive message: ${error}`);
    }
  }

  /**
   * Decrypt a stored encrypted message
   * Returns the decrypted work order
   */
  async decryptMessage(messageId: string): Promise<WorkOrder> {
    try {
      console.log(`[MessageService] Decrypting message: ${messageId}`);
      // Load message
      console.log('[MessageService] Loading message from queue');
      const queue = await SecureStorage.loadMessageQueue();
      const message = queue.find(m => m.id === messageId);

      if (!message) {
        console.error(`[MessageService] Message not found: ${messageId}`);
        throw new Error(`Message not found: ${messageId}`);
      }

      console.log(`[MessageService] Found message, status: ${message.status}`);

      if (message.status !== MessageStatus.ENCRYPTED) {
        console.error(`[MessageService] Message already processed: ${message.status}`);
        throw new Error(`Message already processed: ${message.status}`);
      }

      // Load app's private key
      console.log('[MessageService] Loading app private key');
      const privateKeyPem = await SecureStorage.loadAppPrivateKey();
      if (!privateKeyPem) {
        console.error('[MessageService] App private key not found in storage');
        throw new Error('App private key not found');
      }
      console.log('[MessageService] Private key loaded');

      // Decrypt
      console.log('[MessageService] Decrypting message blob with RSA');
      const privateKey = CryptoUtils.loadPrivateKeyFromPem(privateKeyPem);
      const decryptedJson = CryptoUtils.decryptRsa(message.encrypted_blob, privateKey);
      console.log('[MessageService] Message decrypted successfully');

      console.log('[MessageService] Parsing decrypted JSON as WorkOrder');
      const workOrder = JSON.parse(decryptedJson) as WorkOrder;
      console.log(`[MessageService] WorkOrder parsed. Topic: ${workOrder.topic}`);

      // Validate work order
      console.log('[MessageService] Validating work order structure');
      this.validateWorkOrder(workOrder);
      console.log('[MessageService] Work order validation passed');

      // Update message status
      console.log(`[MessageService] Updating message status to DECRYPTED`);
      await SecureStorage.updateMessageStatus(
        messageId,
        MessageStatus.DECRYPTED,
        workOrder
      );
      console.log('[MessageService] Message status updated successfully');

      return workOrder;
    } catch (error) {
      // Mark message as error
      console.error(`[MessageService] Decryption failed, marking message as ERROR:`, error);
      try {
        await SecureStorage.updateMessageStatus(messageId, MessageStatus.ERROR);
      } catch (updateError) {
        console.error('[MessageService] Failed to update message status to ERROR:', updateError);
      }
      throw new Error(`Failed to decrypt message: ${error}`);
    }
  }

  /**
   * Prepare and encrypt reply
   * Returns encrypted reply ready to send
   */
  async prepareReply(messageId: string, userReply: string): Promise<string> {
    try {
      console.log(`[MessageService] Preparing reply for message: ${messageId}`);
      // Get decrypted work order
      console.log('[MessageService] Loading message queue');
      const queue = await SecureStorage.loadMessageQueue();
      const message = queue.find(m => m.id === messageId);

      if (!message?.decrypted_work_order) {
        console.error('[MessageService] Work order not found or not decrypted');
        throw new Error('Work order not found or not decrypted');
      }

      console.log('[MessageService] Work order found, extracting reply encryption key');
      const replyKey = message.decrypted_work_order.reply_instructions.reply_encryption_key;
      console.log('[MessageService] Loading public key from PEM');
      const publicKey = CryptoUtils.loadPublicKeyFromPem(replyKey);
      console.log('[MessageService] Public key loaded');

      // Encrypt reply with ephemeral public key
      console.log('[MessageService] Encrypting reply with ephemeral public key');
      const encryptedReply = CryptoUtils.encryptRsa(userReply, publicKey);
      console.log('[MessageService] Reply encrypted successfully');

      return encryptedReply;
    } catch (error) {
      console.error('[MessageService] Failed to prepare reply:', error);
      throw new Error(`Failed to prepare reply: ${error}`);
    }
  }

  /**
   * Submit encrypted reply to destination
   * Marks message as replied in local queue
   * Increments message usage counter
   */
  async submitReply(messageId: string, encryptedReply: string): Promise<boolean> {
    try {
      console.log(`[MessageService] Submitting reply for message: ${messageId}`);
      // Get message and work order
      console.log('[MessageService] Loading message from queue');
      const queue = await SecureStorage.loadMessageQueue();
      const message = queue.find(m => m.id === messageId);

      if (!message?.decrypted_work_order) {
        console.error('[MessageService] Work order not found for submission');
        throw new Error('Work order not found');
      }

      const replyInstructions = message.decrypted_work_order.reply_instructions;
      console.log(`[MessageService] Destination URL: ${replyInstructions.destination_url}`);
      console.log(`[MessageService] HTTP method: ${replyInstructions.http_method}`);

      // Submit to destination
      console.log('[MessageService] Sending encrypted reply to destination');
      await this.apiService.submitReply(
        replyInstructions.destination_url,
        replyInstructions.http_method,
        encryptedReply
      );
      console.log('[MessageService] Reply submitted to destination successfully');

      // Mark as replied
      console.log('[MessageService] Updating message status to REPLIED');
      await SecureStorage.updateMessageStatus(messageId, MessageStatus.REPLIED);
      console.log('[MessageService] Message status updated to REPLIED');

      // Increment message usage counter for monetization tracking
      console.log('[MessageService] Incrementing message usage counter');
      await SettingsService.incrementMessageUsage();
      console.log('[MessageService] Message usage counter incremented');

      return true;
    } catch (error) {
      console.error('[MessageService] Failed to submit reply:', error);
      throw new Error(`Failed to submit reply: ${error}`);
    }
  }

  /**
   * Get all pending messages
   */
  async getPendingMessages(): Promise<StoredMessage[]> {
    try {
      console.log('[MessageService] Getting pending messages');
      const queue = await SecureStorage.loadMessageQueue();
      const pending = queue.filter(m => m.status === MessageStatus.ENCRYPTED);
      console.log(`[MessageService] Found ${pending.length} pending messages`);
      return pending;
    } catch (error) {
      console.error('[MessageService] Failed to get pending messages:', error);
      return [];
    }
  }

  /**
   * Get all decrypted messages (ready for user action)
   */
  async getDecryptedMessages(): Promise<StoredMessage[]> {
    try {
      console.log('[MessageService] Getting decrypted messages');
      const queue = await SecureStorage.loadMessageQueue();
      const decrypted = queue.filter(m => m.status === MessageStatus.DECRYPTED);
      console.log(`[MessageService] Found ${decrypted.length} decrypted messages`);
      return decrypted;
    } catch (error) {
      console.error('[MessageService] Failed to get decrypted messages:', error);
      return [];
    }
  }

  /**
   * Get message history (replied + error)
   */
  async getMessageHistory(): Promise<StoredMessage[]> {
    try {
      console.log('[MessageService] Getting message history');
      const queue = await SecureStorage.loadMessageQueue();
      const history = queue.filter(m =>
        [MessageStatus.REPLIED, MessageStatus.ERROR].includes(m.status as any)
      );
      console.log(`[MessageService] Found ${history.length} messages in history`);
      return history;
    } catch (error) {
      console.error('[MessageService] Failed to get message history:', error);
      return [];
    }
  }

  /**
   * Clear old messages (older than 24 hours)
   */
  async clearOldMessages(hoursOld: number = 24): Promise<void> {
    try {
      console.log(`[MessageService] Clearing messages older than ${hoursOld} hours`);
      const queue = await SecureStorage.loadMessageQueue();
      console.log(`[MessageService] Loaded ${queue.length} messages from queue`);

      const now = Date.now();
      const filtered = queue.filter(
        m => now - m.created_at < hoursOld * 60 * 60 * 1000
      );

      console.log(`[MessageService] Keeping ${filtered.length} recent messages`);
      await SecureStorage.clearMessageQueue();
      console.log('[MessageService] Cleared message queue');

      for (const msg of filtered) {
        await SecureStorage.addMessage(msg);
      }
      console.log('[MessageService] Re-added recent messages to queue');
    } catch (error) {
      console.error('[MessageService] Failed to clear old messages:', error);
      throw error;
    }
  }

  /**
   * Validate work order structure
   */
  private validateWorkOrder(workOrder: WorkOrder): void {
    try {
      console.log('[MessageService] Validating work order structure');

      if (!workOrder.topic || !workOrder.prompt) {
        console.error('[MessageService] Work order missing topic or prompt');
        throw new Error('Invalid work order: missing topic or prompt');
      }

      if (!workOrder.reply_instructions) {
        console.error('[MessageService] Work order missing reply_instructions');
        throw new Error('Invalid work order: missing reply_instructions');
      }

      const ri = workOrder.reply_instructions;
      if (!ri.destination_url || !ri.http_method || !ri.reply_encryption_key) {
        console.error('[MessageService] Reply instructions incomplete');
        throw new Error('Invalid reply instructions');
      }

      console.log('[MessageService] Work order structure valid');
    } catch (error) {
      console.error('[MessageService] Work order validation failed:', error);
      throw error;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Singleton instance
 */
let messageServiceInstance: MessageService | null = null;

export function initializeMessageService(apiService: ApiService): MessageService {
  messageServiceInstance = new MessageService(apiService);
  return messageServiceInstance;
}

export function getMessageService(): MessageService {
  if (!messageServiceInstance) {
    throw new Error('Message Service not initialized. Call initializeMessageService first.');
  }
  return messageServiceInstance;
}
