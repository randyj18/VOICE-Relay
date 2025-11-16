# Comprehensive Testing Strategy Development Prompt

**For**: Claude Code on the Web
**Goal**: Create autonomous, comprehensive testing for Android and iOS across all development phases
**Method**: Intelligent test design with clear goals, outcomes, and AI-executable validation

---

## Current Project Status

**VOICE Relay** is a voice-operated interface for context engines currently at:

- ✅ **Phase 0 (E2EE)**: Complete - RSA-2048 + AES-256-GCM encryption working
- ✅ **Phase 1 (Backend)**: Complete - FastAPI deployed to Replit, 8/8 endpoint tests passing
- ✅ **Phase 2 (Core App)**: Complete - React Native Android app running without errors
- ✅ **iOS Support**: Ready - Xcode project created, 9.5/10 compatibility score
- 🟡 **Phase 3 (Voice)**: Ready to start - Architecture prepared for STT/TTS integration
- ⏸️ **Phase 4 (UI Polish)**: Already complete - Login, queue, settings, onboarding screens
- ⏸️ **Phase 5 (Monetization)**: Pending - Post-stable release

**Testing Limitations**:
- No physical Android device access
- No physical iOS device access
- No iOS simulator access (non-macOS environment)
- Cannot test visual UI directly
- Cannot test voice features (STT/TTS) without device
- Can build APKs/test compilation but not run them

**Testing Capabilities**:
- ✅ TypeScript compilation and type checking
- ✅ ESLint code quality verification
- ✅ Backend API testing (endpoints, auth, encryption)
- ✅ Build system verification (Android APK creation)
- ✅ Unit tests (Jest)
- ✅ Integration tests (component interaction)
- ✅ Code coverage analysis

---

## North Star Principle

**"Be the fastest, simplest, most secure relay for a voice conversation."**

Every test should:
1. Validate we're serving the North Star
2. Be executable autonomously by AI agents
3. Have clear, verifiable goals and outcomes
4. Account for testing limitations at each phase
5. Provide actionable feedback for improvements

---

## Your Task

Create a comprehensive, phase-aware testing strategy that maximizes autonomous testability within the constraints of a non-device environment.

### 1. Testing Philosophy

**Define the testing approach**:

**A) Goal-Oriented Testing**
- Each test must have a clear, verifiable goal
- Goals must be relevant to current development phase
- AI agents should validate goal relevance before executing

**B) Outcome-Driven Validation**
- Define specific expected outcomes for each test
- Outcomes should be machine-verifiable where possible
- Include success criteria and failure criteria

**C) Phase-Aware Testing**
- Different phases have different testable aspects
- Tests should adapt to what's currently implemented
- Skip tests for unimplemented features gracefully

**D) Autonomous Execution**
- Tests should be runnable without human intervention
- Results should be interpretable by AI agents
- Failures should provide actionable debugging information

### 2. Phase-by-Phase Testing Strategy

For each phase, define:
- **What can be tested** at this phase
- **What cannot be tested** and why
- **Valuable tests** that provide meaningful validation
- **Test execution approach** for AI agents
- **Success criteria** for phase completion

#### Phase 0: E2EE Encryption (Complete)

**Testable**:
- ✅ Encryption/decryption round-trip (Python ↔ React Native)
- ✅ Key generation (RSA-2048 key pairs)
- ✅ AES-256-GCM symmetric encryption
- ✅ Base64 encoding/decoding
- ✅ Error handling for invalid keys/ciphertext

**Not Testable**:
- ❌ Performance on actual devices
- ❌ Memory usage patterns in mobile environment

**Recommended Tests**:
1. **E2EE Round-Trip Test**
   - Goal: Verify Python backend can decrypt messages encrypted by React Native client
   - Execution: Node.js script encrypts message → Python script decrypts → Compare
   - Success: Decrypted message matches original plaintext
   - Failure: Log key lengths, cipher format, error messages

