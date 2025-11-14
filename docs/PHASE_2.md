# Phase 2: Core React Native App

## Overview

Phase 2 builds the actual React Native application that users will install on their phones. The app handles:

1. **Authentication**: GitHub OAuth integration
2. **Key Management**: RSA key generation and secure storage
3. **Message Reception**: Encrypted messages via push notification
4. **Decryption**: Using app's private key to decrypt work orders
5. **User Interaction**: Display prompt, collect reply
6. **Reply Encryption**: Encrypt response with ephemeral key
7. **Reply Submission**: Send encrypted response to destination

## Architecture

```
┌─────────────────────────────────────┐
│   React Native App (User Device)    │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  App.tsx (Main Screen)          ││
│  │  - Display messages             ││
│  │  - Show prompts                 ││
│  │  - Collect user replies         ││
│  └────────────────┬────────────────┘│
│                   │                 │
│  ┌────────────────▼────────────────┐│
│  │  AuthService                    ││
│  │  - GitHub OAuth                 ││
│  │  - Key generation               ││
│  │  - Session management           ││
│  └────────────────┬────────────────┘│
│                   │                 │
│  ┌────────────────▼────────────────┐│
│  │  MessageService                 ││
│  │  - Decrypt work orders          ││
│  │  - Prepare replies              ││
│  │  - Submit encrypted responses   ││
│  └────────────────┬────────────────┘│
│                   │                 │
│  ┌────────────────▼────────────────┐│
│  │  CryptoUtils                    ││
│  │  - RSA encryption/decryption    ││
│  │  - AES-256-GCM (via hybrid)     ││
│  │  - Key pair generation          ││
│  └────────────────┬────────────────┘│
│                   │                 │
│  ┌────────────────▼────────────────┐│
│  │  SecureStorage                  ││
│  │  - Persist keys (at rest)       ││
│  │  - Cache messages               ││
│  │  - Store settings               ││
│  └─────────────────────────────────┘│
│                   │                 │
│  ┌────────────────▼────────────────┐│
│  │  ApiService                     ││
│  │  - HTTP client (axios)          ││
│  │  - Auth headers                 ││
│  │  - Error handling               ││
│  └────────────────┬────────────────┘│
│                   │                 │
└───────────────────┼─────────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │  VOICE Relay Backend    │
        │  (Phase 1)              │
        │                         │
        │  POST /auth/get-pubkey  │
        │  POST /agent/ask        │
        └─────────────────────────┘
```

## Project Structure

```
phase-2/app/
├── package.json                    (Dependencies)
├── tsconfig.json                   (TypeScript config)
├── src/
│   ├── App.tsx                     (Main app component)
│   ├── types/
│   │   └── index.ts                (Type definitions)
│   ├── services/
│   │   ├── authService.ts          (Auth & key management)
│   │   ├── api.ts                  (HTTP client)
│   │   └── messageService.ts       (Message lifecycle)
│   ├── storage/
│   │   └── secureStorage.ts        (Persistent storage)
│   ├── utils/
│   │   └── crypto.ts               (Encryption/decryption)
│   ├── screens/                    (UI screens - Phase 3)
│   └── components/                 (Reusable components - Phase 3)
```

## Core Services

### AuthService
Manages user authentication and key generation:
- GitHub OAuth login
- RSA key pair generation (first login)
- Secure storage of keys and token
- Session restoration
- Logout and account management

**Key Methods**:
```typescript
login(request: LoginRequest): Promise<AuthContext>
isAuthenticated(): Promise<boolean>
restoreSession(): Promise<AuthContext | null>
logout(): Promise<void>
verifyKeys(): Promise<boolean>
```

### MessageService
Handles the message lifecycle:
- Receive encrypted messages (push notification)
- Decrypt work orders
- Prepare encrypted replies
- Submit replies to destination

**Key Methods**:
```typescript
receiveEncryptedMessage(encryptedBlob: string): Promise<StoredMessage>
decryptMessage(messageId: string): Promise<WorkOrder>
prepareReply(messageId: string, userReply: string): Promise<string>
submitReply(messageId: string, encryptedReply: string): Promise<boolean>
```

### CryptoUtils
RSA and AES encryption/decryption:
- Key pair generation
- PEM encoding/decoding
- Hybrid RSA+AES-256-GCM encryption
- Message decryption

**Key Methods**:
```typescript
generateKeyPair(): forge.pki.KeyPair
decryptRsa(encryptedDataB64: string, privateKey): string
encryptRsa(plaintext: string, publicKey): string
loadPrivateKeyFromPem(pem): forge.pki.PrivateKey
loadPublicKeyFromPem(pem): forge.pki.PublicKey
```

### SecureStorage
Persistent, encrypted-at-rest storage:
- App's private key
- GitHub OAuth token
- Message queue
- User settings
- Sync metadata

**Key Methods**:
```typescript
saveAppPrivateKey(pem: string): Promise<void>
loadAppPrivateKey(): Promise<string | null>
addMessage(message: StoredMessage): Promise<void>
loadMessageQueue(): Promise<StoredMessage[]>
clearAll(): Promise<void>
```

