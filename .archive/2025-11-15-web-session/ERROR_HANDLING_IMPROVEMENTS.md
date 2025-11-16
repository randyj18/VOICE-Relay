# Error Handling & User Feedback Improvements

## Overview
Implemented a comprehensive error handling and user feedback system that provides clear, actionable messages to users while maintaining the North Star principle of being "fast, simple, and secure."

---

## New Utility Modules

### 1. Error Utilities (`app/src/utils/errorUtils.ts`)

**Purpose**: Classify technical errors and convert them to user-friendly messages

**Key Features**:
- **Error Classification**:
  - `NETWORK_ERROR`: Connection issues, timeouts, unreachable servers
  - `AUTH_ERROR`: Invalid tokens, authentication failures
  - `CRYPTO_ERROR`: Decryption, encryption, key corruption issues
  - `VALIDATION_ERROR`: Invalid input, size limits exceeded
  - `STORAGE_ERROR`: Device storage issues
  - `UNKNOWN_ERROR`: Fallback for unexpected errors

**User-Friendly Messages**:
```
Technical: "ECONNREFUSED"
→ User sees: "Can't reach the server. Check your internet connection."

Technical: "Invalid token format"
→ User sees: "Invalid token format. Use: Bearer github|username|token"

Technical: "Decryption failed: private key corrupted"
→ User sees: "Decryption failed. Your keys might be corrupted. Try logging out and in again."

Technical: "Message size exceeds limit"
→ User sees: "Message too large. Keep replies under 10,000 characters."
```

**Key Functions**:
- `classifyError()`: Returns error type, user message, and retryability
- `formatErrorMessage()`: Adds context like operation name and retry count
- `isRetryableError()`: Determines if error should be retried
- `getTechnicalMessage()`: Extracts technical message for logging

**Example Usage**:
```typescript
const classified = classifyError(error);
if (classified.isRetryable) {
  // Show retry button
  showError('Operation Failed', classified.userMessage, {
    showRetryButton: true,
    onRetry: handleRetry
  });
}
```

---

### 2. Feedback Utilities (`app/src/utils/feedbackUtils.ts`)

**Purpose**: Provide consistent user feedback mechanisms

**Features**:
- **Toast Notifications** (Android):
  - Success messages auto-dismiss
  - Non-intrusive feedback
  - Uses native `ToastAndroid` API

- **Alert Dialogs** (iOS fallback):
  - More prominent for important messages
  - Allows optional action buttons

- **Predefined Operation Messages**:
  ```typescript
  LOGIN_VALIDATING: "Validating token..."
  LOGIN_GENERATING_KEYS: "Generating encryption keys..."
  LOGIN_SUCCESS: "Logged in successfully!"
  DECRYPT_DECRYPTING: "Decrypting message..."
  DECRYPT_SUCCESS: "Message decrypted ✓"
  ENCRYPT_ENCRYPTING: "Encrypting reply..."
  SEND_SENDING: "Sending reply..."
  REPLY_SUCCESS: "Reply sent ✓"
  ```

**Key Functions**:
- `showSuccess()`: Display success message with auto-dismiss
- `showError()`: Display error with optional retry button
- `showInfo()`: Display informational message
- `showConfirmation()`: Show confirmation dialog with actions
- `getLoadingMessage()`: Get context-specific loading messages

**Example Usage**:
```typescript
// Success feedback
showSuccess("Reply sent ✓");

// Error with retry
showError('Decryption Failed', 'Your keys might be corrupted.', {
  showRetryButton: true,
  onRetry: handleDecryptMessage
});
```

---

### 3. Retry Utilities (`app/src/utils/retryUtils.ts`)

**Purpose**: Implement automatic retry with exponential backoff

**Features**:
- **Exponential Backoff**: 2s → 4s → 8s → 16s (configurable)
- **Configurable Options**:
  - Max retry attempts (default: 4)
  - Initial delay (default: 2000ms)
  - Max delay cap (default: 16000ms)
  - Custom retry predicate

- **Automatic Retry on Network Failures**:
  - Only retries if error is classified as retryable
  - Logs each attempt for debugging
  - Returns result with attempt count

