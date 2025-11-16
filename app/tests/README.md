# VOICE Relay Test Suite

This directory contains all tests for the VOICE Relay React Native application.

## Directory Structure

```
tests/
├── unit/               # Unit tests for individual functions/utilities
├── integration/        # Integration tests for services/components
├── utils/             # Test utilities and helpers
├── definitions/       # YAML test definitions for AI execution
└── README.md          # This file
```

## Test Categories

### Unit Tests (`unit/`)

Tests for individual functions, utilities, and isolated components:
- Encryption utilities
- Validation functions
- Helper functions
- Pure logic components

**Example**: `unit/encryptionUtils.test.ts`

### Integration Tests (`integration/`)

Tests for service interactions, API calls, and component integration:
- Auth service with backend
- Message service with encryption
- API client with network
- State management

**Example**: `integration/authService.test.ts`

### Test Utilities (`utils/`)

Shared testing utilities and mocks:
- Mock data generators
- Test fixtures
- Custom matchers
- Helper functions

**Example**: `utils/mockBackend.ts`

### Test Definitions (`definitions/`)

YAML files defining tests for AI-autonomous execution:
- Test goals and outcomes
- Execution commands
- Success criteria
- Debugging steps

**Example**: `definitions/typescript-compilation.yaml`

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test -- encryptionUtils.test.ts
```

## Writing Tests

### Unit Test Template

```typescript
import { functionToTest } from '../src/utils/myUtils';

describe('functionToTest', () => {
  it('should handle valid input correctly', () => {
    const result = functionToTest('valid input');
    expect(result).toBe('expected output');
  });

  it('should handle invalid input gracefully', () => {
    expect(() => functionToTest(null)).toThrow('Expected error');
  });
});
```

### Integration Test Template

```typescript
import { MyService } from '../src/services/myService';
import { mockBackend } from './utils/mockBackend';

describe('MyService Integration', () => {
  beforeEach(() => {
    mockBackend.reset();
  });

  it('should integrate with backend correctly', async () => {
    mockBackend.mockSuccess({ data: 'test' });

    const service = new MyService();
    const result = await service.fetchData();

    expect(result).toEqual({ data: 'test' });
  });
});
```

## Test Guidelines

1. **North Star Alignment**: Tests should validate speed, simplicity, and security
2. **Clear Goals**: Each test should have a clear, verifiable goal
3. **Autonomous**: Tests should run without human intervention
4. **Fast Feedback**: Tests should complete quickly (< 1s per test)
5. **Actionable Failures**: Failures should provide clear debugging information

## Phase-Aware Testing

Tests are organized by development phase:
- **Phase 0**: E2EE encryption tests
- **Phase 1**: Backend integration tests
- **Phase 2**: Core app tests (current)
- **Phase 3**: Voice integration tests (future)
- **Phase 4**: UI tests (current)
- **Phase 5**: Monetization tests (future)

Skip tests for unimplemented phases using:
```typescript
describe.skip('Phase 3: Voice', () => {
  // Tests for voice features (not yet implemented)
});
```

## AI-Executable Tests

Test definitions in `definitions/` enable AI agents to:
1. Understand test goals
2. Execute tests autonomously
3. Interpret results
4. Debug failures

See `definitions/README.md` for the YAML format specification.

## Continuous Integration

Tests run automatically on:
- Every commit (via pre-commit hook)
- Every push (via GitHub Actions)
- Pull requests

CI runs:
```bash
npm run test:all  # TypeScript + ESLint + Jest
```

## Coverage Goals

Target: **>80% code coverage** for testable code

Current coverage:
```bash
npm test -- --coverage
```

Exclude from coverage:
- UI rendering (not testable without device)
- Platform-specific APIs (not testable without device)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [TESTING_STRATEGY.md](../../TESTING_STRATEGY.md) - Full testing strategy

## Questions?

See [PROMPTS_INDEX.md](../../PROMPTS_INDEX.md) for testing guidance.