2. **Key Generation Validation**
   - Goal: Ensure RSA-2048 keys meet security requirements
   - Execution: Generate 10 key pairs, validate bit length, test uniqueness
   - Success: All keys are 2048-bit, unique, and properly formatted
   - Failure: Identify which validation failed (length, format, uniqueness)

3. **Error Handling Test**
   - Goal: Verify graceful handling of encryption failures
   - Execution: Attempt encryption with invalid keys, corrupted data
   - Success: Errors are caught, logged, and don't crash app
   - Failure: Identify which error scenario crashes

#### Phase 1: Backend Relay (Complete)

**Testable**:
- ✅ Endpoint availability (health, auth, message submission)
- ✅ Authentication flow (token validation)
- ✅ Request/response format validation
- ✅ CORS headers for mobile clients
- ✅ Error responses (401, 400, 500)
- ✅ Response time benchmarks

**Not Testable**:
- ❌ Load testing (requires production-like traffic)
- ❌ Real-world network conditions

**Recommended Tests**:
1. **Endpoint Health Checks**
   - Goal: Verify all backend endpoints are accessible and responsive
   - Execution: `scripts/test_backend.py` (already exists)
   - Success: All 8 endpoints return expected status codes (200, 401, etc.)
   - Failure: Log failed endpoint, status code, response body

2. **Authentication Flow Test**
   - Goal: Verify token-based authentication works correctly
   - Execution: Test without token (expect 401), test with valid token (expect 200)
   - Success: Unauthorized requests rejected, authorized requests succeed
   - Failure: Identify auth bypass or false rejection

3. **Data Validation Test**
   - Goal: Ensure backend validates input correctly
   - Execution: Send malformed JSON, missing fields, invalid data types
   - Success: Backend returns 400 with clear error messages
   - Failure: Log which validation is missing

4. **CORS Configuration Test**
   - Goal: Verify mobile clients can make cross-origin requests
   - Execution: OPTIONS preflight request, check headers
   - Success: Access-Control-Allow-Origin header present
   - Failure: Identify missing CORS headers

**Current Issue**: Replit backend returns 403 (WAF blocking) in production
- Test should handle this gracefully
- Log warning but don't fail if local backend works
- Provide guidance: "Use local backend for development"

#### Phase 2: Core App - Android (Complete)

**Testable**:
- ✅ TypeScript compilation (no type errors)
- ✅ ESLint code quality (no violations)
- ✅ Build system (APK creation)
- ✅ Component structure (file organization)
- ✅ Import/export resolution
- ✅ Unit tests for utilities (encryption, validation)
- ✅ Integration tests for services (auth, message)

**Not Testable**:
- ❌ Visual UI rendering
- ❌ Touch interactions
- ❌ Actual device performance
- ❌ Android-specific APIs (notifications, background tasks)

**Recommended Tests**:

1. **TypeScript Compilation Test**
   - Goal: Ensure zero type errors in codebase
   - Execution: `npm run test:types` (already exists)
   - Success: `tsc --noEmit` returns exit code 0
   - Failure: Log all type errors with file:line references

2. **ESLint Code Quality Test**
   - Goal: Enforce code style and catch common errors
   - Execution: `npm run test:lint` (already exists)
   - Success: Zero ESLint violations
   - Failure: Log violations with severity (error/warning)

3. **Build System Test**
   - Goal: Verify Android APK can be built
   - Execution: `npm run test:build` (already exists)
   - Success: `./gradlew assembleDebug` completes, APK exists
   - Failure: Log Gradle error, Java version, dependency issues

4. **Unit Tests - Encryption Utils**
   - Goal: Verify encryption utilities work correctly
   - Execution: Jest tests for `encryptionUtils.ts`
   - Success: All encryption/decryption tests pass
   - Failure: Log which crypto operation failed

5. **Unit Tests - Validation Utils**
   - Goal: Verify input validation functions
   - Execution: Jest tests for `validationUtils.ts`
   - Success: Token validation, format validation tests pass
   - Failure: Log which validation is incorrect

6. **Integration Tests - Auth Service**
   - Goal: Verify authentication service integrates correctly
   - Execution: Jest tests mocking backend responses
   - Success: Login flow, token storage, auth headers work
   - Failure: Log which integration point failed

