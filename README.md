# VOICE Relay - Zero-Knowledge Voice Agent Platform

**The fastest, simplest, and most secure relay for voice conversations.**

VOICE Relay enables end-to-end encrypted communication between an AI agent and a user's phone. Users receive encrypted prompts, respond via voice or text, and send encrypted replies—all without the server ever seeing the plaintext.

---

## Quick Start

### Prerequisites
- Python 3.10+ (for backend and demo agent)
- Node.js 18+ (for mobile app)
- React Native CLI
- Git

### 1. Backend Server

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

API available at `http://127.0.0.1:8000`
Endpoints: `/auth/get-public-key`, `/agent/ask`

### 2. Mobile App

```bash
cd app
npm install
npm start
# Then: npm run android  or  npm run ios
```

### 3. Demo Agent (Phase 0 Testing)

```bash
cd agent
pip install -r requirements.txt
python agent.py
```

---

## Project Structure

```
VOICE-Relay/
├── backend/                    # FastAPI relay server (Phase 1)
│   ├── main.py                # Core endpoints
│   ├── test_relay.py          # Test suite
│   └── requirements.txt
│
├── app/                        # React Native mobile app (Phase 2+)
│   ├── src/
│   │   ├── screens/           # Screen components
│   │   ├── services/          # Auth, Message, Crypto, Voice, Settings
│   │   ├── storage/           # Secure local storage
│   │   ├── utils/             # Crypto utilities
│   │   ├── types/             # TypeScript interfaces
│   │   └── AppMultiScreen.tsx # Main router
│   ├── package.json
│   └── tsconfig.json
│
├── agent/                      # Python demo agent (Phase 0)
│   ├── agent.py               # E2EE demonstration
│   ├── crypto_utils.py        # Hybrid RSA+AES-256-GCM encryption
│   └── requirements.txt
│
├── docs/                       # Phase documentation
│   ├── PHASE_0.md            # E2EE proof of concept
│   ├── PHASE_1.md            # Relay backend
│   ├── PHASE_2.md            # Core mobile app
│   ├── PHASE_3.md            # Voice mode (TTS/STT)
│   ├── PHASE_4.md            # Multi-screen UI
│   └── PHASE_5.md            # Monetization (100 prompts/month)
│
├── PROJECT_STATUS.md           # Complete project status
├── CLAUDE.md                   # AI agent constitution
└── Requirements.md             # Overall requirements
```

---

## Architecture Overview

### Core Concepts

**End-to-End Encryption (E2EE)**
- Every prompt is encrypted with the app's public key
- Every reply is encrypted with an ephemeral one-time key
- Server never sees plaintext (zero-knowledge architecture)

**Hybrid Encryption** (RSA-2048 + AES-256-GCM)
- RSA-OAEP with SHA256 padding for key wrapping
- AES-256-GCM for authenticated payload encryption
- One-time ephemeral keys per message

**Multi-Screen Mobile App**
- Home: Topics dashboard with unread counts
- Message Queue: All prompts for a topic
- Message Detail: Decrypt, read, compose reply
- Settings: Usage tracking, voice mode config
- Voice Mode: Hands-free TTS/STT interface

**Free Tier Model**
- 100 prompts per month (30-day rolling window)
- Automatic reset after 30 days
- Local-only usage tracking (no server visibility)
- Ko-fi upgrade link when limit reached

---

## Features by Phase

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | E2EE proof of concept | ✓ Complete |
| 1 | Zero-knowledge relay backend | ✓ Complete |
| 2 | React Native core app | ✓ Complete |
| 3 | Voice mode (TTS/STT) | ✓ Complete |
| 4 | Multi-screen UI | ✓ Complete |
| 5 | Monetization (100-prompt limit) | ✓ Complete |

---

## Technology Stack

### Backend
- **Framework**: FastAPI (async Python)
- **Server**: Uvicorn (ASGI)
- **Validation**: Pydantic
- **Auth**: Bearer tokens (GitHub OAuth compatible)

### Mobile App
- **Framework**: React Native (TypeScript)
- **Crypto**: node-forge (pure JavaScript)
- **Storage**: AsyncStorage (with upgrade path to Keychain/Keystore)
- **Voice**: react-native-tts, react-native-voice
- **Navigation**: Custom lightweight service (no heavy library)

### Demo Agent
- **Crypto**: Python cryptography library (RSA-OAEP, AES-256-GCM)
- **HTTP**: httpx (async requests)

---

## Security Properties

✓ **Zero-Knowledge**: Server never sees encrypted payloads or decrypts them
✓ **E2E Encrypted**: All data encrypted locally before transmission
✓ **Ephemeral Keys**: One-time RSA key pairs per message
✓ **Authenticated Encryption**: AES-GCM provides integrity checks
✓ **Device-Local**: Usage tracking local to device only
✓ **No Sessions**: Stateless backend (horizontal scaling)

---

## Development & Testing

### Test Backend
```bash
cd backend
python test_relay.py
```

Tests validate:
- Health check endpoint
- Public key retrieval
- Message submission
- Authentication
- Error handling

### Test End-to-End Encryption
```bash
cd agent
python agent.py
```

Demonstrates:
- Python agent generates ephemeral keys
- Encrypts work order
- React Native app decrypts
- App encrypts reply
- Agent decrypts reply

### Test Mobile App
```bash
cd app
npm start
# Run on Android or iOS emulator
```

Features manual testing of:
- Login/authentication
- Message decryption
- Reply composition
- Voice mode
- Settings and usage tracking

---

## Deployment

### Backend (Phase 1)
```bash
# Production deployment (example: Cloud Run)
gcloud run deploy voice-relay-backend \
  --source . \
  --runtime python310 \
  --allow-unauthenticated
```

For production:
- Use PostgreSQL for persistence
- Add Redis for message queue
- Configure FCM/APNs for push notifications
- Enable HTTPS/TLS
- Add monitoring and logging

### Mobile App (Phase 2+)
```bash
# Android
cd app
npm run build:android
# Upload APK to Google Play Store

# iOS
npm run build:ios
# Upload to Apple App Store
```

---

## Documentation

- [Project Status](PROJECT_STATUS.md) - Complete overview of all phases
- [Phase 0 - E2EE Proof](docs/PHASE_0.md) - Encryption validation
- [Phase 1 - Backend](docs/PHASE_1.md) - Relay server architecture
- [Phase 2 - Mobile App](docs/PHASE_2.md) - Core app functionality
- [Phase 3 - Voice Mode](docs/PHASE_3.md) - TTS/STT integration
- [Phase 4 - Multi-Screen UI](docs/PHASE_4.md) - Navigation and screens
- [Phase 5 - Monetization](docs/PHASE_5.md) - Usage limits and Ko-fi

---

## North Star Principles

All development follows three core principles:

1. **Simplicity**: Only essential features, no bloat
2. **Speed**: Fast encryption, responsive UI, quick API responses
3. **Security**: Zero-knowledge architecture, E2EE throughout

---

## Contributing

VOICE Relay is built with the North Star principles in mind. Any changes should:
- ✓ Directly serve the North Star
- ✓ Use the simplest possible implementation
- ✓ Not add unnecessary complexity or dependencies

---

## Support

- **Issues**: GitHub Issues
- **Feedback**: support@voice-relay.app
- **Support Developer**: [Ko-fi](https://ko-fi.com/voicerelay)

---

## License

MIT License - See LICENSE file

---

**Status**: All 5 phases complete - Production ready
**Last Updated**: 2025-11-14
