# Phase 0 Spike: E2EE Proof of Concept

## Objective

Prove that end-to-end encryption (E2EE) works seamlessly between:
1. **Python Agent** (simulating the user's local script/IDE plugin)
2. **React Native App** (simulating the mobile client)

## Architecture

```
┌─────────────────┐
│  Python Agent   │
│                 │
│ 1. Generate     │
│    temp keys    │
│ 2. Encrypt      │
│    "hello world"│
│ 3. Decrypt      │
│    reply        │
└────────┬────────┘
         │ RSA Encrypted
         │ (app_pub_key)
         │
         ▼
┌─────────────────────┐
│  React Native App   │
│                     │
│ 1. Has permanent    │
│    key pair         │
│ 2. Decrypts msg     │
│ 3. Encrypts reply   │
│    (temp_pub_key)   │
└─────────────────────┘
```

## E2EE Flow

### Agent Side (Python)

```python
# 1. Assumes app has public key (stored on server)
app_pub_key = fetch_from_server()

# 2. Generate ephemeral keys
temp_priv, temp_pub = generate_ephemeral_keys()

# 3. Create Work Order with reply instructions
work_order = {
    "topic": "...",
    "prompt": "hello world",
    "reply_instructions": {
        "destination_url": "...",
        "reply_encryption_key": temp_pub
    }
}

# 4. Encrypt with app's public key
encrypted = RSA_encrypt(work_order, app_pub_key)

# 5. Send to relay (server)
POST /agent/ask encrypted

# 6. Receive encrypted reply
encrypted_reply = wait_for_reply()

# 7. Decrypt with temp private key
reply = RSA_decrypt(encrypted_reply, temp_priv)
```

### App Side (React Native)

```typescript
// 1. App has permanent keys (generated on first login)
app_priv_key = load_from_secure_storage()

// 2. Receive encrypted Work Order via push notification
encrypted_work_order = get_from_push()

// 3. Decrypt with app's private key
work_order = RSA_decrypt(encrypted_work_order, app_priv_key)

// 4. Read prompt and reply instructions
prompt = work_order.prompt  // "hello world"
temp_pub_key = work_order.reply_instructions.reply_encryption_key

// 5. User speaks/types their answer
user_answer = "Hello from React Native!"

// 6. Encrypt reply with ephemeral public key
encrypted_reply = RSA_encrypt(user_answer, temp_pub_key)

// 7. Send to destination URL (fire and forget)
POST work_order.reply_instructions.destination_url encrypted_reply
```

## Key Properties

| Property | Value |
|----------|-------|
| RSA Key Size | 2048 bits |
| RSA Padding | OAEP with SHA256 |
| AES (future) | 256-bit GCM |
| Encoding | Base64 for transport |
| Zero-Knowledge | ✓ Server never sees plaintext |

## Running Phase 0

### Python Agent

```bash
cd phase-0/python-agent
pip install -r requirements.txt
python agent.py
```

**Output:**
- `app_public_key.pem` - App's permanent public key
- `app_private_key.pem` - App's permanent private key (simulated storage)
- `temp_public_key.pem` - Ephemeral public key from agent
- `encrypted_work_order.txt` - Encrypted "hello world" message
- `encrypted_reply.txt` - Encrypted reply from app
- `phase0_summary.json` - Summary of successful E2EE flow

### React Native App

```bash
cd phase-0/react-native-app
npm install
npm start
# In another terminal:
npm run android  # or npm run ios
```

**UI Flow:**
1. Press "Generate App Keys" - Creates app's permanent key pair
2. Press "Receive & Decrypt Work Order" - Simulates receiving encrypted message
3. Press "Send Encrypted Reply" - Simulates encrypting and sending response
4. View logs to confirm decryption was successful

## Success Criteria

✓ Python agent encrypts "hello world" with app's public key
✓ React Native app decrypts using its private key
✓ App encrypts a reply with ephemeral public key
✓ Python agent decrypts reply using ephemeral private key
✓ Server sees only encrypted blobs (zero-knowledge confirmed)

## Next Steps

Once Phase 0 is complete:

1. **Phase 1**: Build the Relay (backend with 2 endpoints)
2. **Phase 2**: Real React Native app with authentication
3. **Phase 3**: Voice mode (TTS/STT integration)
4. **Phase 4**: Visual UI (topics/queues)
5. **Phase 5**: Monetization (100-prompt limit)

## Security Notes

- Keys are generated fresh for each run (demo purposes)
- In production, app's private key is stored in secure enclave
- Ephemeral keys are one-time use per request
- Server stores only encrypted blobs
- No plaintext data ever touches the server