**Key Functions**:
- `retryWithBackoff()`: Execute function with automatic retry
- `retryWithCallback()`: Retry with UI callback for attempt tracking
- `delay()`: Promise-based delay utility
- `calculateBackoffDelay()`: Get delay for given attempt
- `makeRetryable()`: Wrap function to add automatic retry

**Example Usage**:
```typescript
const result = await retryWithBackoff(
  () => apiService.getPublicKey(),
  { maxAttempts: 3, initialDelayMs: 2000 }
);

if (result.success) {
  console.log('Key retrieved:', result.data);
} else {
  console.error(`Failed after ${result.attempts} attempts:`, result.finalError);
}
```

---

### 4. Validation Utilities (`app/src/utils/validationUtils.ts`)

**Purpose**: Validate user input with specific feedback

**Features**:
- **Token Validation**:
  - Accepts format: `Bearer github|username|token`
  - Validates all three parts are present
  - Minimum length checks

- **Reply Validation**:
  - Empty check
  - Max 10,000 character limit
  - Warning at 80% usage (8,000 chars)

- **Character Counter**:
  - Current/max display
  - Three states: normal (0-80%), warning (80-100%), error (>100%)
  - Percentage calculation

- **Other Validations**:
  - Message ID format
  - URL format
  - PEM key format

**Key Functions**:
- `validateGithubToken()`: Token format validation
- `validateReply()`: Reply content validation
- `validateMessageId()`: Message ID format check
- `getCharacterCountStatus()`: Get counter info with color status
- `validateUrl()`: URL format validation
- `validatePemKey()`: PEM format validation

**Validation Result Format**:
```typescript
{
  isValid: boolean;
  error?: string;      // Validation error message
  warning?: string;    // Non-blocking warning
}
```

**Example Usage**:
```typescript
const validation = validateReply(userInput);
if (!validation.isValid) {
  showError('Invalid Reply', validation.error);
  return;
}
if (validation.warning) {
  console.warn('Warning:', validation.warning);
}
```

---

### 5. Network Utilities (`app/src/utils/networkUtils.ts`)

**Purpose**: Detect and handle offline scenarios

**Features**:
- **Network Status Detection**:
  - Online / Offline / Checking states
  - Connection type detection (WiFi, cellular, etc.)
  - Expensive connection detection

- **Status Formatting**:
  - User-friendly status messages
  - Status indicators (color, icon, label)

- **Network Error Detection**:
  - Identifies network-related errors
  - Determines if retry should happen

**Key Functions**:
- `checkNetworkStatus()`: Get current network state
- `subscribeToNetworkChanges()`: Monitor connection changes
- `formatNetworkStatus()`: Get user-friendly message
- `getNetworkStatusIndicator()`: Get visual indicator
- `isNetworkError()`: Check if error is network-related
- `retryOnNetworkRecovery()`: Retry when connection returns

**Example Usage**:
```typescript
const status = await checkNetworkStatus();
if (!status.isConnected) {
  showInfo("You're offline. Messages will send when connected.");
}
```

---

## Service Improvements

### API Service (`app/src/services/api.ts`)

**Changes**:
1. **Health Check**: Added 3 automatic retries with 1s initial delay
2. **Get Public Key**:
   - Retry with 2s-16s backoff
   - Better error messages
3. **Submit Reply**:
   - Message size validation (10,000 char limit)
   - Retry logic for network failures
   - Classified error messages

**Example Error Messages**:
```
Too large: "Message too large. Keep replies under 10,000 characters."
Network: "Can't reach server. Check your internet connection."
Auth: "Invalid token format. Use: Bearer github|username|token"
```

---

### Auth Service (`app/src/services/authService.ts`)

**Changes**:
1. **Token Validation**: Validates format before attempting login
2. **Better Error Messages**: Uses `formatErrorMessage()` for consistency
3. **Improved Logging**: Clear operation phases

**Before**:
```
Error: Failed to get public key: 401 unauthorized
```

**After**:
```
Error: Invalid token format. Use: Bearer github|username|token
```

---

### Message Service (`app/src/services/messageService.ts`)

**Changes**:
1. **Reply Validation**: Validates content before encryption
2. **Better Error Context**: All errors include operation context
3. **Character Limit Enforcement**: Prevents oversized messages

---

## UI/App Improvements

### App.tsx (`app/src/App.tsx`)

**Key Enhancements**:

