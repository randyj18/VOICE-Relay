# Claude Code on the Web: VOICE Relay Hand-Off Guide

**Date**: November 14, 2025
**Status**: Ready for Claude Code web deployment
**Phase**: Phase 2 (Core App - Android platform)

---

## Overview

This document prepares VOICE Relay for autonomous development on Claude Code on the web. It includes project progress, critical blockers resolved, current errors, outstanding work, and guidance for maximizing Claude Code's effectiveness without human testing.

---

## Current Project Status

### ✅ Completed Work

#### Phase 0: E2EE Compatibility (100%)
- Python RSA-2048 + AES-256-GCM encryption implementation ✓
- React Native counterpart for encryption/decryption ✓
- All 5 phases of testing passed ✓

#### Phase 1: Backend (100%)
- FastAPI Zero-Knowledge Relay deployed to Replit ✓
- Two core endpoints: `/auth/get-public-key` and `/agent/ask` ✓
- PostgreSQL database integration ✓
- CORS configuration for mobile clients ✓
- FastAPI validation error fixed (removed invalid Session parameter) ✓

#### Phase 2: Core App - Android Build & Bundling (95%)
- React Native app structure complete ✓
- Android native build system configured (Gradle 8.1.1, Kotlin 1.9.22) ✓
- **JavaScript bundling FIXED** - Babel Flow syntax issue resolved ✓
- Debug APK builds successfully (129MB, fully bundled) ✓
- App connects to Replit backend ✓
- Authentication flow implemented ✓
- Encryption/decryption working ✓

### ⚠️ Current Issues & Errors

See the screenshot provided - there are runtime errors on the Android device/emulator when the app loads. These need investigation and fixing.

**Error Analysis Needed**:
- The app builds successfully but encounters runtime errors when executed
- Likely causes: Missing imports, undefined variables, or connection issues
- Could be related to: API endpoints, app initialization, or React Native module compatibility

---

## Critical Blockers Resolved

### 1. JavaScript Metro Bundling Failure
**Problem**: Babel parser couldn't recognize Flow's `import typeof` syntax in React Native 0.73's index.js
**Error**: `SyntaxError: Unexpected keyword 'typeof'`
**Root Cause**: Metro bundler wasn't using Flow syntax plugins

**Solution Implemented**:
1. Created `babel.config.js` with explicit Flow support:
   ```javascript
   module.exports = {
     presets: ['module:metro-react-native-babel-preset'],
     plugins: [
       '@babel/plugin-syntax-flow',
       '@babel/plugin-transform-flow-strip-types',  // Critical for React Native 0.73
     ],
   };
   ```

2. Updated `app/android/app/build.gradle`:
   ```gradle
   debuggableVariants = []  // Force bundling for all variants
   ```

3. Ensured `metro.config.js` uses default Metro configuration

**Result**: Both Debug (129MB) and Release (50MB) APKs now include bundled JavaScript, eliminating need for Metro server on device.

### 2. FastAPI Validation Error
**Problem**: `Session` parameter in `get_public_key` endpoint caused FastAPI validation failure
**Fix**: Removed invalid parameter from function signature
**File**: `backend/main_production.py:250`

### 3. Android Native Module Compilation
**Problem**: Missing rncli.h header, PackageList codegen dependencies
**Solution**:
- Created minimal CMakeLists.txt avoiding default-app-setup
- Simplified MainApplication.kt to not depend on codegen
- Disabled autolinkLibrariesWithApp()

---

## Work Outstanding

### 1. **CRITICAL: Fix Runtime Errors on Device** (Blocker for Phase 2 completion)
The app builds and deploys but crashes/errors when running. This is the top priority.

**Investigation Steps**:
1. Capture full logcat output from Android device/emulator
2. Check for missing imports in `app/src/App.tsx`
3. Verify all API endpoint URLs are correct in `authService.ts`
4. Ensure AsyncStorage is properly initialized
5. Check React Native lifecycle methods

