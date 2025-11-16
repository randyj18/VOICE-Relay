---
name: testing-voice-relay
description: Executing comprehensive testing for VOICE Relay including E2EE encryption tests, backend API endpoint validation, TypeScript build verification, and mobile app testing across all 5 phases. Use when testing, verifying functionality, debugging issues, or ensuring production readiness.
version: 1.0.0
allowed-tools: ["Bash", "Read", "Write", "Edit", "Grep"]
dependencies: []
---

# Testing VOICE Relay

Complete testing procedures for all 5 phases of VOICE Relay.

## Quick Test Commands

```bash
# Backend tests
cd backend && python test_relay.py

# TypeScript tests
cd app && npm run test:types

# Linting
cd app && npm run test:lint

# All tests
cd app && npm run test:all
```

## Phase 0: E2EE Testing

**Goal**: Verify encryption/decryption works in Python and React Native

### Run E2EE Round-Trip Test
```bash
cd agent
pip install -r requirements.txt
python agent.py
```

**Expected Output**:
```
[OK] Phase 0: E2EE Proof of Concept
[OK] Agent Generated Ephemeral RSA Key Pair
[OK] Created Work Order
[OK] Encrypted Work Order with App Public Key
[OK] Round-trip E2EE SUCCESSFUL
```

**Validates**:
- ✓ RSA-2048 key generation
- ✓ Hybrid RSA + AES-256-GCM encryption
- ✓ Payload encryption/decryption
- ✓ Ephemeral key usage
- ✓ Round-trip communication

## Phase 1: Backend Testing

**Goal**: Verify FastAPI relay server endpoints

### 1. Start Backend Server
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 2. Run Test Suite (separate terminal)
```bash
cd backend
python test_relay.py
```

**Expected**: All 8 tests pass
- Health check (200)
- Get public key with/without auth
- Agent ask with valid/invalid payloads
- Debug endpoints
- Error handling

### 3. Manual Endpoint Testing

**Health Check**:
```bash
curl http://127.0.0.1:8000/health
# Expected: {"status": "healthy"}
```

**Get Public Key**:
```bash
curl -X POST http://127.0.0.1:8000/auth/get-public-key \
  -H "Authorization: Bearer github|testuser|faketoken"
# Expected: {"app_public_key": "-----BEGIN PUBLIC KEY-----..."}
```

**Agent Ask**:
```bash
curl -X POST http://127.0.0.1:8000/agent/ask \
  -H "Authorization: Bearer github|testuser|faketoken" \
  -H "Content-Type: application/json" \
  -d '{"encrypted_blob": "base64_data", "encrypted_blob_size_bytes": 256}'
# Expected: {"status": "accepted", "message_id": "msg_..."}
```

## Phase 2: Core App Testing

**Goal**: Verify authentication and decryption

### Setup
```bash
cd app
npm install
npm start  # Terminal 1
npm run android  # or: npm run ios (Terminal 2)
```

### Test Login Flow
1. App starts on LoginScreen
2. Enter token: `github|testuser|faketoken`
3. Tap "Login"

**Expected**:
- ✓ RSA key pair generated
- ✓ Token stored securely
- ✓ Navigate to HomeScreen
- ✓ Shows "0 messages"

### Test Message Decryption
1. Add test message to queue
2. Tap topic → MessageQueueScreen
3. Tap message → MessageDetailScreen
4. App auto-decrypts

**Expected**:
- ✓ Prompt displays correctly
- ✓ Status shows "📖 Pending Reply"
- ✓ Reply input appears

## Phase 3: Voice Mode Testing

**Goal**: Verify TTS/STT and auto-send

### Test Text-to-Speech
1. HomeScreen → "🎤 Start Voice Mode"
2. VoiceModeScreen loads

**Expected**:
- ✓ Shows "🔊 Speaking..." or "🎤 Listening..."
- ✓ App speaks prompt using device TTS
- ✓ Transcript displays

### Test Speech-to-Text
1. In Voice Mode after prompt is read
2. Speak a reply
3. Check real-time transcript

**Expected**:
- ✓ Transcript updates as you speak
- ✓ After 2 sec silence, listening stops
- ✓ Full transcript appears

### Test Auto-Send
**With Auto-Send OFF**:
- Buttons appear: [Send], [Read Back], [Retry], [Skip]

