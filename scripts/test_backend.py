#!/usr/bin/env python3
"""
Backend API testing script for VOICE Relay
Claude Code can run this to verify backend is working without needing device
"""

import requests
import json
import sys
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP, AES
from Crypto.Random import get_random_bytes
import base64

# Configuration
BACKEND_URL = "https://f88f9dbd-157d-4ef1-aed2-7ba669e1d94b-00-c50nduy6d8kx.riker.replit.dev"
TIMEOUT = 10

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_success(msg):
    print(f"{Colors.GREEN}✓{Colors.END} {msg}")

def log_error(msg):
    print(f"{Colors.RED}✗{Colors.END} {msg}")

def log_info(msg):
    print(f"{Colors.BLUE}ℹ{Colors.END} {msg}")

def log_warning(msg):
    print(f"{Colors.YELLOW}⚠{Colors.END} {msg}")

def test_backend_health():
    """Test if backend is reachable"""
    print("\n=== Backend Health Check ===")
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=TIMEOUT)
        if response.status_code == 200:
            log_success("Backend is reachable and responsive")
            return True
        else:
            log_error(f"Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError as e:
        log_error(f"Cannot connect to backend: {e}")
        return False
    except requests.exceptions.Timeout:
        log_error("Backend connection timeout")
        return False
    except Exception as e:
        log_error(f"Unexpected error: {e}")
        return False

def test_get_public_key():
    """Test /auth/get-public-key endpoint"""
    print("\n=== Testing GET /auth/get-public-key ===")

    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/get-public-key",
            headers={"Content-Type": "application/json"},
            json={},
            timeout=TIMEOUT
        )

        if response.status_code != 200:
            log_error(f"Expected 200, got {response.status_code}")
            log_error(f"Response: {response.text}")
            return None

        data = response.json()

        # Verify response structure
        if "public_key" not in data:
            log_error("Response missing 'public_key' field")
            return None

        public_key_pem = data["public_key"]

        # Verify it's a valid RSA public key
        try:
            public_key = RSA.import_key(public_key_pem)
            log_success(f"Got valid public key ({public_key.size_in_bits()} bit RSA)")
            return public_key
        except ValueError as e:
            log_error(f"Invalid public key format: {e}")
            return None

    except Exception as e:
        log_error(f"Error: {e}")
        return None

def test_agent_ask(public_key):
    """Test /agent/ask endpoint with encryption"""
    print("\n=== Testing POST /agent/ask ===")

    if public_key is None:
        log_warning("Skipping (no public key)")
        return False

    try:
        # Create test message
        test_message = "hello world"

        # Generate ephemeral AES key
        aes_key = get_random_bytes(32)  # 256-bit key
        iv = get_random_bytes(16)

        # Encrypt message with AES
        cipher_aes = AES.new(aes_key, AES.MODE_CBC, iv)
        encrypted_message = cipher_aes.encrypt(
            test_message.encode().ljust(16 * ((len(test_message) + 15) // 16))
        )

        # Encrypt AES key with RSA
        cipher_rsa = PKCS1_OAEP.new(public_key)
        encrypted_aes_key = cipher_rsa.encrypt(aes_key)

        # Prepare payload
        payload = {
            "encrypted_message": base64.b64encode(encrypted_message).decode(),
            "encrypted_key": base64.b64encode(encrypted_aes_key).decode(),
            "iv": base64.b64encode(iv).decode()
        }

        log_info(f"Sending encrypted message: '{test_message}'")

        response = requests.post(
            f"{BACKEND_URL}/agent/ask",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=TIMEOUT
        )

        if response.status_code != 200:
            log_error(f"Expected 200, got {response.status_code}")
            log_error(f"Response: {response.text}")
            return False

        data = response.json()

        # Verify response structure
        if "message" not in data:
            log_error("Response missing 'message' field")
            return False

        log_success(f"Got response: {data['message']}")
        return True

    except Exception as e:
        log_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_cors():
    """Test CORS headers for mobile client"""
    print("\n=== Testing CORS Headers ===")

    try:
        response = requests.options(
            f"{BACKEND_URL}/auth/get-public-key",
            headers={
                "Origin": "http://localhost:8081",
                "Access-Control-Request-Method": "POST"
            },
            timeout=TIMEOUT
        )

        # Check CORS headers
        allowed_origin = response.headers.get('Access-Control-Allow-Origin')
        allowed_methods = response.headers.get('Access-Control-Allow-Methods')

        if allowed_origin:
            log_success(f"CORS origin allowed: {allowed_origin}")
        else:
            log_warning("No CORS origin header (might be OK)")

        if allowed_methods:
            log_info(f"CORS methods allowed: {allowed_methods}")

        return True

    except Exception as e:
        log_warning(f"Could not verify CORS: {e}")
        return True  # Not critical

def main():
    print("=" * 50)
    print("VOICE Relay - Backend API Testing")
    print("=" * 50)

    # Test health
    if not test_backend_health():
        log_error("Backend is not reachable. Cannot continue.")
        return 1

    # Test public key endpoint
    public_key = test_get_public_key()

    # Test agent ask endpoint
    if public_key:
        test_agent_ask(public_key)
    else:
        log_error("Cannot test /agent/ask without public key")

    # Test CORS
    test_cors()

    print("\n" + "=" * 50)
    print("Backend testing complete")
    print("=" * 50)

    return 0

if __name__ == "__main__":
    sys.exit(main())