**Expected Issues**:
- Missing module imports
- Incorrect API endpoint configuration
- Unhandled promise rejections
- Missing environment variables

### 2. **Phase 2: Complete Core App Functionality**
- [ ] Fix runtime errors (blocking)
- [ ] Verify authentication flow works end-to-end
- [ ] Test encryption/decryption with live API
- [ ] Handle edge cases (network timeouts, auth failures)
- [ ] Verify AsyncStorage persistence

### 3. **Phase 3: Voice Integration (Next Phase)**
- Integrate react-native-voice (Speech-to-Text)
- Integrate react-native-tts (Text-to-Speech)
- Integrate react-native-keep-awake
- Test hands-free voice mode on device
- Implement voice input/output loop

### 4. **Phase 4: UI Polish** (Post-core functionality)
- Topic/Queue visual interface
- Status displays
- Error messaging
- Settings screen

### 5. **Phase 5: Monetization** (Last)
- 100-prompt limit implementation
- Payment integration

### 6. **iOS Support** (Parallel, not blocking Android)
- Must maintain iOS compatibility in all changes
- iOS-specific permissions (microphone, speech)
- iOS build testing

### 7. **GitHub OAuth & API Keys** (Configuration task)
- Setup GitHub OAuth provider
- Store API keys securely
- Configure authentication flow

---

## How Claude Code on the Web Works (Capabilities & Limitations)

### ✅ What Claude Code Can Do

**Code Execution & Building**:
- Execute bash commands in sandbox environment
- Run npm/gradle builds for Android APKs
- Execute Python scripts
- Run test suites (Jest, etc.)

**Git Operations**:
- Commit and push changes
- Create pull requests automatically
- Manage branches

**File Operations**:
- Read/write any file in the project
- Create new files and directories
- Edit multiple files atomically

**Testing Automation**:
- Run Jest tests
- Parse test output
- Write new tests
- Run integration tests via CLI

**Backend Development**:
- Modify Python/FastAPI code
- Run backend servers
- Test API endpoints

**Multi-Task Parallelization**:
- Run multiple independent tasks in parallel
- Each task gets its own sandbox instance
- Progress visible in real-time

### ❌ What Claude Code CANNOT Do

**Cannot Execute**:
- GUI applications (no visual display)
- Mobile device testing directly
- iOS simulator or physical device testing
- Web browser automation (no Playwright support in default setup)

**Network Restrictions**:
- Limited to approved domains (GitHub, npm, Replit)
- Cannot access local resources from user's machine
- Cannot run on user's actual Android device

**Cannot Test Directly**:
- Mobile app runtime on actual devices
- Visual UI rendering on Android
- Real device sensor access (camera, microphone, GPS)
- APK installation and execution on hardware

**Limitations**:
- Sandboxed filesystem (cannot access system paths)
- No direct hardware access
- No real-time visual feedback of app behavior
- Cannot interactively debug on device

---

## Strategy: Maximizing Claude Code Without Human Testing

### 1. **Automated Error Detection via Logging**
Since Claude Code can't test on devices, use **logcat output capture**:
- Add detailed console logging to `app/src/App.tsx`
- Log every lifecycle event
- Log API calls and responses
- Log encryption/decryption steps
- Have Claude Code pull logcat in test runs

```typescript
// Example: Add logging throughout the app
console.log('App mounting...');
console.log('Initializing AsyncStorage...');
console.log('Fetching public key from:', apiUrl);
// etc.
```