1. **Login Screen**:
   - Token format validation on input
   - Specific error messages for invalid tokens
   - Retry button on network errors
   - Clear loading states: "Validating token...", "Generating keys..."

2. **Message Decryption**:
   - Loading state: "Decrypting message..."
   - Success feedback: Green checkmark toast
   - Retry button for network failures
   - Crypto error explanation and recovery steps

3. **Reply Submission**:
   - Character counter (0/10,000)
   - Visual feedback: Warning color at 80%, error color at 100%
   - Inline error messages
   - Disabled submit button for invalid replies
   - Two-phase loading: "Encrypting..." then "Sending..."
   - Success toast: "Reply sent ✓"

4. **Logout**:
   - Loading state during logout
   - Success feedback message
   - Clear state reset

5. **Error Handling**:
   - No more generic "Error: undefined" messages
   - Actionable error messages for users
   - Retry buttons when appropriate
   - Context-aware error dialogs

### UI Components Added

**Character Counter**:
- Displays current/max count
- Color changes:
  - Gray (0-80%): Normal
  - Orange (80-100%): Warning
  - Red (>100%): Error

**Input Validation**:
- Red border on invalid input
- Inline error message below input
- Submit button disabled until valid

**Loading States**:
- "Validating token..."
- "Generating encryption keys..."
- "Decrypting message..."
- "Encrypting reply..."
- "Sending reply..."

---

## Error Message Examples

### Network Errors
```
"Can't reach the server. Check your internet connection."
(Shows retry button on network errors)
```

### Auth Errors
```
"Invalid token format. Use: Bearer github|username|token"
(Clear, actionable format instruction)
```

### Crypto Errors
```
"Decryption failed. Your keys might be corrupted. Try logging out and in again."
(Explains problem and solution)
```

### Validation Errors
```
"Reply is too long (10,542/10,000 chars). Keep it under 10,000 characters."
(Shows exact count and limit)
```

### Storage Errors
```
"Failed to save data. Please check your device storage."
(Non-technical, actionable)
```

---

## Design Principles

✓ **North Star Alignment**: Fast, simple, secure
- No Sentry or complex error tracking
- No debug tools visible to users
- User-friendly, non-technical language
- Minimal UI additions

✓ **User-Centric**:
- Errors explain what went wrong
- Solutions are actionable
- Non-disruptive (toast notifications)
- Clear call-to-action (retry buttons)

✓ **Developer-Friendly**:
- Consistent error classification
- Configurable retry logic
- Easy to add validation
- Clear logging for debugging

---

## Testing Guide

### Test Error Messages

**Login Tests**:
1. Empty token → "Token is required"
2. Invalid format → "Invalid token format. Use: Bearer github|username|token"
3. Network down → "Can't reach server..." with retry button
4. Invalid token → Specific auth error message

**Reply Tests**:
1. Empty reply → "Reply cannot be empty"
2. Reply >10,000 chars → "Reply is too long... Keep under 10,000 characters"
3. Character counter → Shows 0/10,000, changes color at 80% and 100%
4. Network error → Retry button appears and works

**Decryption Tests**:
1. Corrupted key → "Your keys might be corrupted..."
2. Network error → Retry button appears
3. Success → Green toast with checkmark

---

## Files Modified/Created

**Created**:
- `app/src/utils/errorUtils.ts` (150 lines)
- `app/src/utils/feedbackUtils.ts` (130 lines)
- `app/src/utils/retryUtils.ts` (180 lines)
- `app/src/utils/validationUtils.ts` (160 lines)
- `app/src/utils/networkUtils.ts` (110 lines)

**Modified**:
- `app/src/App.tsx` (+70 lines, improved error handling and UI)
- `app/src/services/api.ts` (added retry logic)
- `app/src/services/authService.ts` (added validation)
- `app/src/services/messageService.ts` (added validation)

**Total**: 790+ lines of new utility code, 70+ lines of app improvements

---

## Commit Reference
```
9b52b11 - Improve user feedback, loading states, and error handling
```

---

## Future Enhancements (Phase 3+)

- Network status banner (offline indicator)
- Message queue with retry on connection return
- Offline message caching
- Push notification error handling
- Voice command error feedback (Phase 3)
- Analytics on error types (Phase 4)
