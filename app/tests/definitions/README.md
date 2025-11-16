# Test Definitions

This directory contains YAML test definitions that enable AI agents to autonomously execute and interpret tests.

## Purpose

Test definitions provide:
1. **Clear Goals**: What the test validates
2. **Execution Details**: How to run the test
3. **Success Criteria**: What indicates success
4. **Failure Guidance**: How to debug failures
5. **Prerequisites**: What's needed to run the test

## YAML Format

```yaml
name: test-identifier
phase: 2                           # Development phase (0-5, or "ios")
goal: "Clear, one-sentence test goal"
category: "unit | integration | build | quality"
prerequisites:
  - "Node.js >= 18"
  - "npm dependencies installed"
execution:
  command: "npm run test:types"
  working_directory: "app/"
  timeout: 60                      # Seconds
  environment:                     # Optional env vars
    NODE_ENV: "test"
expected_outcome:
  exit_code: 0
  stdout_contains: null            # Optional: string to find in stdout
  stdout_not_contains: null        # Optional: string that shouldn't be in stdout
  stderr_empty: true               # Optional: stderr should be empty
  files_created: []                # Optional: files that should exist after test
failure_indicators:
  - condition: "exit_code != 0"
    action: "Check log file for errors"
  - condition: "stderr contains 'error TS'"
    action: "TypeScript compilation error - fix type annotations"
success_criteria:
  - "Zero type errors reported"
  - "All files type-checked successfully"
debugging_steps:
  - "Read full error output"
  - "Identify file and line number"
  - "Check for implicit 'any' types"
  - "Verify all imports are typed"
validation:
  - check: "Node.js version >= 18"
    command: "node --version"
  - check: "tsconfig.json exists"
    command: "test -f app/tsconfig.json"
metadata:
  importance: "critical | high | medium | low"
  estimated_duration: 30           # Seconds
  can_run_in_ci: true
  requires_network: false
```

## Field Descriptions

### Required Fields

- **name**: Unique identifier (kebab-case)
- **phase**: Development phase number (0-5) or "ios"
- **goal**: Clear, one-sentence description of what's being tested
- **execution.command**: Shell command to run
- **execution.working_directory**: Where to run the command

### Optional Fields

- **category**: Type of test (unit, integration, build, quality)
- **prerequisites**: List of requirements before running
- **execution.timeout**: Max seconds to run (default: 60)
- **execution.environment**: Environment variables to set
- **expected_outcome**: What success looks like
- **failure_indicators**: How to detect and handle failures
- **success_criteria**: Specific success conditions
- **debugging_steps**: Steps to debug failures
- **validation**: Pre-flight checks before running
- **metadata**: Additional information for AI agents

## Example: TypeScript Compilation Test

```yaml
name: typescript-compilation
phase: 2
goal: "Verify zero TypeScript type errors in codebase"
category: "quality"
prerequisites:
  - "Node.js >= 18"
  - "npm dependencies installed (npm install)"
  - "TypeScript compiler available"
execution:
  command: "npm run test:types"
  working_directory: "app/"
  timeout: 60
expected_outcome:
  exit_code: 0
  stderr_empty: true
failure_indicators:
  - condition: "exit_code != 0"
    action: "Read TypeScript error output"
  - condition: "stderr contains 'error TS'"
    action: "Fix type errors in identified files"
success_criteria:
  - "TypeScript compilation completes without errors"
  - "All .ts and .tsx files type-checked"
  - "Exit code is 0"
debugging_steps:
  - "Read full TypeScript error output"
  - "Identify file path and line number (e.g., src/utils/auth.ts:42)"
  - "Check for implicit 'any' types"
  - "Verify all imports have type definitions"
  - "Check tsconfig.json for strict settings"
validation:
  - check: "Node.js version >= 18"
    command: "node --version | grep -E 'v(18|19|20|21)'"
  - check: "package.json exists"
    command: "test -f app/package.json"
  - check: "tsconfig.json exists"
    command: "test -f app/tsconfig.json"
  - check: "TypeScript is installed"
    command: "cd app && npm ls typescript"
metadata:
  importance: "critical"
  estimated_duration: 30
  can_run_in_ci: true
  requires_network: false
```