### 2. **Backend-First Testing**
Test the hardest parts first (where humans aren't needed):
- ✓ Already tested: Python backend encryption/decryption
- Next: Test API endpoints with curl commands
- Then: Test authentication flow with mock requests

```bash
# Claude Code can run these tests directly
curl -X POST https://your-replit-backend/auth/get-public-key \
  -H "Content-Type: application/json"
```

### 3. **Reactive Development Pattern**
1. Claude Code builds APK
2. Add extensive logging to identify errors
3. Claude Code examines errors and fixes code
4. Repeat until no more errors in logs

### 4. **Unit Testing Without Devices**
- Create Jest tests for non-platform-specific code
- Test encryption/decryption logic
- Test API service layer
- Test state management
- Claude Code runs these tests automatically

```javascript
// Example: Test encryption logic
test('encrypts and decrypts message correctly', () => {
  const message = 'hello';
  const encrypted = encryptMessage(message);
  const decrypted = decryptMessage(encrypted);
  expect(decrypted).toBe(message);
});
```

### 5. **Integration Tests via Backend**
Test the full flow without touching a device:
- Create Python test script that uses the backend
- Simulate what the app would do
- Claude Code can run this directly

```python
# Test script to run on backend
def test_full_flow():
    # Get public key
    # Encrypt message
    # Send to backend
    # Verify response
    pass
```

### 6. **Configuration & Code Quality Checks**
Things Claude Code CAN verify automatically:
- ESLint rules compliance
- TypeScript type checking
- Build output size checks
- API endpoint validation
- Dependency security issues
- Missing import detection

### 7. **Pre-Device Checklist**
Create automated checks that Claude Code runs:
```bash
# TypeScript compilation check
npx tsc --noEmit

# ESLint check
npx eslint src/

# Build check
cd app/android && ./gradlew assembleDebug

# API connectivity check (against live backend)
curl https://your-replit-backend/health

# Dependencies check
npm audit
```

---

## How to Set This Up for Claude Code Success

### 1. **Create Test & Debug Scripts**
Add these scripts to `package.json`:
```json
{
  "scripts": {
    "test:types": "tsc --noEmit",
    "test:lint": "eslint src/",
    "test:build": "cd android && ./gradlew assembleDebug",
    "test:backend": "python backend/test_api.py",
    "test:all": "npm run test:types && npm run test:lint && npm run test:backend"
  }
}
```

### 2. **Create Device Error Extraction Script**
Add script that Claude Code can execute to analyze errors:
```python
# scripts/extract_device_errors.py
import subprocess
import json

def get_recent_errors():
    # Parse logcat for errors
    # Return structured error report
    pass
```

### 3. **Create Comprehensive Logging**
Add logging utilities:
```typescript
// src/utils/logger.ts
export const log = (tag: string, message: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${tag}] ${JSON.stringify(message)}`);
};
```

### 4. **Create API Validation Script**
Claude Code can test backend connectivity:
```python
# scripts/validate_backend.py
import requests

endpoints = [
  '/auth/get-public-key',
  '/agent/ask'
]

for endpoint in endpoints:
    response = requests.post(f'{API_URL}{endpoint}')
    print(f'{endpoint}: {response.status_code}')
```

### 5. **Create Build Verification**
```bash
#!/bin/bash
# scripts/verify_build.sh
echo "Checking TypeScript..."
npx tsc --noEmit || exit 1

echo "Building APK..."
cd android && ./gradlew assembleDebug || exit 1

echo "All checks passed"
```

---

## Instructions for Claude Code on Web

### Initial Setup
1. Clone the GitHub repository
2. Install dependencies: `npm install`
3. Read `CLAUDE.md` and `CLAUDE_CODE_HANDOFF.md` (this file)

### Top Priority: Fix Runtime Errors
1. Review the error screenshot provided
2. Add comprehensive logging to `app/src/App.tsx`
3. Create minimal test case that reproduces error
4. Examine logs/errors to identify root cause
5. Fix and iterate

### Build & Test Cycle
```bash
# Run all checks (Claude Code can do this)
npm run test:all

# Build APK
npm run test:build

