# VOICE Relay - Testing Guide

Complete testing procedures for all 5 phases of VOICE Relay.

---

## Table of Contents

1. [Phase 0: E2EE Testing](#phase-0-e2ee-testing)
2. [Phase 1: Backend Testing](#phase-1-backend-testing)
3. [Phase 2-5: Mobile App Testing](#phase-2-5-mobile-app-testing)
4. [End-to-End Integration Testing](#end-to-end-integration-testing)
5. [Quick Test Checklist](#quick-test-checklist)

---

## Phase 0: E2EE Testing

**Goal**: Verify encryption/decryption works correctly in both Python and React Native.

### Python Agent E2EE Round-Trip

```bash
cd agent
pip install -r requirements.txt
python agent.py
```

**Expected Output**:
```
[OK] Phase 0: E2EE Proof of Concept
[OK] Agent Generated Ephemeral RSA Key Pair
[OK] Created Work Order (topic: test, prompt: hello world)
[OK] Encrypted Work Order with App Public Key
[OK] Work Order Size: X bytes
[Encrypted Data] (base64-encoded blob)
[OK] App Would Decrypt Here...
[OK] App Decrypted Work Order Successfully
[OK] Prompt: "hello world"
[OK] App Encrypts Reply with Ephemeral Key
[Encrypted Reply] (base64-encoded blob)
[OK] Agent Decrypted Reply: "hello world response"
[OK] Round-trip E2EE SUCCESSFUL
```

**What This Tests**:
✓ RSA-2048 key generation
✓ Hybrid RSA + AES-256-GCM encryption
✓ Payload encryption/decryption
✓ Ephemeral key usage
✓ Round-trip communication (agent → app → agent)

---

## Phase 1: Backend Testing

**Goal**: Verify FastAPI relay server endpoints work correctly.

### Start Backend Server

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Run Test Suite

In a separate terminal:

```bash
cd backend
python test_relay.py
```

**Expected Output**:
```
[OK] Test 1: Health Check
  Status: 200
  Response: {"status": "healthy"}

[OK] Test 2: Get Public Key (Unauthorized)
  Status: 401
  Error: Missing or invalid Authorization header

[OK] Test 3: Get Public Key (Valid Token)
  Status: 200
  Public Key: -----BEGIN PUBLIC KEY-----...

[OK] Test 4: Agent Ask (Valid Payload)
  Status: 200
  Message ID: msg_1731527400000_abc123def

[OK] Test 5: Agent Ask (Invalid Token)
  Status: 401
  Error: Invalid token format

[OK] Test 6: Debug: List Messages
  Count: 1
  Messages: [...]

[OK] Test 7: Debug: List Users
  Count: 1
  Users: ["testuser123"]

[SUMMARY] All tests passed!
```

### Manual Endpoint Testing

Use `curl` to test endpoints:

**1. Health Check**
```bash
curl http://127.0.0.1:8000/health
```

Response:
```json
{"status": "healthy"}
```

**2. Get Public Key**
```bash
curl -X POST http://127.0.0.1:8000/auth/get-public-key \
  -H "Authorization: Bearer github|testuser|faketoken" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "app_public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----"
}
```

**3. Agent Ask (Send Encrypted Prompt)**
```bash
curl -X POST http://127.0.0.1:8000/agent/ask \
  -H "Authorization: Bearer github|testuser|faketoken" \
  -H "Content-Type: application/json" \
  -d '{
    "encrypted_blob": "base64_encoded_encrypted_data_here",
    "encrypted_blob_size_bytes": 256
  }'
```

Response:
```json
{
  "status": "accepted",
  "message_id": "msg_1731527400000_abc123def"
}
```

### What to Test
✓ Health endpoint returns 200
✓ Get public key requires valid token
✓ Agent ask accepts encrypted payloads
✓ All error cases return proper status codes
✓ Server remains stateless (no session persistence)

---

## Phase 2-5: Mobile App Testing

**Goal**: Verify React Native app functionality across all phases.

### Prerequisites

```bash
cd app
npm install
```

### Android Testing

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on Android emulator or device
npm run android
```

### iOS Testing

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on iOS simulator or device
npm run ios
```

---

## Phase 2: Core App Testing (Auth & Decryption)

### Test Login Flow

**Steps**:
1. App starts on LoginScreen
2. Enter GitHub token: `github|testuser|faketoken`
3. Tap "Login"

**Expected**:
- ✓ Generate RSA key pair
- ✓ Store token securely
- ✓ Navigate to HomeScreen
- ✓ App shows "0 messages" (no messages yet)

**Manual Test** (simulate message):
```javascript
// In app code, add a test message to SecureStorage
const testMessage = {
  id: 'msg_test_001',
  encrypted_blob: 'base64_encrypted_data_here',
  status: 'encrypted',
  created_at: Date.now(),
  topic: 'Test Topic'
};
await SecureStorage.addMessage(testMessage);
```

### Test Message Decryption

**Steps**:
1. Ensure test message in queue
2. Tap on topic → MessageQueueScreen
3. Tap on message → MessageDetailScreen
4. App auto-decrypts message

**Expected**:
- ✓ Prompt displays correctly
- ✓ Status shows "📖 Pending Reply"
- ✓ "Your Reply" text input appears

---

## Phase 3: Voice Mode Testing

**Goal**: Verify TTS/STT and auto-send functionality.

### Test Text-to-Speech (TTS)

**Steps**:
1. Go to HomeScreen
2. Tap "🎤 Start Voice Mode"
3. VoiceModeScreen loads

**Expected**:
- ✓ Screen shows "🎤 Listening..." or "🔊 Speaking..."
- ✓ App speaks the prompt using device TTS
- ✓ Real-time transcript displays below

**Manual Test** (force TTS):
```javascript
import { initializeVoiceService } from '../services/voiceService';

const voiceService = initializeVoiceService();
await voiceService.speak("Test message");
```

### Test Speech-to-Text (STT)

**Steps**:
1. In Voice Mode, after prompt is read
2. App shows "🎤 Listening..."
3. Speak a reply (e.g., "This is my response")
4. App shows transcript in real-time

**Expected**:
- ✓ Transcript updates as you speak
- ✓ After silence (2 seconds), listening stops
- ✓ Full transcript appears

### Test Auto-Send vs Manual Send

**With Auto-Send OFF (default)**:
1. Voice Mode reads prompt
2. You speak reply
3. Transcript appears with buttons: [Send], [Read Back], [Retry], [Skip]
4. Tap "Send" to submit

**With Auto-Send ON**:
1. Voice Mode reads prompt
2. You speak reply
3. After 2 seconds of silence → Auto-sends
4. Shows "✓ Sent" confirmation
5. Moves to next message

**Test Auto-Send Setting**:
1. Go to SettingsScreen
2. Toggle "Auto-Send" ON/OFF
3. Return to Voice Mode
4. Verify behavior changes

---

## Phase 4: Multi-Screen UI Testing

**Goal**: Verify all screens and navigation work correctly.

### Home Screen

**Steps**:
1. Login successfully
2. HomeScreen displays

**Expected**:
- ✓ Title: "VOICE Relay"
- ✓ Subtitle: "X messages"
- ✓ "🎤 Start Voice Mode" button (orange border)
- ✓ Topics list with unread counts
- ✓ "⚙️ Settings" button

**Test Topic Navigation**:
1. Tap topic → MessageQueueScreen
2. Topic name appears at top
3. All messages for that topic listed
4. Status badges show correctly (🔐 Encrypted, 📖 Decrypted, ✓ Sent, ❌ Error)

### Message Queue Screen

**Expected**:
- ✓ Back button returns to HomeScreen
- ✓ Messages sorted by creation time
- ✓ Status badges visible
- ✓ Timestamps display correctly
- ✓ Prompt preview text shows

**Test Message Selection**:
1. Tap a message
2. MessageDetailScreen opens
3. Full prompt displays

### Message Detail Screen

**Expected**:
- ✓ Topic name at top
- ✓ Status badge (Pending Reply / Sent)
- ✓ Created timestamp
- ✓ Full prompt text
- ✓ "Your Reply" text input
- ✓ "Send Reply" button
- ✓ Security info box

**Test Reply Submission**:
1. Type reply: "This is my test response"
2. Tap "Send Reply"
3. Should show success alert
4. Back to MessageQueueScreen
5. Message status changed to ✓ Sent

### Settings Screen

**Expected**:
- ✓ Voice Mode section with Auto-Send toggle
- ✓ Usage section shows: "X / 100 messages"
- ✓ Server section shows URL and timeout
- ✓ About section with version
- ✓ Privacy & Security bullet points
- ✓ "❤️ Support Developer" button
- ✓ "Logout" button

**Test Settings Functionality**:
1. Toggle Auto-Send ON → verify change persists
2. Open Settings again → confirm toggle state saved
3. Check usage display updates

---

## Phase 5: Monetization Testing

**Goal**: Verify 100-prompt limit and monthly reset.

### Test Usage Tracking

**Steps**:
1. Send 95 messages (use test script)
2. Open SettingsScreen
3. Usage shows: "95 / 100"

**Expected**:
- ✓ No warning (under 80%)

**Steps** (continued):
4. Send 5 more messages (now at 100)
5. SettingsScreen shows: "100 / 100"
6. Red alert appears: "[LIMIT REACHED]"

**Expected**:
- ✓ Red warning box visible
- ✓ Text: "Monthly message limit reached"

### Test Limit Enforcement

**Steps**:
1. At 100/100 usage
2. Try to send reply on a new message
3. MessageDetailScreen shows limit alert
4. Cannot submit reply

**Expected**:
- ✓ Alert: "Free Tier Limit Reached"
- ✓ Buttons: "Upgrade on Ko-fi", "OK"
- ✓ Reply NOT submitted

### Test 80% Warning

**Steps**:
1. Send messages to reach 80/100
2. Open SettingsScreen
3. Usage shows: "80 / 100"

**Expected**:
- ✓ Orange warning box appears
- ✓ Text: "⚠️ You're using 80% of your free tier. Upgrade soon!"

### Test Monthly Reset

**Manual Test** (mock 30 days passing):
```javascript
import { SecureStorage } from '../storage/secureStorage';
import { SettingsService } from '../services/settingsService';

// Simulate 30 days in the past
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
const settings = await SettingsService.getSettings();
settings.messages_reset_date = thirtyDaysAgo;
await SecureStorage.saveSettings(settings);

// Now check if reset happens
const percentage = await SettingsService.getUsagePercentage();
console.log('Should be 0%:', percentage); // Should be 0
```

**Expected**:
- ✓ Usage resets to 0
- ✓ messages_used becomes 0
- ✓ messages_reset_date updates to now
- ✓ User can send 100 more prompts

---

## End-to-End Integration Testing

Complete flow from agent → backend → app → reply.

### Setup

**Terminal 1: Start Backend**
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal 2: Start App**
```bash
cd app
npm start
npm run android  # or npm run ios
```

**Terminal 3: Prepare Agent**
```bash
cd agent
pip install -r requirements.txt
```

### E2E Test Scenario

**Step 1: App Initialization**
- Open app
- Login with token: `github|testuser123|faketoken`
- Verify RSA keys generated
- Go to HomeScreen

**Step 2: Agent Sends Prompt**
```bash
cd agent
python agent.py
```
This:
- Generates ephemeral RSA key pair
- Creates Work Order with prompt: "hello world"
- Encrypts Work Order with app's public key
- In real app: Would send to `/agent/ask` endpoint
- Shows encrypted blob (demo mode shows it would be sent)

**Step 3: App Receives & Decrypts (Simulated)**
```javascript
// In app code, manually add message to simulate receipt
const testMessage = {
  id: 'msg_e2e_001',
  encrypted_blob: 'base64_encrypted_from_agent',
  status: 'encrypted',
  created_at: Date.now(),
  topic: 'E2E Test'
};
await SecureStorage.addMessage(testMessage);
```

**Step 4: App Decrypts & Shows Prompt**
- HomeScreen shows new topic: "E2E Test (1)"
- Tap topic → MessageQueueScreen
- Tap message → MessageDetailScreen
- Prompt auto-decrypts: "hello world"

**Step 5: User Sends Reply**
- Type reply: "response from app"
- Tap "Send Reply"
- App encrypts with ephemeral key
- Shows success: "Reply sent!"

**Step 6: Verify Encryption Quality**
- Check that reply is encrypted (base64 blob, not plaintext)
- Verify size: ~256+ bytes (RSA-encrypted AES key + IV + AES-encrypted data + tag)

---

## Quick Test Checklist

### Unit Tests (Per-Service)

- [ ] **Crypto Utils**: encrypt/decrypt round-trip
- [ ] **Auth Service**: login/logout/session
- [ ] **Message Service**: receive/decrypt/prepare/submit
- [ ] **Settings Service**: get/set/reset/usage-check
- [ ] **Voice Service**: speak/listen/silence-detection
- [ ] **Navigation Service**: navigate/back/param-passing

### Integration Tests

- [ ] Backend + App: Authentication
- [ ] Backend + App: Get public key
- [ ] Backend + App: Submit encrypted message
- [ ] App: Decrypt message from backend
- [ ] App: Encrypt reply locally
- [ ] Agent ↔ App: Full E2EE round-trip

### UI Tests

- [ ] Login Screen: Form validation, token handling
- [ ] Home Screen: Topic list, unread counts, navigation
- [ ] Message Queue: List display, status badges
- [ ] Message Detail: Decrypt, compose reply, submit
- [ ] Settings: Toggles persist, usage displays
- [ ] Voice Mode: TTS speaks, STT listens, auto-send works

### Security Tests

- [ ] Private key stored securely (AsyncStorage)
- [ ] Encryption uses proper algorithms (RSA-OAEP, AES-GCM)
- [ ] Ephemeral keys used correctly
- [ ] Server never sees plaintext
- [ ] Usage tracking local-only

### Edge Cases

- [ ] Network timeout handling
- [ ] Decryption failure (corrupted blob)
- [ ] Missing keys
- [ ] Empty message queue
- [ ] 100-prompt limit enforcement
- [ ] Monthly reset at 30 days
- [ ] Voice mode with no permissions

---

## Debugging Tips

### View App Logs

**React Native Console**:
```javascript
console.log('Debug message');
```

**Check Device Logs**:
```bash
# Android
adb logcat

# iOS
xcrun simctl spawn booted log stream --predicate 'process == "Voice Relay"'
```

### Debug Storage

```javascript
import { SecureStorage } from '../storage/secureStorage';

// View all settings
const settings = await SecureStorage.loadSettings();
console.log('Settings:', settings);

// View message queue
const queue = await SecureStorage.loadMessageQueue();
console.log('Message Queue:', queue);

// Clear storage
await SecureStorage.clearAll();
```

### Test Encrypted Messages

Use [jwt.io](https://jwt.io) or similar to decode base64:
```bash
echo "base64_encrypted_blob" | base64 -d | xxd
```

---

## Test Results Template

```markdown
## Test Run - [DATE]

### Phase 0: E2EE
- [ ] Agent E2EE round-trip: PASS/FAIL

### Phase 1: Backend
- [ ] Health check: PASS/FAIL
- [ ] Get public key: PASS/FAIL
- [ ] Agent ask: PASS/FAIL
- [ ] All test_relay.py tests: PASS/FAIL

### Phase 2-5: App
- [ ] Login flow: PASS/FAIL
- [ ] Message decryption: PASS/FAIL
- [ ] Home screen display: PASS/FAIL
- [ ] Message queue: PASS/FAIL
- [ ] Message detail: PASS/FAIL
- [ ] Reply submission: PASS/FAIL
- [ ] Voice mode TTS: PASS/FAIL
- [ ] Voice mode STT: PASS/FAIL
- [ ] Settings persistence: PASS/FAIL
- [ ] Usage tracking: PASS/FAIL
- [ ] 100-prompt limit: PASS/FAIL

### Overall: PASS/FAIL
```

---

## Production Readiness Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Error handling comprehensive
- [ ] Logging in place (but not verbose)
- [ ] Security review completed
- [ ] Performance targets met
- [ ] Accessibility checked (WCAG AA)
- [ ] API rate limiting configured
- [ ] Database backups tested
- [ ] Monitoring/alerting set up
- [ ] Privacy policy reviewed
- [ ] Terms of service created
- [ ] Ko-fi integration working

---

**Status**: All test procedures documented and ready
