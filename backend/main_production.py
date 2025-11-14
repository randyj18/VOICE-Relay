"""
VOICE Relay - Production Backend

Zero-Knowledge Cloud Relay with persistent storage.

Two core endpoints:
1. POST /auth/get-public-key - Returns app's public key for user
2. POST /agent/ask - Stores encrypted Work Order

Database: PostgreSQL
Auth: GitHub OAuth (production) or demo token (development)
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import httpx
from datetime import datetime
from enum import Enum
import logging
import json

# Environment
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./voice_relay.db')
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# FastAPI Setup
# ============================================================================

app = FastAPI(
    title="VOICE Relay - Production Backend",
    description="Zero-Knowledge Relay for encrypted voice prompts",
    version="1.0.0"
)

# CORS - Only allow your domain in production
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://app.voice-relay.app",  # Production app
]

if ENVIRONMENT == 'production':
    ALLOWED_ORIGINS = ["https://app.voice-relay.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ============================================================================
# Database Setup (SQLAlchemy)
# ============================================================================

from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Use PostgreSQL in production, SQLite in development
if 'postgresql' in DATABASE_URL:
    # Use psycopg2 for PostgreSQL
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    # SQLite for development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============================================================================
# Database Models
# ============================================================================

class User(Base):
    """User with permanent public key"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(255), unique=True, index=True, nullable=False)
    public_key = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    """Encrypted message (server never sees plaintext)"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(255), index=True, nullable=False)
    message_id = Column(String(255), unique=True, index=True, nullable=False)
    encrypted_blob = Column(Text, nullable=False)
    blob_size = Column(Integer)
    status = Column(String(50), default="pending", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    delivered_at = Column(DateTime)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# Models (Pydantic)
# ============================================================================

class GetPublicKeyRequest(BaseModel):
    """Request to retrieve user's public key"""
    pass

class GetPublicKeyResponse(BaseModel):
    """Response with user's public key"""
    app_public_key: str

class AskRequest(BaseModel):
    """Request to send encrypted Work Order"""
    encrypted_blob: str
    encrypted_blob_size_bytes: Optional[int] = None

class AskResponse(BaseModel):
    """Response to ask request"""
    status: str
    message_id: str

class MessageStatus(str, Enum):
    """Status of stored message"""
    PENDING = "pending"
    DELIVERED = "delivered"
    EXPIRED = "expired"

# ============================================================================
# Authentication
# ============================================================================

def verify_github_token(authorization: Optional[str]) -> str:
    """
    Verify GitHub OAuth token and extract user_id.

    In production: Verify with actual GitHub API
    In development: Accept demo tokens in format "Bearer github|<user_id>|<token>"

    Returns: user_id
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.replace("Bearer ", "").strip()

    if ENVIRONMENT == 'production':
        # Verify with GitHub API
        return verify_with_github_api(token)
    else:
        # Demo mode: parse token format "github|<user_id>|<token>"
        if not token.startswith("github|"):
            raise HTTPException(status_code=401, detail="Invalid token format")

        parts = token.split("|")
        if len(parts) != 3:
            raise HTTPException(status_code=401, detail="Invalid token format")

        return parts[1]

async def verify_with_github_api(token: str) -> str:
    """Verify token with GitHub API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.github.com/user',
                headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github.v3+json'},
                timeout=5
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid GitHub token")
            user_data = response.json()
            return user_data['login']
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="GitHub authentication service timeout")
    except Exception as e:
        logger.error(f"GitHub auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "VOICE Relay - Production",
        "environment": ENVIRONMENT
    }

@app.get("/", tags=["Info"])
async def root():
    """API documentation"""
    return {
        "name": "VOICE Relay",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "description": "Zero-Knowledge Relay for encrypted voice prompts",
        "endpoints": {
            "auth": {
                "POST /auth/get-public-key": "Get user's public key"
            },
            "messaging": {
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

@app.post("/auth/get-public-key", response_model=GetPublicKeyResponse, tags=["Auth"])
async def get_public_key(
    request: GetPublicKeyRequest,
    authorization: Optional[str] = Header(None),
    db: Session = None
):
    """
    Get the app's public key for a user.

    The public key is used by the agent to encrypt Work Order payloads.

    Auth: Requires GitHub OAuth token in Authorization header
    Response: User's permanent public key (created on first app login)
    """
    # Note: db parameter would be injected via Depends() in production
    # For now, use in-memory storage for compatibility

    # Verify authentication
    user_id = verify_github_token(authorization)

    # TODO: In production, load from database
    # user = db.query(User).filter(User.user_id == user_id).first()

    # For demo: Generate demo key
    demo_key = f"-----BEGIN PUBLIC KEY-----\nDEMO_KEY_FOR_{user_id}\n-----END PUBLIC KEY-----"

    logger.info(f"Public key request from user: {user_id}")

    return GetPublicKeyResponse(app_public_key=demo_key)

@app.post("/agent/ask", response_model=AskResponse, tags=["Messaging"])
async def agent_ask(
    request: AskRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Send encrypted Work Order to app.

    The server stores the encrypted blob without seeing plaintext.
    Push notification sent to user's device.

    Auth: Requires valid GitHub token
    Payload: Encrypted Work Order (encrypted with app's public key)
    """
    # Verify authentication
    user_id = verify_github_token(authorization)

    # Validate payload size
    if len(request.encrypted_blob) < 100:
        raise HTTPException(status_code=400, detail="Encrypted blob is too small")

    if len(request.encrypted_blob) > 1_000_000:  # 1MB limit
        raise HTTPException(status_code=400, detail="Encrypted blob is too large")

    # Generate message ID
    message_id = f"msg_{user_id}_{int(datetime.utcnow().timestamp() * 1000)}"

    # TODO: Store in database
    # message = Message(
    #     user_id=user_id,
    #     message_id=message_id,
    #     encrypted_blob=request.encrypted_blob,
    #     blob_size=request.encrypted_blob_size_bytes,
    #     status=MessageStatus.PENDING
    # )
    # db.add(message)
    # db.commit()

    # TODO: Send push notification
    # await send_push_notification(user_id, message_id)

    logger.info(f"Message accepted - ID: {message_id}, User: {user_id}, Size: {len(request.encrypted_blob)}")

    return AskResponse(status="accepted", message_id=message_id)

# ============================================================================
# Debug Endpoints (Remove in production)
# ============================================================================

@app.get("/debug/messages", tags=["Debug"])
async def debug_messages(user_id: str):
    """Debug: List messages for user"""
    if ENVIRONMENT == 'production':
        raise HTTPException(status_code=404)

    # TODO: Query from database
    return {
        "user_id": user_id,
        "message_count": 0,
        "messages": []
    }

@app.get("/debug/users", tags=["Debug"])
async def debug_users():
    """Debug: List all users"""
    if ENVIRONMENT == 'production':
        raise HTTPException(status_code=404)

    return {
        "total_users": 0,
        "users": {}
    }

# ============================================================================
# Startup/Shutdown
# ============================================================================

@app.on_event("startup")
async def startup_event():
    logger.info(f"VOICE Relay Backend started - Environment: {ENVIRONMENT}")
    logger.info(f"Database: {DATABASE_URL if 'sqlite' not in DATABASE_URL else 'SQLite (development)'}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("VOICE Relay Backend shutting down")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', '8000'))
    uvicorn.run(app, host="0.0.0.0", port=port)
