# VOICE Relay - Testing & Verification Scripts

These scripts help Claude Code on the web test and verify the app without needing a physical device.

## Scripts

### `verify_all.sh` - Complete Verification
Runs all checks to verify the app is in a buildable, testable state.

```bash
./scripts/verify_all.sh
```

**Checks**:
- TypeScript compilation
- ESLint code quality
- npm audit security
- Backend connectivity
- Android APK build
- App file structure
- Encryption library availability

**Use this**: Before starting major work, and after finishing features

### `test_backend.py` - Backend API Testing
Tests the Replit backend without needing the mobile app.

```bash
python3 scripts/test_backend.py
```

**Tests**:
- Backend health check
- Public key retrieval
- Message encryption/decryption flow
- CORS configuration

**Use this**: To verify backend is working, to debug API issues

## NPM Scripts

Available from `app/` directory:

```bash
# Type checking
npm run test:types

# Linting
npm run test:lint

# Build Android
npm run test:build

# All checks (recommended)
npm run test:all
```

## Development Workflow for Claude Code

### Step 1: Initial Check
```bash
./scripts/verify_all.sh
```

### Step 2: Make Code Changes
Edit files in `app/src/`, `backend/`, etc.

### Step 3: Verify Changes
```bash
cd app && npm run test:all
```

### Step 4: Test Backend (if backend changes)
```bash
python3 ../scripts/test_backend.py
```

### Step 5: Build APK
```bash
cd app && npm run test:build
```

### Step 6: Commit
```bash
git add .
git commit -m "Detailed commit message"
```

## What These Scripts Cannot Do

These scripts run in a sandbox without:
- Physical Android device
- GPU/graphics rendering
- Microphone/speaker access
- Mobile app runtime environment

Therefore they **cannot test**:
- Visual UI rendering
- Voice features (speech recognition, TTS)
- User interactions (touch, swipes)
- Real app performance
- Mobile-specific bugs

## What These Scripts CAN Do

- **Type Safety**: Catch TypeScript errors
- **Code Quality**: ESLint violations
- **Build Success**: APK compiles without errors
- **Backend Connectivity**: API endpoints respond
- **Encryption**: Message encryption/decryption works
- **Logic Errors**: Jest unit tests catch logic bugs

## Tips for Claude Code

1. **Always run `npm run test:all` before committing**
2. **Use `test_backend.py` to debug API issues**
3. **Check `verify_all.sh` output for build errors**
4. **Add console.log statements for debugging** (they'll help humans testing on device)
5. **Write unit tests for complex logic** (run via `npm test`)

## Troubleshooting

**TypeScript errors**
```bash
cd app && npx tsc --noEmit
```

**Build errors**
```bash
cd app/android && ./gradlew clean && ./gradlew assembleDebug
```

**Backend not responding**
Check: https://f88f9dbd-157d-4ef1-aed2-7ba669e1d94b-00-c50nduy6d8kx.riker.replit.dev/docs

**Dependency issues**
```bash
cd app && rm -rf node_modules && npm install
```

## Requirements

- Node.js 16+
- Python 3 (for backend testing)
- Gradle (included in android/gradlew)
- Git

All should be available in Claude Code's sandbox environment.
