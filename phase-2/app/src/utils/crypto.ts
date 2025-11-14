/**
 * Cryptographic utilities for Phase 2 React Native app
 * Handles RSA key pair generation, encryption, and decryption
 * Uses node-forge for cross-platform compatibility
 */

import forge from 'node-forge';

export class CryptoUtils {
  static readonly KEY_SIZE = 2048;

  /**
   * Generate a new RSA public/private key pair
   * Used for permanent app keys on first login
   */
  static generateKeyPair(): forge.pki.KeyPair {
    return forge.pki.rsa.generateKeyPair(CryptoUtils.KEY_SIZE);
  }

  /**
   * Convert public key to PEM format
   */
  static getPublicKeyPem(publicKey: forge.pki.PublicKey): string {
    return forge.pki.publicKeyToPem(publicKey);
  }

  /**
   * Convert private key to PEM format
   */
  static getPrivateKeyPem(privateKey: forge.pki.PrivateKey): string {
    return forge.pki.privateKeyToPem(privateKey);
  }

  /**
   * Load private key from PEM string
   */
  static loadPrivateKeyFromPem(pemString: string): forge.pki.PrivateKey {
    return forge.pki.privateKeyFromPem(pemString);
  }

  /**
   * Load public key from PEM string
   */
  static loadPublicKeyFromPem(pemString: string): forge.pki.PublicKey {
    return forge.pki.publicKeyFromPem(pemString);
  }

  /**
   * Decrypt hybrid encrypted data (RSA + AES-256-GCM)
   * This is used to decrypt Work Orders from the relay
   *
   * Format: RSA_encrypted_aes_key || IV || AES_encrypted_payload || GCM_TAG
   */
  static decryptRsa(
    encryptedDataB64: string,
    privateKey: forge.pki.PrivateKey
  ): string {
    try {
      const encryptedData = forge.util.decode64(encryptedDataB64);

      // Extract RSA encrypted AES key (256 bytes for 2048-bit RSA)
      const encrypted_aes_key = encryptedData.substring(0, 256);
      const remaining = encryptedData.substring(256);

      // Decrypt AES key with RSA
      const aes_key = privateKey.decrypt(encrypted_aes_key, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create(),
        },
      });

      // Extract IV (12 bytes), GCM tag (16 bytes), ciphertext (rest)
      const iv = remaining.substring(0, 12);
      const ciphertext = remaining.substring(12, remaining.length - 16);
      const tag = remaining.substring(remaining.length - 16);

      // Decrypt with AES-256-GCM
      const decipher = forge.cipher.createDecipher('AES-GCM', aes_key);
      decipher.start({ iv, tag });
      decipher.update(forge.util.createBuffer(ciphertext, 'binary'));

      if (!decipher.finish()) {
        throw new Error('AES-GCM decryption failed: tag verification failed');
      }

      return decipher.output.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Encrypt plaintext using RSA-OAEP with SHA256
   * Used to encrypt replies to send back to the agent
   */
  static encryptRsa(plaintext: string, publicKey: forge.pki.PublicKey): string {
    try {
      // Generate a random AES-256 key
      const aes_key = forge.random.getBytesSync(32);

      // Encrypt plaintext with AES-256-GCM
      const iv = forge.random.getBytesSync(12); // 96-bit IV for GCM
      const cipher = forge.cipher.createCipher('AES-GCM', aes_key);
      cipher.start({ iv });
      cipher.update(forge.util.createBuffer(plaintext, 'utf8'));
      cipher.finish();

      // Encrypt AES key with RSA-OAEP
      const encrypted_aes_key = publicKey.encrypt(aes_key, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create(),
        },
      });

      // Combine: RSA(aes_key) || IV || AES(plaintext) || GCM_TAG
      const combined = encrypted_aes_key + iv + cipher.output.getBytes() + cipher.mode.tag.getBytes();
      return forge.util.encode64(combined);
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }
}
