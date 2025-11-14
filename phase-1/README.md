# Phase 1: Zero-Knowledge Cloud Relay Backend

## Overview

Phase 1 implements the simple, stateless backend API that relays encrypted messages between agents and the mobile app. The relay never sees plaintext data (zero-knowledge architecture).

## Core Endpoints

### 1. `POST /auth/get-public-key`

**Purpose**: Agent retrieves the app's public key

**Auth**: GitHub OAuth token (Bearer token)

**Request**:
```json
{}
```

**Response**:
```json
{
  "app_public_key": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

**Flow**:
1. Agent authenticates with GitHub token
2. Relay looks up user's permanent public key
3. Returns public key (created on first app login)

---

### 2. `POST /agent/ask`

**Purpose**: Agent sends encrypted Work Order to be delivered to app

**Auth**: GitHub OAuth token (Bearer token)

**Request**:
```json
{
  "encrypted_blob": "base64_encoded_rsa_aes_hybrid_encrypted_work_order",
  "encrypted_blob_size_bytes": 1024
}
```

**Response**:
```json
{
  "status": "accepted",
  "message_id": "msg_user_123_000001"
}
```

**Flow**:
1. Agent encrypts Work Order with app's public key (RSA + AES hybrid)
2. Agent POSTs encrypted blob to relay
3. Relay stores blob with metadata (no decryption)
4. Relay sends push notification to app (via FCM/APNs)
5. Relay returns message_id to agent
6. Agent stores message_id for later reply retrieval

**Security**:
- Relay cannot decrypt the blob (zero-knowledge)
- Blob is associated with user_id from auth token
- Timestamp tracked for TTL/expiration

---

## Architecture

```
┌──────────────────┐
│   Python Agent   │
│                  │
│ 1. GET /auth/    │
│    get-public-key├──────────────┐
│                  │              │
│ 2. POST /agent/  │              │
│    ask           │              │
└──────────────────┘              │
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │  Relay Backend      │
                        │  (FastAPI/Uvicorn)  │
                        │                     │
                        │ - Stores encrypted  │
                        │ - Sends push notif  │
                        │ - Stateless         │
                        │ - Zero-knowledge    │
                        └─────────────────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │  React Native App   │
                        │                     │
                        │ - Receives push     │
                        │ - Fetches encrypted │
                        │ - Decrypts locally  │
                        │ - Replies with      │
                        │   ephemeral key     │
                        └─────────────────────┘
```

---

## Running the Backend

### Setup

```bash
cd phase-1/relay-backend
pip install -r requirements.txt
```

### Run Server

```bash
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

### Access API Documentation

- Interactive: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## Testing

### Run Tests

```bash
# In terminal 1: Start the server
python main.py

# In terminal 2: Run tests
python test_relay.py
```

### Test Coverage

The test script (`test_relay.py`) validates:
- ✓ Health check endpoint
- ✓ Root endpoint
- ✓ Get public key (valid auth)
- ✓ Agent ask (valid encrypted blob)
- ✓ Authentication validation (invalid token)
- ✓ Payload validation (blob too short)
- ✓ Debug endpoints (list messages, list users)

---

## Authentication

For Phase 1, we use a simple token format for testing:

```
Authorization: Bearer github_<user_id>_<token>
```

**Example**:
```
Authorization: Bearer github_user123_fake_token_abc
```

In production (Phase 2+):
- Validate tokens with GitHub OAuth API
- Store device tokens (FCM/APNs) per user
- Implement token refresh flow
- Use secure session management

---

## Debug Endpoints

For Phase 1 testing, there are debug endpoints:

### `GET /debug/messages?user_id=<user_id>`
List all messages for a user.

### `GET /debug/users`
List all registered users and their message counts.

### `POST /debug/clear`
Clear all in-memory data (testing only).

---

## Storage (Phase 1 vs Production)

**Phase 1 (Demo)**:
- In-memory Python dictionaries
- Resets on server restart
- Single-instance only

**Production (Phase 2+)**:
- Persistent database (PostgreSQL)
- Message queue (Redis/RabbitMQ)
- Distributed deployment
- Push notification integration (FCM/APNs)

---

## Security Properties

### Zero-Knowledge Guarantee

✓ Relay never stores plaintext
✓ Relay never decrypts payloads
✓ Only app has private key
✓ Agent uses ephemeral keys for replies

### Threat Model

- **Server compromise**: Attacker gains encrypted blobs (worthless without keys)
- **Network interception**: Encrypted in transit (use HTTPS in production)
- **Token compromise**: Limited to one user, tokens should be short-lived

---

## Future Work (Phase 2+)

- [ ] Implement real database (PostgreSQL)
- [ ] Integrate push notifications (FCM/APNs)
- [ ] Add message TTL/expiration
- [ ] Implement reply fetch endpoint
- [ ] Add rate limiting and quotas
- [ ] Deploy to production (AWS/GCP)
- [ ] Add comprehensive logging
- [ ] Implement metrics and monitoring

---

## North Star: Simplicity & Speed

Phase 1 follows the North Star principles:

**Simplicity**:
- Only 2 core endpoints (get-public-key, ask)
- Single responsibility per endpoint
- No unnecessary features
- Minimal dependencies

**Speed**:
- Stateless design (easy to scale)
- Fast request/response cycle
- Simple in-memory storage (for demo)
- No heavy computations

**Zero-Knowledge**:
- Server cannot decrypt payloads
- No plaintext data stored
- Ephemeral keys limit exposure
