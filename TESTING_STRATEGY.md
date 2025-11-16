# VOICE Relay Testing Strategy

**Version**: 1.0.0
**Last Updated**: 2025-11-16
**Status**: Active

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Capabilities & Constraints](#testing-capabilities--constraints)
3. [Phase-by-Phase Testing](#phase-by-phase-testing)
4. [Test Automation Framework](#test-automation-framework)
5. [Cross-Platform Testing](#cross-platform-testing)
6. [Test Execution Guide](#test-execution-guide)
7. [Continuous Improvement](#continuous-improvement)

---

## Testing Philosophy

### North Star Alignment

**"Be the fastest, simplest, most secure relay for a voice conversation."**

Every test in this strategy serves the North Star by validating:
- **Speed**: Build and compilation performance
- **Simplicity**: Code quality, type safety, minimal dependencies
- **Security**: E2EE functionality, authentication, data validation

### Core Principles

**1. Goal-Oriented Testing**
- Every test has a clear, verifiable goal
- Goals must be relevant to the current development phase
- Tests skip gracefully when features are not yet implemented

**2. Outcome-Driven Validation**
- Define specific expected outcomes
- Outcomes are machine-verifiable
- Include both success and failure criteria

**3. Phase-Aware Execution**
- Tests adapt to what's currently implemented
- Different phases have different testable aspects
- No false failures for unimplemented features

**4. Autonomous AI Execution**
- Tests run without human intervention
- Results are interpretable by AI agents
- Failures provide actionable debugging information

**5. Fast Feedback**
- Complete test suite runs in < 5 minutes
- Parallel execution where possible
- Early failure detection

---

## Testing Capabilities & Constraints

### What We CAN Test ✅

1. **Code Quality**
   - TypeScript compilation and type checking
   - ESLint code quality verification
   - Import/export resolution
   - Circular dependency detection

2. **Backend Services**
   - API endpoint availability
   - Authentication flows
   - Request/response validation
   - CORS configuration
   - Error handling

3. **Build Systems**
   - Android APK creation
   - TypeScript compilation
   - Dependency resolution
   - Build configuration

4. **Unit & Integration**
   - Utility functions (encryption, validation)
   - Service layer logic
   - Component structure
   - State management

5. **Configuration**
   - iOS project files (Podfile, Info.plist)
   - Android build configuration
   - Platform-specific code paths

### What We CANNOT Test ❌

1. **Device-Specific**
   - Visual UI rendering
   - Touch interactions
   - Actual voice features (STT/TTS)
   - Performance on physical devices

2. **Platform-Specific**
   - iOS simulator (requires macOS)
   - Android emulator runtime
   - Platform-specific APIs in action

3. **Production Environment**
   - Real-world network conditions
   - Load testing at scale
   - Actual payment processing

**Strategy**: Focus on what CAN be tested, design tests to be extended when device testing becomes available.

---

## Phase-by-Phase Testing

### Phase 0: E2EE Encryption ✅ Complete

#### Testable Components

- ✅ Encryption/decryption round-trip (Python ↔ React Native)
- ✅ RSA-2048 key generation
- ✅ AES-256-GCM symmetric encryption
- ✅ Base64 encoding/decoding
- ✅ Error handling for invalid keys/ciphertext

#### Test Suite

**1. E2EE Round-Trip Test**
```yaml
Goal: Verify Python backend can decrypt messages encrypted by React Native client
Execution: Node.js script → encrypt → Python script → decrypt → compare
Success: Decrypted message === original plaintext
Failure: Log key lengths, cipher format, error messages
```

**2. Key Generation Validation**
```yaml
Goal: Ensure RSA-2048 keys meet security requirements
Execution: Generate 10 key pairs, validate bit length, uniqueness
Success: All keys are 2048-bit, unique, properly formatted
Failure: Identify which validation failed (length, format, uniqueness)
```

**3. Error Handling Test**
```yaml
Goal: Verify graceful handling of encryption failures
Execution: Attempt encryption with invalid keys, corrupted data
Success: Errors caught, logged, no crashes
Failure: Identify which error scenario causes crash
```

#### Success Criteria
- All encryption round-trips complete successfully
- Key generation produces valid RSA-2048 keys
- Invalid inputs handled without crashes

---

### Phase 1: Backend Relay ✅ Complete

#### Testable Components

- ✅ Endpoint availability (health, auth, message submission)
- ✅ Authentication flow (token validation)
- ✅ Request/response format validation
- ✅ CORS headers for mobile clients
- ✅ Error responses (401, 400, 500)

#### Test Suite

**1. Endpoint Health Checks**
```yaml
Goal: Verify all backend endpoints accessible and responsive
Script: scripts/test_backend.py
Success: All 8 endpoints return expected status codes
Failure: Log failed endpoint, status code, response body
```

**2. Authentication Flow Test**
```yaml
Goal: Verify token-based authentication works
Execution: Test without token (expect 401), with valid token (expect 200)
Success: Unauthorized requests rejected, authorized succeed
Failure: Identify auth bypass or false rejection
```

**3. Data Validation Test**
```yaml
Goal: Ensure backend validates input correctly
Execution: Send malformed JSON, missing fields, invalid types
Success: Backend returns 400 with clear error messages
Failure: Log which validation is missing
```

**4. CORS Configuration Test**
```yaml
Goal: Verify mobile clients can make cross-origin requests
Execution: OPTIONS preflight request, check headers
Success: Access-Control-Allow-Origin header present
Failure: Identify missing CORS headers
```

#### Known Issues
- **Replit WAF**: Production backend returns 403 (WAF blocking)
- **Mitigation**: Tests handle gracefully, log warning, don't fail if local works
- **Guidance**: Use local backend for development

#### Success Criteria
- All endpoints respond with correct status codes
- Authentication properly rejects unauthorized requests
- Input validation catches malformed data
- CORS configured for mobile clients

---

### Phase 2: Core App - Android ✅ Complete

#### Testable Components

- ✅ TypeScript compilation (zero type errors)
- ✅ ESLint code quality
- ✅ Build system (APK creation)
- ✅ Component structure
- ✅ Import/export resolution
- ✅ Unit tests for utilities
- ✅ Integration tests for services

#### Test Suite

**1. TypeScript Compilation**
```bash
Command: npm run test:types
Working Directory: app/
Goal: Zero TypeScript type errors
Success: tsc --noEmit returns exit code 0
Failure: Log all type errors with file:line references
Timeout: 60s
```

**2. ESLint Code Quality**
```bash
Command: npm run test:lint
Working Directory: app/
Goal: Zero ESLint violations
Success: Exit code 0
Failure: Log violations with severity (error/warning)
Timeout: 30s
```

**3. Build System**
```bash
Command: npm run test:build
Working Directory: app/
Goal: Android APK can be built
Success: ./gradlew assembleDebug completes, APK exists
Failure: Log Gradle error, Java version, dependency issues
Timeout: 300s
```

**4. Unit Tests - Encryption Utils**
```yaml
Goal: Verify encryption utilities work correctly
Location: app/src/utils/encryptionUtils.test.ts
Execution: Jest tests
Success: All encryption/decryption tests pass
Failure: Log which crypto operation failed
```

**5. Unit Tests - Validation Utils**
```yaml
Goal: Verify input validation functions
Location: app/src/utils/validationUtils.test.ts
Execution: Jest tests
Success: Token validation, format validation pass
Failure: Log which validation is incorrect
```

**6. Integration Tests - Auth Service**
```yaml
Goal: Verify authentication service integrates correctly
Location: app/src/services/authService.test.ts
Execution: Jest with mocked backend
Success: Login flow, token storage, auth headers work
Failure: Log which integration point failed
```

**7. Integration Tests - Message Service**
```yaml
Goal: Verify message encryption and submission
Location: app/src/services/messageService.test.ts
Execution: Jest with mocked backend
Success: Encrypt → submit → decrypt flow works
Failure: Log which step failed
```

**8. Component Structure Test**
```yaml
Goal: Verify imports resolve, no circular dependencies
Execution: madge or similar tool
Success: No unresolved imports, no circular deps
Failure: Log problematic imports with file paths
```

#### Success Criteria
- TypeScript compiles with zero errors
- ESLint passes with zero violations
- Android APK builds successfully
- All unit and integration tests pass
- No circular dependencies

---

### Phase 3: Voice Integration 🟡 Ready to Start

#### Testable Components (when implemented)

- ✅ Library installation (react-native-voice, react-native-tts)
- ✅ TypeScript types for voice libraries
- ✅ Service integration structure
- ✅ Error handling for voice permissions
- ✅ Fallback behavior when voice unavailable

#### Test Suite

**1. Voice Library Installation**
```bash
Command: npm install react-native-voice react-native-tts react-native-keep-awake
Goal: Verify dependencies install without conflicts
Success: All libraries install, no peer dependency errors
Failure: Log dependency conflicts, version mismatches
```

**2. TypeScript Integration**
```yaml
Goal: Ensure voice library types available
Execution: Import in TypeScript, run type check
Success: No type errors when using Voice/Tts APIs
Failure: Log missing type definitions
```

**3. Voice Service Structure**
```yaml
Goal: Verify voiceService.ts follows architecture
Check: Required methods (startListening, speak, stopListening)
Success: Service exports expected interface
Failure: Log missing methods or incorrect signatures
```

**4. Permission Error Handling**
```yaml
Goal: Graceful handling when permissions denied
Execution: Unit test with mocked permission denial
Success: No crash, shows user-friendly error
Failure: Log uncaught exceptions
```

**5. Fallback Behavior**
```yaml
Goal: App works when voice features unavailable
Execution: Mock voice libraries to fail
Success: App falls back to text input/output
Failure: Log failure to degrade gracefully
```

#### Success Criteria
- Voice libraries install successfully
- TypeScript types resolve
- Permission errors handled gracefully
- Fallback to text mode works

---

### Phase 4: UI Polish ✅ Complete

#### Testable Components

- ✅ Component exports and imports
- ✅ Screen navigation structure
- ✅ Props validation (TypeScript)
- ✅ Error boundary implementation
- ✅ Loading state management

#### Test Suite

**1. Screen Component Test**
```yaml
Goal: All screens export valid React components
Execution: Import each screen, check component structure
Success: All screens are valid React.FC components
Failure: Log invalid component exports
```

**2. Error Boundary Test**
```yaml
Goal: Error boundaries catch component errors
Execution: Jest test throwing error in child
Success: Error boundary renders fallback UI
Failure: Log errors that escape boundary
```

**3. State Management Test**
```yaml
Goal: Loading/error states update correctly
Execution: Unit tests for state transitions
Success: States transition as expected (loading → success → error)
Failure: Log incorrect state transitions
```

#### Success Criteria
- All screens are valid React components
- Error boundaries catch and handle errors
- State transitions work correctly

---

### Phase 5: Monetization ⏸️ Pending

#### Testable Components (when implemented)

- ✅ Prompt counting logic
- ✅ Limit enforcement (100 free prompts)
- ✅ Storage of usage data
- ✅ In-app purchase integration (test mode)

#### Test Suite

**1. Prompt Counter Test**
```yaml
Goal: Verify prompt counting is accurate
Execution: Send 100 prompts, verify counter increments
Success: Counter reaches 100, blocks further prompts
Failure: Log counting discrepancies
```

**2. Storage Persistence Test**
```yaml
Goal: Usage data persists across app restarts
Execution: Set counter to 50, mock restart, check counter
Success: Counter still at 50 after restart
Failure: Log storage failure
```

#### Success Criteria
- Prompt counter accurately tracks usage
- Usage data persists across restarts
- Limit enforcement blocks after 100 prompts

---

## Test Automation Framework

### Directory Structure

```
VOICE-Relay/
├── scripts/
│   ├── test-all.sh              # Run all tests
│   ├── test-phase.sh            # Phase-specific tests
│   ├── test-ios-config.sh       # iOS validation
│   ├── test_backend.py          # Backend API tests
│   └── test-reports/            # Test output
│       ├── typescript.log
│       ├── eslint.log
│       ├── backend.log
│       ├── build.log
│       └── summary.json
├── app/
│   ├── tests/
│   │   ├── unit/                # Unit tests
│   │   ├── integration/         # Integration tests
│   │   └── utils/               # Test utilities
│   └── package.json
└── TESTING_STRATEGY.md          # This document
```

### Test Runner Features

1. **Phase-Aware Execution**
   - Detects which phases are implemented
   - Skips tests for unimplemented phases
   - No false failures

2. **Parallel Execution**
   - Independent tests run concurrently
   - Faster feedback (target: < 5 minutes total)

3. **Detailed Logging**
   - Captures all output for debugging
   - Separate log files per test category
   - Timestamped entries

4. **Summary Reports**
   - JSON format for machine parsing
   - Markdown format for human reading
   - Pass/fail counts, duration, errors

5. **Exit Codes**
   - 0: All tests passed
   - 1: One or more tests failed
   - 2: Test execution error

6. **CI/CD Ready**
   - GitHub Actions compatible
   - Environment variable configuration
   - Artifact upload support

### Quick Commands

```bash
# Run all tests
./scripts/test-all.sh

# Run tests for specific phase
./scripts/test-phase.sh 2

# Backend tests only
python3 scripts/test_backend.py

# TypeScript + ESLint
cd app && npm run test:all

# iOS configuration validation
./scripts/test-ios-config.sh
```

---

## Cross-Platform Testing

### iOS-Specific Testing

#### Testable Without macOS

**1. iOS Configuration Validation**
```bash
Script: scripts/test-ios-config.sh
Goal: Verify iOS project files properly configured
Checks:
  - Podfile exists and has required dependencies
  - Info.plist has required permissions
  - iOS folder structure is correct
  - No iOS-incompatible dependencies
Success: All configurations present
Failure: Log missing configurations with fix suggestions
```

**2. Platform Code Coverage**
```yaml
Goal: Ensure iOS code paths implemented
Execution: Grep for Platform.OS === 'ios', verify non-empty
Success: All platform switches have iOS implementation
Failure: Log missing iOS code paths
```

**3. Dependency Compatibility**
```yaml
Goal: All dependencies support iOS
Execution: Check package.json against iOS incompatibility list
Success: All dependencies support iOS
Failure: Log incompatible packages with alternatives
```

#### Requires macOS

- ❌ Xcode build
- ❌ iOS simulator
- ❌ CocoaPods installation
- ❌ iOS-specific runtime behavior

**Strategy**: Validate configuration and code structure now, defer runtime testing until macOS access.

### Android-Specific Testing

#### Currently Testable ✅

- ✅ Gradle build (APK creation)
- ✅ Android-specific dependencies
- ✅ AndroidManifest.xml validation
- ✅ Build configuration

#### Requires Device/Emulator

- ❌ Runtime behavior
- ❌ Performance testing
- ❌ UI rendering
- ❌ Android-specific APIs

---

## Test Execution Guide

### Prerequisites

**System Requirements**:
- Node.js >= 18
- Python 3.8+
- Java 17 (for Android builds)
- Bash (for test scripts)

**Setup**:
```bash
# Install app dependencies
cd app && npm install && cd ..

# Verify Python
python3 --version

# Verify Java (for Android builds)
java -version
```

### Running Tests

**1. Complete Test Suite**
```bash
./scripts/test-all.sh
```
Runs all applicable tests across all phases. Duration: ~4 minutes.

**2. Phase-Specific Tests**
```bash
./scripts/test-phase.sh 2  # Test Phase 2 (Core App)
```
Runs only tests relevant to the specified phase.

**3. Category-Specific Tests**
```bash
# Backend only
python3 scripts/test_backend.py

# TypeScript + Lint only
cd app && npm run test:all

# iOS config only
./scripts/test-ios-config.sh
```

### Interpreting Results

**Success Output**:
```
=== VOICE Relay Test Suite ===
[Phase 1] Backend: ✅ PASS (8/8 endpoints)
[Phase 2] TypeScript: ✅ PASS (0 errors)
[Phase 2] ESLint: ✅ PASS (0 violations)
[Phase 2] Build: ✅ PASS (APK created)
[iOS] Configuration: ✅ PASS (all configs valid)

Summary: 5/5 tests passed in 3m 42s
```

**Failure Output**:
```
=== VOICE Relay Test Suite ===
[Phase 2] TypeScript: ❌ FAIL (3 errors)
  - src/utils/validation.ts:42 - Type 'string' not assignable to 'number'
  - src/services/auth.ts:18 - Property 'token' does not exist

See scripts/test-reports/typescript.log for details
```

### Debugging Failed Tests

**TypeScript Errors**:
1. Read `scripts/test-reports/typescript.log`
2. Locate file and line number
3. Check for implicit 'any', missing types
4. Fix type annotations

**ESLint Violations**:
1. Read `scripts/test-reports/eslint.log`
2. Note severity (error/warning)
3. Run `npm run lint -- --fix` for auto-fixes
4. Manually fix remaining issues

**Build Failures**:
1. Read `scripts/test-reports/build.log`
2. Check Java version (`java -version`)
3. Verify Gradle version
4. Check for dependency conflicts

**Backend Failures**:
1. Read `scripts/test-reports/backend.log`
2. Check if backend is running
3. Verify environment variables
4. Test with local backend if Replit fails

---

## Continuous Improvement

### Test Evolution Strategy

**1. Baseline** (Current)
- Create initial test suite for Phases 0-2
- Validate iOS configuration
- Establish CI/CD pipeline

**2. Gap Analysis** (Ongoing)
- Identify untested functionality
- Assess if testable within constraints
- Prioritize based on risk

**3. Incremental Addition** (Per Phase)
- Add tests as new features implemented
- Phase 3: Voice integration tests
- Phase 5: Monetization tests

**4. Regression Prevention** (Always)
- Add test for every bug fixed
- Document failure scenario
- Verify fix with test

**5. Coverage Metrics** (Target: >80%)
- Track code coverage with Jest
- Focus on critical paths (auth, encryption)
- Exclude UI rendering (not testable)

### AI Learning Integration

**Failure Analysis**:
- Log detailed context for every failure
- Include environment, versions, full stack traces
- AI analyzes patterns across failures

**Test Suggestion**:
- AI suggests new tests based on failures
- AI identifies gaps in coverage
- AI refactors tests for better coverage

**Autonomous Improvement**:
- AI can add new test cases
- AI can update test definitions
- AI reports improvements to developers

---

## Appendix: Test Definition Format

Tests are defined in YAML for AI execution. See `app/tests/definitions/` for examples.

**Template**:
```yaml
name: test-identifier
phase: 2
goal: "Clear, one-sentence description"
prerequisites:
  - "Node.js >= 18"
  - "npm dependencies installed"
execution:
  command: "npm run test:types"
  working_directory: "app/"
  timeout: 60
expected_outcome:
  exit_code: 0
  stdout_contains: null
  stderr_empty: true
failure_indicators:
  - exit_code: non-zero
  - stderr_contains: "error TS"
success_criteria:
  - "Zero type errors reported"
  - "All files type-checked"
debugging_steps:
  - "Read TypeScript error output"
  - "Identify file and line number"
  - "Fix type annotations"
validation:
  - "Verify Node.js version >= 18"
  - "Confirm tsconfig.json exists"
```

---

## Summary

This testing strategy enables comprehensive autonomous testing within device-less constraints:

✅ **Phase-Aware**: Tests adapt to current implementation
✅ **AI-Executable**: Clear goals, outcomes, debugging steps
✅ **Fast Feedback**: Complete suite in < 5 minutes
✅ **Actionable Failures**: Detailed debugging information
✅ **North Star Aligned**: Validates speed, simplicity, security
✅ **Extensible**: Ready for device testing when available

**Next Steps**:
1. Implement test scripts (`test-all.sh`, `test-phase.sh`, `test-ios-config.sh`)
2. Create test definitions in YAML
3. Set up `app/tests/` directory structure
4. Run baseline tests and document coverage
5. Integrate with CI/CD (GitHub Actions)

For questions or improvements, see [PROMPTS_INDEX.md](PROMPTS_INDEX.md) for the testing skill.
