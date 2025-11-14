"""
Phase 1: Zero-Knowledge Cloud Relay Backend

A simple, stateless API with two core endpoints:
1. POST /auth/get-public-key - Returns the app's public key for a user
2. POST /agent/ask - Stores encrypted Work Order and sends push notification

The server never sees plaintext data. All payloads are encrypted.
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import json
import os
import httpx
from datetime import datetime
from enum import Enum


# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="VOICE Relay - Phase 1 Backend",
    description="Zero-Knowledge Relay for encrypted voice prompts",
    version="0.1.0"
)

# Simple in-memory storage (for demo - use persistent DB in production)
# Keys: user_id, Values: {"public_key": "...", "messages": [...]}
USER_DATA = {}

# Simulated message queue (in production: use proper message broker)
MESSAGE_QUEUE = []


# ============================================================================
# Models
# ============================================================================

class GetPublicKeyRequest(BaseModel):
    """Request to retrieve user's public key"""
    pass


class GetPublicKeyResponse(BaseModel):
    """Response with user's public key"""
    app_public_key: str


class AskRequest(BaseModel):
    """Request to send encrypted Work Order to app"""
    encrypted_blob: str
    encrypted_blob_size_bytes: Optional[int] = None  # For logging


class AskResponse(BaseModel):
    """Response to ask request"""
    status: str
    message_id: str


class MessageStatus(str, Enum):
    """Status of a stored message"""
    PENDING = "pending"
    DELIVERED = "delivered"
    EXPIRED = "expired"


class StoredMessage(BaseModel):
    """Representation of stored encrypted message"""
    message_id: str
    user_id: str
    encrypted_blob: str
    created_at: str
    status: MessageStatus


# ============================================================================
# Authentication (GitHub OAuth stub for Phase 1)
# ============================================================================

def verify_github_token(authorization: Optional[str]) -> str:
    """
    Verify GitHub OAuth token and extract user_id.

    For Phase 1, we accept tokens in format: "Bearer github|<user_id>|<token>"
    In production, verify with GitHub API.

    Returns: user_id
    """
    print(f"[DEBUG] Authorization header received: {repr(authorization)}")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.replace("Bearer ", "").strip()
    print(f"[DEBUG] Token after Bearer removal: {repr(token)}")

    # Demo: Parse user_id from token format "github|<user_id>|<token>"
    if not token.startswith("github|"):
        print(f"[DEBUG] Token does not start with 'github|'")
        raise HTTPException(status_code=401, detail="Invalid token format")

    parts = token.split("|")
    print(f"[DEBUG] Split parts: {parts}, count: {len(parts)}")

    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Invalid token format")

    user_id = parts[1]
    print(f"[DEBUG] Extracted user_id: {user_id}")
    return user_id


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "VOICE Relay - Phase 1",
        "messages_queued": len(MESSAGE_QUEUE)
    }