### ApiService
HTTP communication with relay backend:
- Bearer token auth
- Error handling
- Timeout management

**Key Methods**:
```typescript
healthCheck(): Promise<boolean>
getPublicKey(): Promise<string>
fetchMessages(): Promise<string[]>
submitReply(url: string, method: string, encrypted: string): Promise<boolean>
```

## Data Flow

### 1. First Time Setup (Login)

```
User inputs GitHub token
        ↓
AuthService.login()
        ↓
Generate RSA key pair
        ↓
Save keys (encrypted at rest) + token
        ↓
Initialize API service
        ↓
Verify connectivity
        ↓
✓ Ready for messages
```

### 2. Receive Message

```
Push notification received
        ↓
Get encrypted blob from relay
        ↓
Store in local queue (SecureStorage)
        ↓
Update UI with new message
```

### 3. Decrypt & Display

```
User taps message
        ↓
MessageService.decryptMessage(id)
        ↓
Load app's private key
        ↓
Decrypt blob using hybrid RSA+AES
        ↓
Parse Work Order JSON
        ↓
Display topic and prompt to user
        ↓
✓ User ready to reply
```

### 4. Submit Reply

```
User enters reply text
        ↓
MessageService.prepareReply(id, text)
        ↓
Load ephemeral public key from work order
        ↓
Encrypt reply using hybrid RSA+AES
        ↓
MessageService.submitReply(id, encrypted)
        ↓
POST encrypted reply to destination_url
        ↓
Mark message as "replied"
        ↓
✓ Done - fire and forget
```

## Security Properties

### Encryption Standards
- **RSA**: 2048-bit keys, OAEP padding with SHA256
- **AES**: 256-bit keys, GCM mode (authenticated encryption)
- **Hybrid**: RSA wraps AES key, AES encrypts payload
- **Transport**: HTTPS (in production)

### Key Storage
- **Private Key**: Encrypted at rest in device secure storage
  - iOS: Keychain
  - Android: EncryptedSharedPreferences
- **OAuth Token**: Secure storage with expiration handling
- **No Plain text**: Never stored unencrypted on device

### Zero-Knowledge
- ✓ App's private key never leaves device
- ✓ Agent never knows app's private key
- ✓ Server never sees plaintext
- ✓ One-time ephemeral keys for replies

### Device Security
- Secure enclave for key storage
- App-specific keystore isolation
- Support for biometric authentication (Phase 3+)

## Testing Phase 2

### Manual Testing

1. **Build app**:
   ```bash
   cd phase-2/app
   npm install
   npm start
   ```

2. **Run on device/emulator**:
   ```bash
   npm run android    # Android
   npm run ios        # iOS
   ```

3. **Test flow**:
   - Enter test GitHub token: `github|testuser123|fake_token`
   - Tap "Simulate Message" to add test message
   - Select message and tap "Decrypt"
   - Enter reply text
   - Tap "Submit Reply"
   - Verify message marked as "replied"

### Unit Tests (Phase 3+)
- CryptoUtils encryption/decryption
- SecureStorage persistence
- MessageService state transitions
- AuthService key management
- ApiService error handling

## Phase 2 Deliverables

✓ Type definitions (WorkOrder, MessageStatus, etc.)
✓ Secure storage with AsyncStorage
✓ Crypto utilities (RSA + AES-256-GCM)
✓ Authentication service (OAuth stub)
✓ Message service (decrypt + reply)
✓ API service (HTTP client)
✓ Main app screen
✓ Message queue management
✓ Full decryption/encryption flow

## Phase 3+: Future Enhancements

- **Voice Integration**: TTS (speak prompt) + STT (record reply)
- **UI Screens**: Topics, message queue, settings
- **Push Notifications**: Real FCM/APNs integration
- **Biometric Auth**: Fingerprint/face unlock
- **Auto-reply**: Smart responses
- **Monetization**: Track usage against 100-prompt limit

## Configuration

### Relay URL
Currently hardcoded to `http://localhost:8000`. Update in:
- `src/services/authService.ts` → `initializeApiService()`
- Load from config file (Phase 3+)

### Token Format (Phase 2)
- Format: `Bearer github|<user_id>|<token>`
- Example: `Bearer github|testuser123|my_token_xyz`

### Future (Production)
- Load relay URL from config
- Use real GitHub OAuth flow
- Token refresh strategy
- Error reporting and logging

## Known Limitations (Phase 2)

1. **Token format**: Simplified for testing (no real GitHub validation)
2. **Message source**: No real push notifications yet
3. **Storage**: AsyncStorage (upgrade to Keychain/Keystore in production)
4. **UI**: Single screen (topics/queues added in Phase 4)
5. **Voice**: TTS/STT added in Phase 3
6. **Monetization**: Limit tracking added in Phase 5

## North Star: Simplicity & Speed

Phase 2 maintains the North Star by:
- Only essential services (auth, crypto, messages, storage, API)
- Minimal UI (show prompt, collect reply, that's it)
- No bloat (no unnecessary features)
- Fast path from message → reply
- Clean, testable code

Next phases add features but maintain this simplicity principle.
