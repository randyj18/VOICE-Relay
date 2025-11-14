/**
 * Cryptographic utilities for Phase 0 E2EE spike (React Native)
 * Uses node-forge for RSA encryption/decryption
 */

import forge from 'node-forge';


export class CryptoUtils {
  static KEY_SIZE = 2048;

  /**
   * Generate a new RSA public/private key pair
   */
  static generateKeyPair(): forge.pki.KeyPair {
    const keyPair = forge.pki.rsa.generateKeyPair(CryptoUtils.KEY_SIZE);
    return keyPair;
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
   * Encrypt plaintext using RSA-OAEP with SHA256
   * Returns base64-encoded ciphertext
   */
  static encryptRsa(plaintext: string, publicKey: forge.pki.PublicKey): string {
    const encrypted = publicKey.encrypt(plaintext, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });
    return forge.util.encode64(encrypted);
  }

  /**
   * Decrypt RSA-OAEP encrypted data
   * Expects base64-encoded ciphertext
   */
  static decryptRsa(encryptedDataB64: string, privateKey: forge.pki.PrivateKey): string {
    const encryptedData = forge.util.decode64(encryptedDataB64);
    const decrypted = privateKey.decrypt(encryptedData, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });
    return decrypted;
  }

  /**
   * Generate a random AES-256 key
   */
  static generateAesKey(): string {
    return forge.random.getBytesSync(32);
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * Returns base64-encoded (IV + ciphertext + tag)
   */
  static encryptAes(plaintext: string, aesKey: string): string {
    const iv = forge.random.getBytesSync(12); // 96-bit IV for GCM
    const cipher = forge.cipher.createCipher('AES-GCM', aesKey);
    cipher.start({ iv });
    cipher.update(forge.util.createBuffer(plaintext, 'utf8'));
    cipher.finish();

    const encryptedData = iv + cipher.output.getBytes() + cipher.mode.tag.getBytes();
    return forge.util.encode64(encryptedData);
  }

  /**
   * Decrypt AES-256-GCM encrypted data
   * Expects base64-encoded (IV + ciphertext + tag)
   */
  static decryptAes(encryptedDataB64: string, aesKey: string): string {
    const encryptedData = forge.util.decode64(encryptedDataB64);

    const iv = encryptedData.substring(0, 12);
    const ciphertext = encryptedData.substring(12, encryptedData.length - 16);
    const tag = encryptedData.substring(encryptedData.length - 16);

    const decipher = forge.cipher.createDecipher('AES-GCM', aesKey);
    decipher.start({ iv, tag });
    decipher.update(forge.util.createBuffer(ciphertext, 'binary'));

    if (!decipher.finish()) {
      throw new Error('AES-GCM decryption failed: tag verification failed');
    }

    return decipher.output.toString('utf8');
  }
}
