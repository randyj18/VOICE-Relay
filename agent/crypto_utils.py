"""
Cryptographic utilities for Phase 0 E2EE spike.
Uses RSA for key exchange and AES for symmetric encryption.
"""

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import json
import base64


class CryptoUtils:
    """Handles RSA and AES encryption/decryption for E2EE."""

    KEY_SIZE = 2048

    @staticmethod
    def generate_key_pair():
        """Generate a new RSA public/private key pair."""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=CryptoUtils.KEY_SIZE,
            backend=default_backend()
        )
        return private_key

    @staticmethod
    def get_public_key_pem(private_key):
        """Extract public key from private key and return as PEM string."""
        public_key = private_key.public_key()
        pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return pem.decode('utf-8')

    @staticmethod
    def get_private_key_pem(private_key):
        """Return private key as PEM string."""
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        return pem.decode('utf-8')

    @staticmethod
    def load_private_key_from_pem(pem_string):
        """Load private key from PEM string."""
        pem_bytes = pem_string.encode('utf-8')
        private_key = serialization.load_pem_private_key(
            pem_bytes,
            password=None,
            backend=default_backend()
        )
        return private_key

    @staticmethod
    def load_public_key_from_pem(pem_string):
        """Load public key from PEM string."""
        pem_bytes = pem_string.encode('utf-8')
        public_key = serialization.load_pem_public_key(
            pem_bytes,
            backend=default_backend()
        )
        return public_key

    @staticmethod
    def generate_aes_key():
        """Generate a random 256-bit AES key."""
        return os.urandom(32)

    @staticmethod
    def encrypt_aes(plaintext, aes_key):
        """Encrypt plaintext using AES-256-GCM. Returns (IV + ciphertext + tag) base64-encoded."""
        iv = os.urandom(12)  # 96-bit IV for GCM
        cipher = Cipher(
            algorithms.AES(aes_key),
            modes.GCM(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()

        # Combine IV + ciphertext + tag, then base64 encode
        encrypted_data = iv + ciphertext + encryptor.tag
        return base64.b64encode(encrypted_data).decode('utf-8')

    @staticmethod
    def decrypt_aes(encrypted_data_b64, aes_key):
        """Decrypt AES-256-GCM encrypted data. Expects base64-encoded (IV + ciphertext + tag)."""
        encrypted_data = base64.b64decode(encrypted_data_b64)

        iv = encrypted_data[:12]
        ciphertext = encrypted_data[12:-16]
        tag = encrypted_data[-16:]

        cipher = Cipher(
            algorithms.AES(aes_key),
            modes.GCM(iv, tag),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()

        return plaintext.decode('utf-8')

    @staticmethod
    def encrypt_rsa(plaintext, public_key):
        """
        Hybrid encryption: RSA + AES-256-GCM.
        For large payloads, we encrypt with AES and wrap the AES key with RSA.
        Returns base64-encoded (RSA_encrypted_aes_key || AES_encrypted_payload).
        """
        # Generate a random AES-256 key
        aes_key = CryptoUtils.generate_aes_key()

        # Encrypt plaintext with AES-256-GCM
        iv = os.urandom(12)  # 96-bit IV for GCM
        cipher = Cipher(
            algorithms.AES(aes_key),
            modes.GCM(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()

        # Encrypt AES key with RSA-OAEP
        encrypted_aes_key = public_key.encrypt(
            aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # Combine: RSA(aes_key) || IV || AES(plaintext) || GCM_TAG
        combined = encrypted_aes_key + iv + ciphertext + encryptor.tag
        return base64.b64encode(combined).decode('utf-8')

    @staticmethod
    def decrypt_rsa(encrypted_data_b64, private_key):
        """
        Decrypt hybrid encrypted data (RSA + AES-256-GCM).
        Expects base64-encoded (RSA_encrypted_aes_key || AES_encrypted_payload).
        """
        encrypted_data = base64.b64decode(encrypted_data_b64)

        # Extract RSA encrypted AES key (256 bytes for 2048-bit RSA)
        encrypted_aes_key = encrypted_data[:256]
        remaining = encrypted_data[256:]

        # Decrypt AES key with RSA
        aes_key = private_key.decrypt(
            encrypted_aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # Extract IV (12 bytes), GCM tag (16 bytes), ciphertext (rest)
        iv = remaining[:12]
        ciphertext = remaining[12:-16]
        tag = remaining[-16:]

        # Decrypt with AES-256-GCM
        cipher = Cipher(
            algorithms.AES(aes_key),
            modes.GCM(iv, tag),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()

        return plaintext.decode('utf-8')