@app.post("/auth/get-public-key", response_model=GetPublicKeyResponse, tags=["Auth"])
async def get_public_key(
    request: GetPublicKeyRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Get the app's public key for a user.

    The public key is used by the agent to encrypt Work Order payloads.

    Auth: Requires GitHub OAuth token in Authorization header
    Response: User's permanent public key (created on first app login)
    """

    # Verify authentication
    user_id = verify_github_token(authorization)

    # For Phase 1 demo: If user doesn't exist, create with a demo public key
    if user_id not in USER_DATA:
        USER_DATA[user_id] = {
            "public_key": f"-----BEGIN PUBLIC KEY-----\nDEMO_KEY_FOR_{user_id}\n-----END PUBLIC KEY-----",
            "messages": [],
            "created_at": datetime.utcnow().isoformat()
        }

    user = USER_DATA[user_id]
    return GetPublicKeyResponse(app_public_key=user["public_key"])


@app.post("/agent/ask", response_model=AskResponse, tags=["Agent"])
async def agent_ask(
    request: AskRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Agent sends an encrypted Work Order to be delivered to the app.

    The encrypted_blob is a complete Work Order encrypted with the app's public key.
    The server cannot decrypt it (zero-knowledge).

    Steps:
    1. Verify agent authentication (GitHub OAuth)
    2. Validate encrypted_blob (basic sanity checks)
    3. Store blob with metadata
    4. Send push notification to app (simulated in Phase 1)
    5. Return message_id

    Auth: Requires GitHub OAuth token in Authorization header
    Body: {"encrypted_blob": "base64_encrypted_data"}
    Response: {"status": "accepted", "message_id": "uuid"}
    """

    # Verify authentication
    user_id = verify_github_token(authorization)

    # Validate encrypted blob
    if not request.encrypted_blob or len(request.encrypted_blob) < 100:
        raise HTTPException(
            status_code=400,
            detail="encrypted_blob must be valid base64 and at least 100 characters"
        )

    # Generate message ID (in production: use UUID)
    message_id = f"msg_{user_id}_{len(MESSAGE_QUEUE):06d}"

    # Store encrypted message
    message = {
        "message_id": message_id,
        "user_id": user_id,
        "encrypted_blob": request.encrypted_blob,
        "created_at": datetime.utcnow().isoformat(),
        "status": MessageStatus.PENDING,
        "blob_size_bytes": len(request.encrypted_blob.encode('utf-8'))
    }

    MESSAGE_QUEUE.append(message)

    # Ensure user data exists
    if user_id not in USER_DATA:
        USER_DATA[user_id] = {
            "public_key": None,  # Should be set before asking
            "messages": []
        }

    # Add to user's messages
    USER_DATA[user_id]["messages"].append(message_id)

    # Log (in production: use proper logging)
    print(f"[ASK] User {user_id} sent message {message_id}")
    print(f"      Blob size: {message['blob_size_bytes']} bytes")
    print(f"      Queue depth: {len(MESSAGE_QUEUE)}")

    # Simulate push notification (Phase 1: just log it)
    # In production: integrate with FCM, APNs, etc.
    _simulate_push_notification(user_id, message_id)

    return AskResponse(
        status="accepted",
        message_id=message_id
    )


# ============================================================================
# Simulation endpoints (for Phase 1 testing)
# ============================================================================

@app.get("/debug/messages", tags=["Debug"])
async def debug_list_messages(user_id: Optional[str] = None):
    """List stored messages (debug endpoint)"""
    if user_id and user_id not in USER_DATA:
        raise HTTPException(status_code=404, detail="User not found")

    if user_id:
        return {
            "user_id": user_id,
            "message_count": len(USER_DATA[user_id].get("messages", [])),
            "messages": USER_DATA[user_id].get("messages", [])
        }

    return {
        "total_messages": len(MESSAGE_QUEUE),
        "users": list(USER_DATA.keys())
    }


@app.get("/debug/users", tags=["Debug"])
async def debug_list_users():
    """List all users (debug endpoint)"""
    return {
        "total_users": len(USER_DATA),
        "users": {
            user_id: {
                "message_count": len(data.get("messages", [])),
                "has_public_key": bool(data.get("public_key")),
                "created_at": data.get("created_at")
            }
            for user_id, data in USER_DATA.items()
        }
    }


@app.post("/debug/clear", tags=["Debug"])
async def debug_clear_all():
    """Clear all data (debug endpoint)"""
    global USER_DATA, MESSAGE_QUEUE
    USER_DATA = {}
    MESSAGE_QUEUE = []
    return {"status": "cleared"}


# ============================================================================
# Helper functions
# ============================================================================

def _simulate_push_notification(user_id: str, message_id: str):
    """
    Simulate sending push notification to app.

    In production, this would:
    1. Look up device tokens for user_id (stored in user table)
    2. Use FCM (Android) or APNs (iOS) to send push
    3. Handle failures and retries
    """
    print(f"[PUSH] Simulating push notification: user={user_id}, message={message_id}")
    # TODO: Phase 2 - Implement real push notifications with FCM/APNs


# ============================================================================
# Exception handlers
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    print(f"[ERROR] {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# ============================================================================
# Root endpoint
# ============================================================================

@app.get("/", tags=["Info"])
async def root():
    """Root endpoint with API info"""
    return {
        "name": "VOICE Relay",
        "phase": "Phase 1",
        "version": "0.1.0",
        "description": "Zero-Knowledge Relay for encrypted voice prompts",
        "endpoints": {
            "auth": {
                "POST /auth/get-public-key": "Get user's public key"
            },
            "agent": {
                "POST /agent/ask": "Send encrypted Work Order"
            },
            "health": {
                "GET /health": "Health check"
            },
            "docs": {
                "GET /docs": "Interactive API documentation",
                "GET /openapi.json": "OpenAPI schema"
            }
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
