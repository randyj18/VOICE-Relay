"""
Test script for Phase 1 Relay backend.

Tests the two core endpoints:
1. GET /auth/get-public-key
2. POST /agent/ask
"""

import httpx
import json
import time
import asyncio
from typing import Optional


BASE_URL = "http://localhost:8000"
DEMO_USER_ID = "testuser123"
DEMO_TOKEN = f"Bearer github|{DEMO_USER_ID}|fake_token_abc123"


async def test_health():
    """Test health endpoint"""
    print("\n[TEST] Health Check")
    print("GET /health")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

    assert response.status_code == 200


async def test_root():
    """Test root endpoint"""
    print("\n[TEST] Root Endpoint")
    print("GET /")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

    assert response.status_code == 200


async def test_get_public_key():
    """Test GET /auth/get-public-key endpoint"""
    print("\n[TEST] Get Public Key")
    print(f"POST /auth/get-public-key")
    print(f"Auth: {DEMO_TOKEN}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/auth/get-public-key",
            headers={"Authorization": DEMO_TOKEN},
            json={}
        )

        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Public Key (first 100 chars): {data.get('app_public_key', '')[:100]}...")

    assert response.status_code == 200
    assert "app_public_key" in response.json()

    return response.json()


async def test_agent_ask(public_key: str):
    """Test POST /agent/ask endpoint"""
    print("\n[TEST] Agent Ask")
    print(f"POST /agent/ask")
    print(f"Auth: {DEMO_TOKEN}")

    # Simulate encrypted Work Order (use Phase 0 output for real testing)
    fake_encrypted_blob = "x" * 500  # Simulate base64-encoded encrypted payload

    payload = {
        "encrypted_blob": fake_encrypted_blob,
        "encrypted_blob_size_bytes": len(fake_encrypted_blob)
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/agent/ask",
            headers={"Authorization": DEMO_TOKEN},
            json=payload
        )

        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

    assert response.status_code == 200
    assert data["status"] == "accepted"
    assert "message_id" in data

    return data


async def test_invalid_auth():
    """Test invalid authentication"""
    print("\n[TEST] Invalid Authentication")
    print("POST /agent/ask (no auth header)")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/agent/ask",
            json={"encrypted_blob": "test"}
        )

        print(f"Status: {response.status_code}")
        print(f"Expected: 401")

    assert response.status_code == 401


async def test_invalid_blob():
    """Test invalid encrypted blob"""
    print("\n[TEST] Invalid Encrypted Blob")
    print("POST /agent/ask (blob too short)")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/agent/ask",
            headers={"Authorization": DEMO_TOKEN},
            json={"encrypted_blob": "short"}  # Too short
        )

        print(f"Status: {response.status_code}")
        print(f"Expected: 400")

    assert response.status_code == 400


async def test_debug_messages():
    """Test debug endpoint"""
    print("\n[TEST] Debug Messages")
    print(f"GET /debug/messages?user_id={DEMO_USER_ID}")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/debug/messages?user_id={DEMO_USER_ID}")

        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

    assert response.status_code == 200


async def test_debug_users():
    """Test debug users endpoint"""
    print("\n[TEST] Debug Users")
    print("GET /debug/users")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/debug/users")

        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

    assert response.status_code == 200


async def main():
    """Run all tests"""
    print("=" * 80)
    print("VOICE Relay - Phase 1 Backend Tests")
    print("=" * 80)

    try:
        # Test basic endpoints
        await test_health()
        await test_root()

        # Test main functionality
        public_key_response = await test_get_public_key()
        ask_response = await test_agent_ask(public_key_response["app_public_key"])

        # Test error cases
        await test_invalid_auth()
        await test_invalid_blob()

        # Test debug endpoints
        await test_debug_messages()
        await test_debug_users()

        print("\n" + "=" * 80)
        print("[OK] All tests passed!")
        print("=" * 80)

    except AssertionError as e:
        print(f"\n[ERROR] Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n[ERROR] {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