**With Auto-Send ON**:
- After 2 sec silence → Auto-sends
- Shows "✓ Sent"
- Moves to next message

## Phase 4: Multi-Screen UI Testing

### HomeScreen
**Expected**:
- ✓ Title: "VOICE Relay"
- ✓ Message count displayed
- ✓ "🎤 Start Voice Mode" button
- ✓ Topics list with unread counts
- ✓ "⚙️ Settings" button

### MessageQueueScreen
**Expected**:
- ✓ Back button works
- ✓ Messages sorted by creation time
- ✓ Status badges (🔐 Encrypted, 📖 Decrypted, ✓ Sent, ❌ Error)
- ✓ Timestamps display correctly

### MessageDetailScreen
**Expected**:
- ✓ Topic name at top
- ✓ Status badge shown
- ✓ Full prompt text
- ✓ Reply input and Send button
- ✓ Security info box

### SettingsScreen
**Expected**:
- ✓ Voice Mode: Auto-Send toggle
- ✓ Usage: "X / 100 messages"
- ✓ Server URL and timeout
- ✓ About section with version
- ✓ Logout button

## Phase 5: Monetization Testing

**Goal**: Verify 100-prompt limit and monthly reset

### Test Usage Tracking
1. Send 80 messages
2. Open SettingsScreen

**Expected**: "80 / 100" with orange warning

### Test Limit Enforcement
1. Reach 100/100 usage
2. Try to send new reply

**Expected**:
- ✓ Alert: "Free Tier Limit Reached"
- ✓ Reply NOT submitted
- ✓ Red warning in Settings

### Test Monthly Reset
Check that usage resets after 30 days (test with mocked date)

## End-to-End Integration Test

Full flow: agent → backend → app → reply

### Setup (3 terminals)
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# Terminal 2: App
cd app
npm start
npm run android  # or ios

# Terminal 3: Agent
cd agent
pip install -r requirements.txt
```

### E2E Flow
1. **App**: Login with test token
2. **Agent**: Run `python agent.py` (encrypts prompt)
3. **App**: Receives & decrypts message
4. **App**: User sends reply (encrypted)
5. **Verify**: End-to-end encryption maintained

## Quick Test Checklist

### Unit Tests
- [ ] Crypto Utils: encrypt/decrypt round-trip
- [ ] Auth Service: login/logout/session
- [ ] Message Service: receive/decrypt/submit
- [ ] Settings Service: get/set/reset/usage
- [ ] Voice Service: speak/listen/silence-detection

### Integration Tests
- [ ] Backend + App: Authentication
- [ ] Backend + App: Get public key
- [ ] Backend + App: Submit encrypted message
- [ ] App: Decrypt message
- [ ] Agent ↔ App: Full E2EE round-trip

### Security Tests
- [ ] Private key stored securely
- [ ] Proper encryption algorithms (RSA-OAEP, AES-GCM)
- [ ] Ephemeral keys used correctly
- [ ] Server never sees plaintext

### Edge Cases
- [ ] Network timeout handling
- [ ] Decryption failure (corrupted blob)
- [ ] Missing keys
- [ ] Empty message queue
- [ ] 100-prompt limit enforcement
- [ ] Monthly reset at 30 days

## Debugging Tips

### View App Logs
```bash
# Android
adb logcat

# iOS
xcrun simctl spawn booted log stream --predicate 'process == "Voice Relay"'
```

### Debug Storage
```javascript
import { SecureStorage } from '../storage/secureStorage';

// View settings
const settings = await SecureStorage.loadSettings();
console.log('Settings:', settings);

// View queue
const queue = await SecureStorage.loadMessageQueue();
console.log('Queue:', queue);

// Clear storage
await SecureStorage.clearAll();
```

## Production Readiness Checklist

Before deploying:
- [ ] All tests passing
- [ ] Error handling comprehensive
- [ ] Security review completed
- [ ] Performance targets met
- [ ] API rate limiting configured
- [ ] Monitoring/alerting set up
- [ ] Privacy policy reviewed

## When to Invoke This Skill

- Running test suites
- Verifying E2EE encryption
- Testing backend endpoints
- Debugging mobile app
- Validating voice mode functionality
- Checking usage limits
- Preparing for production deployment
- Investigating bugs or failures