7. **Integration Tests - Message Service**
   - Goal: Verify message encryption and submission
   - Execution: Jest tests with mocked backend
   - Success: Message encryption → submission → decryption flow works
   - Failure: Log which step failed (encrypt, send, decrypt)

8. **Component Structure Test**
   - Goal: Verify all imports resolve and files are organized
   - Execution: Check for missing imports, circular dependencies
   - Success: No unresolved imports, no circular deps
   - Failure: Log problematic imports with file paths

#### Phase 3: Voice Integration (Ready to Start)

**Testable** (when implemented):
- ✅ Library installation (react-native-voice, react-native-tts)
- ✅ TypeScript types for voice libraries
- ✅ Service integration (voiceService.ts structure)
- ✅ Error handling for voice permissions
- ✅ Fallback behavior when voice unavailable

**Not Testable**:
- ❌ Actual speech recognition (requires microphone)
- ❌ Text-to-speech output (requires speakers)
- ❌ Voice UI/UX (requires device interaction)
- ❌ Voice command accuracy

**Recommended Tests**:

1. **Voice Library Installation Test**
   - Goal: Verify voice dependencies install without conflicts
   - Execution: `npm install react-native-voice react-native-tts react-native-keep-awake`
   - Success: All libraries install, no peer dependency errors
   - Failure: Log dependency conflicts, version mismatches

2. **TypeScript Integration Test**
   - Goal: Ensure voice library types are available
   - Execution: Import voice libraries in TypeScript, run type check
   - Success: No type errors when using Voice/Tts APIs
   - Failure: Log missing type definitions

3. **Voice Service Structure Test**
   - Goal: Verify voiceService.ts follows architecture
   - Execution: Check for required methods (startListening, speak, etc.)
   - Success: Service exports expected interface
   - Failure: Log missing methods or incorrect signatures

4. **Permission Error Handling Test**
   - Goal: Verify graceful handling when voice permissions denied
   - Execution: Unit test with mocked permission denial
   - Success: App doesn't crash, shows user-friendly error
   - Failure: Log uncaught exceptions

5. **Fallback Behavior Test**
   - Goal: Ensure app works when voice features unavailable
   - Execution: Test with voice libraries mocked to fail
   - Success: App falls back to text input/output
   - Failure: Log failure to degrade gracefully

#### Phase 4: UI Polish (Complete)

**Testable**:
- ✅ Component exports and imports
- ✅ Screen navigation structure
- ✅ Props validation (TypeScript)
- ✅ Error boundary implementation
- ✅ Loading state management

**Not Testable**:
- ❌ Visual design quality
- ❌ Touch interactions
- ❌ Animation smoothness
- ❌ Accessibility features

**Recommended Tests**:

1. **Screen Component Test**
   - Goal: Verify all screens export valid React components
   - Execution: Import each screen, check for component structure
   - Success: All screens are valid React.FC components
   - Failure: Log invalid component exports

2. **Error Boundary Test**
   - Goal: Verify error boundaries catch component errors
   - Execution: Jest test throwing error in child component
   - Success: Error boundary renders fallback UI
   - Failure: Log errors that escape boundary

3. **State Management Test**
   - Goal: Verify loading/error states update correctly
   - Execution: Unit tests for state transitions
   - Success: States transition as expected (loading → success → error)
   - Failure: Log incorrect state transitions

#### Phase 5: Monetization (Pending)

**Testable** (when implemented):
- ✅ Prompt counting logic
- ✅ Limit enforcement (100 free prompts)
- ✅ Storage of usage data
- ✅ In-app purchase integration (test mode)

**Not Testable**:
- ❌ Actual payment processing
- ❌ App store review compliance

**Recommended Tests**:

1. **Prompt Counter Test**
   - Goal: Verify prompt counting is accurate
   - Execution: Send 100 prompts, verify counter increments
   - Success: Counter reaches 100, further prompts blocked
   - Failure: Log counting discrepancies

