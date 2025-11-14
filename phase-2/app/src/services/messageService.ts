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
    const message: StoredMessage = {
      id: this.generateMessageId(),
      encrypted_blob: encryptedBlob,
      status: MessageStatus.ENCRYPTED,
      created_at: Date.now(),
      topic: 'Unknown',
    };

    await SecureStorage.addMessage(message);
    return message;
  }

  /**
   * Decrypt a stored encrypted message
   * Returns the decrypted work order
   */
  async decryptMessage(messageId: string): Promise<WorkOrder> {
    try {
      // Load message
      const queue = await SecureStorage.loadMessageQueue();
      const message = queue.find(m => m.id === messageId);

      if (!message) {
        throw new Error(`Message not found: ${messageId}`);
      }

      if (message.status !== MessageStatus.ENCRYPTED) {
        throw new Error(`Message already processed: ${message.status}`);
      }

      // Load app's private key
      const privateKeyPem = await SecureStorage.loadAppPrivateKey();
      if (!privateKeyPem) {
        throw new Error('App private key not found');
      }

      // Decrypt
      const privateKey = CryptoUtils.loadPrivateKeyFromPem(privateKeyPem);
      const decryptedJson = CryptoUtils.decryptRsa(message.encrypted_blob, privateKey);
      const workOrder = JSON.parse(decryptedJson) as WorkOrder;

      // Validate work order
      this.validateWorkOrder(workOrder);

      // Update message status
      await SecureStorage.updateMessageStatus(
        messageId,
        MessageStatus.DECRYPTED,
        workOrder
      );

      return workOrder;
    } catch (error) {
      // Mark message as error
      await SecureStorage.updateMessageStatus(messageId, MessageStatus.ERROR);
      throw new Error(`Failed to decrypt message: ${error}`);
    }
  }

  /**
   * Prepare and encrypt reply
   * Returns encrypted reply ready to send
   */
  async prepareReply(messageId: string, userReply: string): Promise<string> {
    try {
      // Get decrypted work order
      const queue = await SecureStorage.loadMessageQueue();
      const message = queue.find(m => m.id === messageId);

      if (!message?.decrypted_work_order) {
        throw new Error('Work order not found or not decrypted');
      }

      const replyKey = message.decrypted_work_order.reply_instructions.reply_encryption_key;
      const publicKey = CryptoUtils.loadPublicKeyFromPem(replyKey);

      // Encrypt reply with ephemeral public key
      const encryptedReply = CryptoUtils.encryptRsa(userReply, publicKey);

      return encryptedReply;
    } catch (error) {
      throw new Error(`Failed to prepare reply: ${error}`);
    }
  }

  /**
   * Submit encrypted reply to destination
   * Marks message as replied in local queue
   */
  async submitReply(messageId: string, encryptedReply: string): Promise<boolean> {
    try {
      // Get message and work order
      const queue = await SecureStorage.loadMessageQueue();
      const message = queue.find(m => m.id === messageId);

      if (!message?.decrypted_work_order) {
        throw new Error('Work order not found');
      }

      const replyInstructions = message.decrypted_work_order.reply_instructions;

      // Submit to destination
      await this.apiService.submitReply(
        replyInstructions.destination_url,
        replyInstructions.http_method,
        encryptedReply
      );

      // Mark as replied
      await SecureStorage.updateMessageStatus(messageId, MessageStatus.REPLIED);

      return true;
    } catch (error) {
      throw new Error(`Failed to submit reply: ${error}`);
    }
  }

  /**
   * Get all pending messages
   */
  async getPendingMessages(): Promise<StoredMessage[]> {
    const queue = await SecureStorage.loadMessageQueue();
    return queue.filter(m => m.status === MessageStatus.ENCRYPTED);
  }

  /**
   * Get all decrypted messages (ready for user action)
   */
  async getDecryptedMessages(): Promise<StoredMessage[]> {
    const queue = await SecureStorage.loadMessageQueue();
    return queue.filter(m => m.status === MessageStatus.DECRYPTED);
  }

  /**
   * Get message history (replied + error)
   */
  async getMessageHistory(): Promise<StoredMessage[]> {
    const queue = await SecureStorage.loadMessageQueue();
    return queue.filter(m =>
      [MessageStatus.REPLIED, MessageStatus.ERROR].includes(m.status as any)
    );
  }

  /**
   * Clear old messages (older than 24 hours)
   */
  async clearOldMessages(hoursOld: number = 24): Promise<void> {
    const queue = await SecureStorage.loadMessageQueue();
    const now = Date.now();
    const filtered = queue.filter(
      m => now - m.created_at < hoursOld * 60 * 60 * 1000
    );
    await SecureStorage.clearMessageQueue();
    for (const msg of filtered) {
      await SecureStorage.addMessage(msg);
    }
  }

  /**
   * Validate work order structure
   */
  private validateWorkOrder(workOrder: WorkOrder): void {
    if (!workOrder.topic || !workOrder.prompt) {
      throw new Error('Invalid work order: missing topic or prompt');
    }

    if (!workOrder.reply_instructions) {
      throw new Error('Invalid work order: missing reply_instructions');
    }

    const ri = workOrder.reply_instructions;
    if (!ri.destination_url || !ri.http_method || !ri.reply_encryption_key) {
      throw new Error('Invalid reply instructions');
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
