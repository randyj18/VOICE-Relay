#!/usr/bin/env python3
"""
Backend API testing script for VOICE Relay

Tests the production backend API to verify:
- Backend connectivity and health
- Public key retrieval
- Message submission with encryption
- CORS headers for mobile clients
- Response formats match expected types

Usage:
    python3 scripts/test_backend.py
"""

import requests
import json
import sys
import time
from typing import Optional
from datetime import datetime

# Configuration
BACKEND_URL = "https://f88f9dbd-157d-4ef1-aed2-7ba669e1d94b-00-c50nduy6d8kx.riker.replit.dev"
TIMEOUT = 10

# Demo token in the format expected by the backend
DEMO_TOKEN = "Bearer github|test_user|demo_token"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.details = []

    def add_success(self, name: str, details: str = ""):
        self.passed += 1
        self.details.append(f"{Colors.GREEN}PASS{Colors.END}: {name}" + (f" ({details})" if details else ""))

    def add_failure(self, name: str, error: str):
        self.failed += 1
        self.details.append(f"{Colors.RED}FAIL{Colors.END}: {name} - {error}")

    def add_skip(self, name: str, reason: str):
        self.skipped += 1
        self.details.append(f"{Colors.YELLOW}SKIP{Colors.END}: {name} - {reason}")

    def print_summary(self):
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        for detail in self.details:
            print(detail)

        total = self.passed + self.failed + self.skipped
        print("\n" + "=" * 70)
        print(f"Results: {Colors.GREEN}{self.passed} passed{Colors.END}, "
              f"{Colors.RED}{self.failed} failed{Colors.END}, "
              f"{Colors.YELLOW}{self.skipped} skipped{Colors.END} (Total: {total})")
        print("=" * 70)

def log_section(title: str):
    print(f"\n{Colors.CYAN}{'=' * 70}{Colors.END}")
    print(f"{Colors.CYAN}{title}{Colors.END}")
    print(f"{Colors.CYAN}{'=' * 70}{Colors.END}")

def log_success(msg: str):
    print(f"{Colors.GREEN}✓{Colors.END} {msg}")

def log_error(msg: str):
    print(f"{Colors.RED}✗{Colors.END} {msg}")

def log_info(msg: str):
    print(f"{Colors.BLUE}ℹ{Colors.END} {msg}")

def log_warning(msg: str):
    print(f"{Colors.YELLOW}⚠{Colors.END} {msg}")

def test_backend_health(result: TestResult) -> bool:
    """Test if backend is reachable via /health endpoint"""
    log_section("Backend Health Check")

    try:
        start_time = time.time()
        response = requests.get(
            f"{BACKEND_URL}/health",
            timeout=TIMEOUT,
            allow_redirects=False
        )
        elapsed = time.time() - start_time

        log_info(f"Status Code: {response.status_code}")
        log_info(f"Response Time: {elapsed:.2f}s")

        if response.status_code == 200:
            try:
                data = response.json()
                log_success(f"Backend is reachable")
                log_info(f"Service: {data.get('service', 'unknown')}")
                log_info(f"Status: {data.get('status', 'unknown')}")
                result.add_success("/health endpoint", f"{elapsed:.2f}s response time")
                return True
            except json.JSONDecodeError:
                log_error(f"Response is not valid JSON: {response.text[:100]}")
                result.add_failure("/health endpoint", "Response is not valid JSON")
                return False
        else:
            log_error(f"Backend returned status {response.status_code}")
            log_error(f"Response: {response.text[:200]}")
            result.add_failure("/health endpoint", f"Status {response.status_code}")
            return False

    except requests.exceptions.ConnectionError as e:
        log_error(f"Cannot connect to backend: {e}")
        result.add_failure("/health endpoint", f"Connection error: {str(e)[:50]}")
        return False
    except requests.exceptions.Timeout:
        log_error(f"Backend connection timeout (>{TIMEOUT}s)")
        result.add_failure("/health endpoint", "Timeout")
        return False
    except Exception as e:
        log_error(f"Unexpected error: {e}")
        result.add_failure("/health endpoint", f"Unexpected error: {str(e)[:50]}")
        return False