2. **Storage Persistence Test**
   - Goal: Verify usage data persists across app restarts
   - Execution: Set counter to 50, mock app restart, check counter
   - Success: Counter still at 50 after restart
   - Failure: Log storage failure

### 3. Cross-Platform Testing (Android vs iOS)

**iOS-Specific Considerations**:

**Testable**:
- ✅ iOS build configuration (Podfile, Info.plist)
- ✅ CocoaPods dependency resolution
- ✅ iOS-specific TypeScript issues
- ✅ Platform-specific code paths (`Platform.OS === 'ios'`)

**Not Testable** (without macOS):
- ❌ Xcode build
- ❌ iOS simulator
- ❌ iOS-specific runtime behavior

**Recommended Tests**:

1. **iOS Configuration Validation**
   - Goal: Verify iOS project files are properly configured
   - Execution: Parse Podfile, Info.plist, check for required keys
   - Success: All required permissions, dependencies present
   - Failure: Log missing configurations

2. **Platform Code Coverage Test**
   - Goal: Ensure iOS code paths are implemented
   - Execution: Check for `Platform.OS === 'ios'` branches, verify non-empty
   - Success: All platform switches have iOS implementation
   - Failure: Log missing iOS code paths

3. **Dependency Compatibility Test**
   - Goal: Verify dependencies support both Android and iOS
   - Execution: Check package.json dependencies against known iOS incompatibilities
   - Success: All dependencies support iOS
   - Failure: Log incompatible packages with alternatives

### 4. Test Automation Framework

**Create a unified test runner**:

**Structure**:
```bash
scripts/
├── test-all.sh              # Run all tests in correct order
├── test-phase.sh            # Run tests for specific phase
├── test-backend.py          # Backend API tests (exists)
├── test-ios-config.sh       # iOS configuration validation
└── test-reports/            # Test output directory
    ├── typescript.log
    ├── eslint.log
    ├── backend.log
    ├── build.log
    └── summary.json
```

**Test Runner Features**:
- Phase-aware: Skip tests for unimplemented phases
- Parallel execution: Run independent tests concurrently
- Detailed logging: Capture all output for debugging
- Summary report: JSON/markdown summary of results
- Exit codes: Non-zero on any failure
- CI/CD ready: GitHub Actions compatible

**Example `scripts/test-all.sh`**:
```bash
#!/bin/bash
set -e

echo "=== VOICE Relay Comprehensive Test Suite ==="

# Phase 0: E2EE (if implemented)
if [ -f "scripts/test-e2ee.sh" ]; then
  echo "[Phase 0] Testing E2EE..."
  ./scripts/test-e2ee.sh
fi

# Phase 1: Backend
echo "[Phase 1] Testing Backend..."
python3 scripts/test_backend.py

# Phase 2: Core App
echo "[Phase 2] Testing Core App..."
cd app
npm run test:types
npm run test:lint
npm test
npm run test:build
cd ..

# Phase 3: Voice (if implemented)
if [ -f "app/src/services/voiceService.ts" ]; then
  echo "[Phase 3] Testing Voice Integration..."
  # Voice-specific tests
fi

# iOS Configuration
echo "[iOS] Testing iOS Configuration..."
./scripts/test-ios-config.sh

# Generate summary
echo "=== Test Summary ==="
# Count passes/failures, generate summary.json

echo "All tests complete!"
```

### 5. AI-Executable Test Definitions

**For each test, provide**:

**Test Definition Format**:
```yaml
name: typescript-compilation
phase: 2
goal: Verify zero TypeScript type errors in codebase
prerequisites:
  - Node.js installed
  - npm dependencies installed
execution:
  command: npm run test:types
  working_directory: app/
  timeout: 60
expected_outcome:
  exit_code: 0
  stdout_contains: null
  stderr_empty: true
failure_indicators:
  - exit_code: non-zero
  - stderr_contains: "error TS"
success_criteria:
  - TypeScript compilation completes
  - Zero type errors reported
  - All files type-checked
debugging_steps:
  - Read TypeScript error output
  - Identify file and line number
  - Check for implicit 'any', missing types
  - Fix type annotations
validation:
  - AI should verify Node.js version >= 18
  - AI should check package.json has typescript dependency
  - AI should confirm tsconfig.json exists
```