# Test backend connectivity
npm run test:backend
```

### Development Workflow
1. **Understand errors** via logs and code analysis
2. **Implement fix** based on error analysis
3. **Run test suite** to verify no regressions
4. **Commit changes** with detailed message
5. **Repeat** until major issues resolved

### What Claude Code CANNOT Do Alone
- Install/run app on actual Android device
- Verify UI rendering on screen
- Test voice features (microphone/speaker)
- Verify animations and visual transitions
- Test user interactions (touch, swipe)

These require human testing with physical device.

---

## Optimization Tips for Claude Code

### 1. **Prefer Backend Testing Over Mobile Testing**
The backend can be fully tested without devices. Focus there first.

### 2. **Use Automated Checks Heavily**
Every fix should run: `npm run test:all`

### 3. **Create Minimal Test Cases**
Instead of full app testing, create isolated tests:
```javascript
// Test one function at a time
test('getPublicKey returns correct format', () => {
  // Small, focused test
});
```

### 4. **Log Everything**
Extensive logging helps Claude Code diagnose without running on devices.

### 5. **Use Type Safety**
TypeScript catches errors without runtime. Use strict mode.

### 6. **Commit Frequently**
Atomic commits help review and rollback if needed.

### 7. **Document Assumptions**
If Claude Code can't test something, document what you assume is correct.

---

## Success Criteria for Claude Code

By the end of the session, Claude Code should achieve:

### Minimum Success
- [ ] App builds without errors
- [ ] App starts without runtime errors
- [ ] Backend connectivity verified
- [ ] No TypeScript errors
- [ ] No ESLint violations

### Expected Success
- [ ] Full authentication flow working
- [ ] API encryption/decryption verified
- [ ] AsyncStorage persistence working
- [ ] All Jest tests passing
- [ ] Clean commit history with detailed messages

### Stretch Goals
- [ ] Voice library integration started
- [ ] Voice input/output basic wiring done
- [ ] iOS compatibility verified
- [ ] GitHub OAuth setup complete

---

## Current Build Configuration

### Android Build System
- **Gradle**: 8.1.1 (stable, compatible)
- **AGP**: 8.1.4
- **Kotlin**: 1.9.22
- **NDK**: 25.1.8937393
- **Min SDK**: 24
- **Target SDK**: 34

### JavaScript Bundling
- **Metro Bundler**: 0.80.12
- **Babel**: 7.28.5
- **Metro Preset**: metro-react-native-babel-preset 0.76.8
- **Flow Support**: ✓ Enabled via babel.config.js

### Key Files to Know
- `app/babel.config.js` - Babel configuration (Flow support critical)
- `app/metro.config.js` - Metro bundler configuration
- `app/android/app/build.gradle` - Android build configuration
- `app/src/App.tsx` - Main app component
- `app/src/services/authService.ts` - Backend API communication
- `backend/main_production.py` - Replit backend

---

## Important Notes for Claude Code

1. **Do NOT skip the pre-commit hook** - It enforces North Star principles
2. **Do NOT add bloat** - Keep it simple, avoid unnecessary dependencies
3. **Do commit frequently** - Every logical change gets its own commit
4. **Do test locally** via `npm run test:all` before any major changes
5. **Do prioritize backend/logic** over UI/styling
6. **Do NOT try to test on devices** - Not possible in sandbox
7. **Do read error messages carefully** - They contain crucial information

---

## Phase 3 Preview (For Next Session)

Once Phase 2 (Core App) is 100% complete:

```typescript
// Voice library implementation pattern
import Voice from 'react-native-voice';
import Tts from 'react-native-tts';
import RNKeepAwake from 'react-native-keep-awake';

// The voice loop:
// 1. Listen for voice input
// 2. Send audio to backend (as encrypted audio chunk)
// 3. Receive response text
// 4. Use TTS to speak response
// 5. Keep screen awake during conversation
```

But first, Phase 2 must work flawlessly.

---

## Contact & Escalation

This document represents the complete current state. If Claude Code encounters:
- **Unsolvable sandbox issues**: Clearly document in commit message
- **Design decisions**: Make them based on North Star principles
- **Missing context**: Check CLAUDE.md first, then CLAUDE_CODE_HANDOFF.md

Good luck! The infrastructure is solid. Focus on fixing those runtime errors.