## Example: Backend API Test

```yaml
name: backend-api-health
phase: 1
goal: "Verify backend API endpoints are accessible and responsive"
category: "integration"
prerequisites:
  - "Python 3.8+"
  - "Backend is running (local or production)"
  - "Network connectivity"
execution:
  command: "python3 scripts/test_backend.py"
  working_directory: "."
  timeout: 120
  environment:
    BACKEND_URL: "https://..."
expected_outcome:
  exit_code: 0
  stdout_contains: "PASS"
failure_indicators:
  - condition: "exit_code != 0"
    action: "Check backend connectivity"
  - condition: "stdout contains '403'"
    action: "Backend WAF blocking - use local backend"
  - condition: "stdout contains 'Connection refused'"
    action: "Backend is not running - start local backend"
success_criteria:
  - "All 8 endpoints return expected status codes"
  - "Authentication works correctly"
  - "CORS headers present"
debugging_steps:
  - "Check if backend is running: curl [backend-url]/docs"
  - "Verify network connectivity"
  - "Check for WAF blocking (403 errors)"
  - "Try local backend if production fails"
  - "Read scripts/test-reports/backend.log"
validation:
  - check: "Python 3.8+"
    command: "python3 --version | grep -E 'Python 3\\.(8|9|10|11|12)'"
  - check: "requests library installed"
    command: "python3 -c 'import requests'"
metadata:
  importance: "high"
  estimated_duration: 45
  can_run_in_ci: true
  requires_network: true
  allow_failure: true  # Due to Replit WAF
```

## AI Usage

AI agents use these definitions to:

1. **Pre-Execution Validation**
   ```python
   for check in test_def['validation']:
       if not run_command(check['command']):
           skip_test(f"Failed: {check['check']}")
   ```

2. **Execute Test**
   ```python
   result = run_command(
       test_def['execution']['command'],
       cwd=test_def['execution']['working_directory'],
       timeout=test_def['execution']['timeout']
   )
   ```

3. **Interpret Results**
   ```python
   if result.exit_code == test_def['expected_outcome']['exit_code']:
       mark_passed()
   else:
       for indicator in test_def['failure_indicators']:
           if condition_matches(indicator['condition'], result):
               execute_debugging_action(indicator['action'])
   ```

4. **Report Findings**
   ```python
   report = {
       'test': test_def['name'],
       'status': 'passed' if success else 'failed',
       'duration': elapsed_time,
       'details': debugging_info
   }
   ```

## Creating New Definitions

When adding a new test:

1. Copy an existing definition as template
2. Update all required fields
3. Add specific success/failure criteria
4. Include debugging steps
5. Test the definition with an AI agent
6. Commit to version control

## Naming Conventions

- Use kebab-case for test names
- Prefix with phase number for clarity: `phase2-typescript-compilation`
- Be descriptive: `backend-auth-flow` not just `auth`
- Group related tests: `ios-config-podfile`, `ios-config-infoplist`

## Best Practices

1. **One Goal Per Test**: Each definition should test one thing
2. **Clear Prerequisites**: List everything needed
3. **Specific Failures**: Don't just say "failed", explain why
4. **Actionable Debugging**: Give concrete steps to fix
5. **Fast Execution**: Keep tests under 2 minutes when possible
6. **Autonomous**: AI should run without asking questions

## Phase Mapping

- **Phase 0**: E2EE encryption tests
- **Phase 1**: Backend API tests
- **Phase 2**: Core app tests (TypeScript, ESLint, build)
- **Phase 3**: Voice integration tests
- **Phase 4**: UI component tests
- **Phase 5**: Monetization tests
- **ios**: iOS configuration tests

## See Also

- [TESTING_STRATEGY.md](../../../TESTING_STRATEGY.md) - Overall testing strategy
- [test-all.sh](../../../scripts/test-all.sh) - Test runner that uses these definitions
- [app/tests/README.md](../README.md) - Test suite overview