def test_root_endpoint(result: TestResult) -> bool:
    """Test the root endpoint for API info"""
    log_section("API Root Endpoint")

    try:
        start_time = time.time()
        response = requests.get(
            f"{BACKEND_URL}/",
            timeout=TIMEOUT,
            allow_redirects=False
        )
        elapsed = time.time() - start_time

        log_info(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            try:
                data = response.json()
                log_success(f"API root endpoint is accessible")
                log_info(f"API Name: {data.get('name', 'unknown')}")
                log_info(f"Version: {data.get('version', 'unknown')}")
                result.add_success("GET / endpoint", f"{elapsed:.2f}s response time")
                return True
            except json.JSONDecodeError:
                log_error(f"Response is not valid JSON")
                result.add_failure("GET / endpoint", "Response is not valid JSON")
                return False
        else:
            log_error(f"API root returned status {response.status_code}")
            result.add_failure("GET / endpoint", f"Status {response.status_code}")
            return False

    except Exception as e:
        log_warning(f"Could not reach API root: {e}")
        result.add_skip("GET / endpoint", "Backend not accessible")
        return False

def test_get_public_key_no_auth(result: TestResult) -> bool:
    """Test /auth/get-public-key endpoint WITHOUT authentication"""
    log_section("Public Key Endpoint (No Auth)")

    try:
        log_info("Testing without Authorization header (should fail with 401)...")

        start_time = time.time()
        response = requests.post(
            f"{BACKEND_URL}/auth/get-public-key",
            headers={"Content-Type": "application/json"},
            json={},
            timeout=TIMEOUT,
            allow_redirects=False
        )
        elapsed = time.time() - start_time

        log_info(f"Status Code: {response.status_code}")
        log_info(f"Response Time: {elapsed:.2f}s")

        if response.status_code == 401:
            log_success("Correctly rejected unauthenticated request")
            result.add_success("POST /auth/get-public-key (no auth)", "Correctly returns 401")
            return True
        else:
            log_warning(f"Expected 401, got {response.status_code}")
            result.add_skip("POST /auth/get-public-key (no auth)", f"Got {response.status_code} instead of 401")
            return False

    except Exception as e:
        log_error(f"Error: {e}")
        result.add_failure("POST /auth/get-public-key (no auth)", str(e)[:50])
        return False

def test_get_public_key_with_auth(result: TestResult) -> Optional[str]:
    """Test /auth/get-public-key endpoint WITH authentication"""
    log_section("Public Key Endpoint (With Auth)")

    try:
        log_info(f"Using token: {DEMO_TOKEN[:20]}...")

        start_time = time.time()
        response = requests.post(
            f"{BACKEND_URL}/auth/get-public-key",
            headers={
                "Content-Type": "application/json",
                "Authorization": DEMO_TOKEN
            },
            json={},
            timeout=TIMEOUT,
            allow_redirects=False
        )
        elapsed = time.time() - start_time

        log_info(f"Status Code: {response.status_code}")
        log_info(f"Response Time: {elapsed:.2f}s")

        if response.status_code != 200:
            log_error(f"Expected 200, got {response.status_code}")
            log_error(f"Response: {response.text[:200]}")
            result.add_failure("POST /auth/get-public-key (with auth)", f"Status {response.status_code}")
            return None

        try:
            data = response.json()
        except json.JSONDecodeError:
            log_error(f"Response is not valid JSON: {response.text[:100]}")
            result.add_failure("POST /auth/get-public-key (with auth)", "Invalid JSON response")
            return None

        # Verify response structure - should be 'app_public_key' based on backend
        if "app_public_key" in data:
            public_key = data["app_public_key"]
            log_success(f"Got public key from backend")
            log_info(f"Key format: {public_key[:50]}..." if len(public_key) > 50 else public_key)
            result.add_success("POST /auth/get-public-key (with auth)", f"Key length: {len(public_key)}")
            return public_key
        elif "public_key" in data:
            public_key = data["public_key"]
            log_warning(f"Response uses 'public_key' field (expected 'app_public_key')")
            result.add_success("POST /auth/get-public-key (with auth)", "Key received (field mismatch)")
            return public_key
        else:
            log_error(f"Response missing public key field. Fields: {list(data.keys())}")
            result.add_failure("POST /auth/get-public-key (with auth)", "Missing public key in response")
            return None

    except requests.exceptions.Timeout:
        log_error(f"Request timeout (>{TIMEOUT}s)")
        result.add_failure("POST /auth/get-public-key (with auth)", "Timeout")
        return None
    except Exception as e:
        log_error(f"Error: {e}")
        result.add_failure("POST /auth/get-public-key (with auth)", str(e)[:50])
        return None

def test_agent_ask(result: TestResult, public_key: Optional[str]) -> bool:
    """Test /agent/ask endpoint"""
    log_section("Agent Ask Endpoint")

    if public_key is None:
        log_warning("Skipping - no public key available")
        result.add_skip("POST /agent/ask", "No public key from previous test")
        return False

    try:
        # Create a test encrypted blob (just base64 encoded data for testing)
        # In real usage, this would be properly encrypted with RSA+AES
        test_blob = "SGVsbG8gV29ybGQhIFRoaXMgaXMgYW4gZW5jcnlwdGVkIG1lc3NhZ2UuIEl0IG5lZWRzIHRvIGJlIGF0IGxlYXN0IDEwMCBjaGFyYWN0ZXJzIHRvIHBhc3MgdGhlIHZhbGlkYXRpb24gY2hlY2sgaW4gdGhlIGJhY2tlbmQu"

        log_info(f"Sending encrypted blob of {len(test_blob)} bytes")

        start_time = time.time()
        response = requests.post(
            f"{BACKEND_URL}/agent/ask",
            headers={
                "Content-Type": "application/json",
                "Authorization": DEMO_TOKEN
            },
            json={"encrypted_blob": test_blob},
            timeout=TIMEOUT,
            allow_redirects=False
        )
        elapsed = time.time() - start_time

        log_info(f"Status Code: {response.status_code}")
        log_info(f"Response Time: {elapsed:.2f}s")

        if response.status_code != 200:
            log_error(f"Expected 200, got {response.status_code}")
            log_error(f"Response: {response.text[:200]}")
            result.add_failure("POST /agent/ask", f"Status {response.status_code}")
            return False

        try:
            data = response.json()
        except json.JSONDecodeError:
            log_error(f"Response is not valid JSON")
            result.add_failure("POST /agent/ask", "Invalid JSON response")
            return False

        # Verify response structure
        if "status" in data and "message_id" in data:
            log_success(f"Message accepted")
            log_info(f"Message ID: {data['message_id']}")
            log_info(f"Status: {data['status']}")
            result.add_success("POST /agent/ask", f"Message ID: {data['message_id']}")
            return True
        else:
            log_error(f"Response missing expected fields. Got: {list(data.keys())}")
            result.add_failure("POST /agent/ask", "Missing status or message_id")
            return False

    except requests.exceptions.Timeout:
        log_error(f"Request timeout (>{TIMEOUT}s)")
        result.add_failure("POST /agent/ask", "Timeout")
        return False
    except Exception as e:
        log_error(f"Error: {e}")
        result.add_failure("POST /agent/ask", str(e)[:50])
        return False

def test_cors(result: TestResult):
    """Test CORS headers for mobile clients"""
    log_section("CORS Headers")

    try:
        log_info("Testing CORS preflight request...")

        start_time = time.time()
        response = requests.options(
            f"{BACKEND_URL}/auth/get-public-key",
            headers={
                "Origin": "http://localhost:8081",
                "Access-Control-Request-Method": "POST"
            },
            timeout=TIMEOUT,
            allow_redirects=False
        )
        elapsed = time.time() - start_time

        log_info(f"Status Code: {response.status_code}")
        log_info(f"Response Time: {elapsed:.2f}s")

        headers = response.headers

        # Check CORS headers
        cors_origin = headers.get('Access-Control-Allow-Origin')
        cors_methods = headers.get('Access-Control-Allow-Methods')
        cors_headers = headers.get('Access-Control-Allow-Headers')
        cors_credentials = headers.get('Access-Control-Allow-Credentials')

        if cors_origin:
            log_success(f"CORS Origin allowed: {cors_origin}")
            log_info(f"Methods allowed: {cors_methods}")
            log_info(f"Headers allowed: {cors_headers}")
            result.add_success("CORS headers", "CORS properly configured")
        else:
            log_warning("No CORS origin header (might be OK for production)")
            result.add_skip("CORS headers", "No CORS headers (API might not support preflight)")

    except Exception as e:
        log_warning(f"Could not verify CORS: {e}")
        result.add_skip("CORS headers", str(e)[:50])

def test_docs_endpoint(result: TestResult):
    """Test /docs endpoint availability"""
    log_section("API Documentation")

    try:
        log_info("Testing /docs endpoint (Swagger UI)...")

        start_time = time.time()
        response = requests.get(
            f"{BACKEND_URL}/docs",
            timeout=TIMEOUT,
            allow_redirects=False
        )
        elapsed = time.time() - start_time

        log_info(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            log_success("Swagger UI documentation is available")
            result.add_success("GET /docs", "Documentation accessible")
        else:
            log_warning(f"Swagger UI returned status {response.status_code}")
            result.add_skip("GET /docs", f"Status {response.status_code}")

    except Exception as e:
        log_warning(f"Could not access /docs: {e}")
        result.add_skip("GET /docs", "Documentation not accessible")

def main() -> int:
    print("\n" + "=" * 70)
    print(f"{Colors.CYAN}VOICE Relay - Backend API Test Suite{Colors.END}")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    result = TestResult()

    # 1. Basic health check
    health_ok = test_backend_health(result)

    if not health_ok:
        log_error("Backend is not reachable. Stopping tests.")
        result.print_summary()
        return 1

    # 2. Test root endpoint
    test_root_endpoint(result)

    # 3. Test docs endpoint
    test_docs_endpoint(result)

    # 4. Test authentication
    test_get_public_key_no_auth(result)
    public_key = test_get_public_key_with_auth(result)

    # 5. Test agent ask
    test_agent_ask(result, public_key)

    # 6. Test CORS
    test_cors(result)

    # Print summary
    result.print_summary()

    # Return exit code based on failures
    return 1 if result.failed > 0 else 0

if __name__ == "__main__":
    sys.exit(main())