**Create test definitions for**:
- All Phase 0-4 tests
- iOS configuration tests
- Integration tests
- Build system tests

### 6. Continuous Improvement

**Test Evolution Strategy**:

1. **Baseline Tests**: Create initial test suite based on current implementation
2. **Gap Analysis**: Identify what's not tested, assess if testable
3. **Incremental Addition**: Add tests as new features are implemented
4. **Regression Prevention**: Add test for every bug fixed
5. **Coverage Metrics**: Track code coverage, aim for >80% (where testable)

**AI Learning Integration**:
- Tests should log detailed context for failures
- AI should analyze failure patterns
- AI should suggest new test cases based on failures
- AI should refactor tests for better coverage

### 7. Deliverables

Create the following artifacts:

1. **`TESTING_STRATEGY.md`**: Comprehensive testing strategy document
   - Philosophy and approach
   - Phase-by-phase testing plans
   - Cross-platform considerations
   - Test automation framework design

2. **`scripts/test-all.sh`**: Unified test runner script
   - Runs all applicable tests
   - Generates summary report
   - Exits with proper codes

3. **`scripts/test-phase.sh`**: Phase-specific test runner
   - Usage: `./scripts/test-phase.sh 2` (test Phase 2)
   - Runs only tests relevant to that phase

4. **`scripts/test-ios-config.sh`**: iOS configuration validator
   - Validates Podfile, Info.plist
   - Checks for required permissions
   - Verifies dependency compatibility

5. **`.github/workflows/test.yml`**: CI/CD workflow (optional)
   - Runs tests on every push
   - Reports results as GitHub Actions

6. **`app/tests/`**: Test suite directory structure
   - Unit tests: `app/tests/unit/`
   - Integration tests: `app/tests/integration/`
   - Test utilities: `app/tests/utils/`

7. **Test Definitions**: YAML or JSON file with all test metadata
   - Enables AI to understand test goals
   - Provides debugging guidance
   - Validates prerequisites

### 8. Claude Skills Integration (Optional)

**Consider creating a skill**:

**`.claude/skills/testing-voice-relay/`**
```yaml
---
name: testing-voice-relay
description: Execute comprehensive testing for VOICE Relay across all 5 phases including TypeScript validation, backend API tests, build verification, and cross-platform compatibility. Use when testing, verifying, debugging, or validating functionality.
version: 1.0.0
allowed-tools: ["Bash", "Read", "Write", "Edit", "Grep"]
---

# Testing VOICE Relay

Run comprehensive tests across all development phases.

## Quick Commands

```bash
# Run all tests
./scripts/test-all.sh

# Test specific phase
./scripts/test-phase.sh 2

# Backend only
python3 scripts/test_backend.py

# TypeScript + ESLint
cd app && npm run test:all
```

## Test Philosophy

[Concise summary of testing approach]

## Detailed Strategy

See [TESTING_STRATEGY.md](../../TESTING_STRATEGY.md) for complete testing strategy.
```

---

## Success Criteria

- ✅ Comprehensive testing strategy document created
- ✅ Test automation scripts implemented
- ✅ All current phases have defined test suites
- ✅ Tests are AI-executable with clear goals
- ✅ Failure modes provide actionable debugging info
- ✅ iOS and Android considerations addressed
- ✅ Test definitions include prerequisite validation
- ✅ CI/CD integration possible (even if not implemented)
- ✅ Testing strategy aligns with North Star principles

---

## Notes

- Focus on what CAN be tested, not what can't
- Provide maximum value within device-less constraints
- Design tests to be extended when device testing becomes available
- Emphasize autonomous execution by AI agents
- Make failures informative and actionable
- Keep test execution fast (all tests should run in < 5 minutes)

Start by analyzing current test coverage, then define comprehensive tests for each phase.
