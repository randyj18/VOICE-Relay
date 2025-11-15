# User Feedback Examples - Real-World Scenarios

## Login Screen Scenarios

### Scenario 1: User Enters Empty Token

**User Action**: Clicks login without entering a token

**Before**:
```
Alert Title: "Error"
Alert Message: "Please enter a GitHub token"
```

**After**:
```
Alert Title: "Invalid Token"
Alert Message: "Token is required"
+ Status Box shows: "Please enter a valid GitHub token"
```

---

### Scenario 2: User Enters Invalid Token Format

**User Action**: Types "my_token_12345" and clicks login

**Before**:
```
Alert Title: "Login Failed"
Alert Message: "Login failed: Error validating..."
[Generic error, no help]
```

**After**:
```
Alert Title: "Invalid Token"
Alert Message: "Invalid token format. Use: Bearer github|username|token"
[Retry button appears]
+ Loading Status: "Validating token..."
```

**Correct Format Example**:
```
Bearer github|myusername|my_token_abc123
```

---

### Scenario 3: Server Unreachable (Network Down)

**User Action**: Clicks login while offline

**Before**:
```
Alert Title: "Login Failed"
Alert Message: "Failed to get public key: 500 ECONNREFUSED"
[Confusing, no call-to-action]
```

**After**:
```
Alert Title: "Login Failed"
Alert Message: "Can't reach the server. Check your internet connection."
[Retry button provided]
+ Status Box: "Error: Can't reach the server..."
+ Automatic retry: 2s delay before retry 1, 4s before retry 2, etc.
+ Max 3 retries with exponential backoff
```

---

### Scenario 4: Successful Login

**User Action**: Enters valid token and clicks login

**Before**:
```
Generic Alert: "Success"
No feedback, unclear what happened
```

**After**:
```
Toast notification (auto-dismiss): "✓ Logged in successfully!"
Status Box: "Ready" (green/checkmark)
App loads message list automatically
```

---

## Message Decryption Scenarios

### Scenario 5: Successful Decryption

**User Action**: Selects encrypted message and clicks "Decrypt"

**Before**:
```
Status: "Decrypting message msg_1234..."
Alert: "Success: Your prompt is here"
Status becomes: 'Decrypted: "Your prompt is here"'
```

**After**:
```
Status: "Decrypting message..." (spinner + text)
After success:
  → Toast: "✓ Message decrypted ✓" (auto-dismiss)
  → Status: "Message decrypted ✓"
  → Message appears in detail view
```

---

### Scenario 6: Decryption Fails - Corrupted Keys

**User Action**: Tries to decrypt but keys are corrupted

**Before**:
```
Alert Title: "Error"
Alert Message: "Failed to decrypt: invalid_key_format"
[Confusing, user doesn't know what to do]
```

**After**:
```
Alert Title: "Decryption Failed"
Alert Message: "Decryption failed. Your keys might be corrupted. Try logging out and in again."
[Retry button available]
+ Status: "Error: Your keys might be corrupted..."
+ User has clear recovery path: logout and login
```

---

### Scenario 7: Network Error During Decryption

**User Action**: Network drops while fetching work order

**Before**:
```
Alert Title: "Error"
Alert Message: "Failed to decrypt: ENOTFOUND relay.server.com"
[Too technical]
```

**After**:
```
Alert Title: "Decryption Failed"
Alert Message: "Can't reach the server. Check your internet connection."
[Retry button available]
+ Automatic retry starts: 2s, 4s, 8s, 16s
+ User can manually click Retry anytime
+ Clear, non-technical message
```

---

## Reply Submission Scenarios

### Scenario 8: User Types Valid Reply

**User Action**: Types a normal reply and watches feedback

**UI Shows**:
```
Reply Input:
"I can help with that. Here's the solution: ..."

Character Counter (below input):
"47/10,000" [Gray text, normal color]

Submit Reply Button: ENABLED (clickable)
```

---

### Scenario 9: User Types Long Reply

**User Action**: Types a very long reply

**As User Types** (real-time feedback):
```
At 1,000 chars:
"1,000/10,000" [Gray text, normal]

At 8,000 chars (80%):
"8,000/10,000" [Orange text, warning color]
Inline message: None (just warning color)

At 10,000+ chars (over limit):
"10,237/10,000" [Red text, error]
Input border: RED (2px border)
Inline message: "Reply is too long (10,237/10,000 chars). Keep it under 10,000 characters."
Submit Reply Button: DISABLED (grayed out)
```

---

### Scenario 10: User Submits Reply Successfully

**User Action**: Types 500 char reply and clicks "Submit Reply"

**Loading Sequence**:
```
1. User clicks Submit Reply
   Status: "Encrypting reply..." (spinner)

2. After encryption completes:
   Status: "Sending reply..." (spinner)

3. After submission succeeds:
   Toast: "✓ Reply sent ✓" (auto-dismiss after 2s)
   Status: "Reply sent"
   Reply input: Clears to empty
   Selected message: Deselected
   Message list: Refreshes, shows "replied" status
```

---

### Scenario 11: Empty Reply Attempt

**User Action**: Clicks Submit Reply without typing anything

**What Happens**:
```
No network call made
Alert Title: "Invalid Reply"
Alert Message: "Reply cannot be empty"
Status: Unchanged
Reply field: Focused, ready for input
```

---

### Scenario 12: Reply Submission Network Fails

**User Action**: Submits reply but network drops mid-upload

**Before**:
```
Alert Title: "Error"
Alert Message: "Failed to submit reply: ECONNREFUSED"
[No help, no retry]
```

**After**:
```
Alert Title: "Send Failed"
Alert Message: "Can't reach the server. Check your internet connection."
[Retry button available]
+ Status: "Error: Can't reach the server..."
+ Manual Retry button: Click to try again
+ Automatic retry: 2s, 4s, 8s delays
+ Reply content: Preserved (not cleared)
+ User can edit and retry
```

---

### Scenario 13: Reply Too Long (Validation)

**User Action**: Copy-pastes a 50,000 character essay and tries to submit

**Validation Happens**:
```
Real-time (as text appears):
- Character counter turns red
- Error message appears: "Reply is too long..."
- Submit button becomes disabled

User tries manual submit click:
- No API call made
- Alert: "Invalid Reply"
- "Reply is too long (50,000/10,000 chars). Keep it under 10,000 characters."
- Reply field stays focused
```

---

## Network Status Scenarios

### Scenario 14: Device Goes Offline

**User Action**: Internet drops while using app

**Current Implementation** (Foundation):
```
Network utility detects offline state
Status box can show: "Checking connection..."
(Future Phase: Offline banner will show)
```

**Retry Behavior**:
```
Active operation (e.g., sending reply):
→ Retry fails
→ Shows: "Can't reach server. Check internet connection."
→ Retry button available
→ Manual retries work when online again
```

**Device Back Online**:
```
Network utility detects reconnection
User clicks Retry button
→ Operation succeeds
→ Success feedback shown
```

---

## Error Type Examples

### Network Errors
```
User sees: "Can't reach the server. Check your internet connection."
Retry button: YES (network errors are retryable)
Auto-retry: YES with exponential backoff
```

### Authentication Errors
```
User sees: "Invalid token format. Use: Bearer github|username|token"
Retry button: NO (auth errors aren't retryable)
Recovery: Re-enter correct token or logout/login
```

### Encryption/Decryption Errors
```
User sees: "Decryption failed. Your keys might be corrupted. Try logging out and in again."
Retry button: NO (crypto errors need key regeneration)
Recovery: Logout and login to regenerate keys
```

### Validation Errors
```
User sees: "Reply is too long (10,542/10,000 chars). Keep it under 10,000 characters."
Retry button: NO (validation isn't retryable)
Recovery: Edit input to be valid
Auto-retry: NO (user must fix input first)
```

---

## Accessibility Features

### Character Counter States

**Normal (0-7,999 chars)**:
```
Color: Gray (#999)
Text: "3,200/10,000"
Visual: Plain text
```

**Warning (8,000-9,999 chars)**:
```
Color: Orange (#FF9500)
Text: "8,500/10,000"
Font: Bold (600 weight)
Visual: Stands out
```

**Error (10,000+ chars)**:
```
Color: Red (#FF3B30)
Text: "10,200/10,000"
Font: Bold (600 weight)
Border: Red input border (2px)
Message: Inline error below counter
Visual: Very clear something is wrong
```

---

## Loading State Examples

### Multi-Step Operations

**Login Flow**:
```
1. "Validating token..."
2. "Generating encryption keys..."
3. "Saving credentials..."
→ Success: "Logged in successfully! ✓"
```

**Reply Flow**:
```
1. "Encrypting reply..."
2. "Sending reply..."
→ Success: "Reply sent ✓"
```

**Decryption Flow**:
```
1. "Decrypting message..."
→ Success: "Message decrypted ✓"
```

---

## Error Recovery Paths

### Scenario A: Network Error During Login
```
1. User sees: "Can't reach server..."
2. Options:
   - Click Retry button (automatic retry)
   - Wait for connection
   - Check internet manually
   - Try different network
3. Click Retry when ready
→ Works or shows same error
→ User can logout and try later
```

### Scenario B: Corrupted Keys
```
1. User sees: "Your keys might be corrupted..."
2. Options:
   - Click Retry button (might help)
   - Logout (clears corrupted keys)
3. User Logout → Login again
4. New keys generated during login
→ Decryption works again
```

### Scenario C: Invalid Token
```
1. User sees: "Invalid token format. Use: Bearer github|username|token"
2. Options:
   - Re-read the format instruction
   - Copy-paste format and fill in values
   - Logout and try different token
3. User enters correct format
4. Retry button appears
→ Login succeeds
```

---

## Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Error Messages | Generic, technical | User-friendly, actionable |
| Network Errors | No retry | Auto-retry with backoff + manual button |
| Validation | Generic "invalid" | Specific feedback + character counter |
| Loading | "Logging in..." | "Validating token..." → "Generating keys..." |
| Success | Alert dialog | Toast notification (auto-dismiss) |
| User Help | None | Retry buttons, format examples |
| Accessibility | Unclear states | Color-coded feedback (gray/orange/red) |
| Recovery | Logout/login | Clear steps shown in errors |

---

## Testing Checklist

Use these scenarios to test the new error handling:

- [ ] Test invalid token format → see specific error
- [ ] Test network error → see retry button and auto-retry
- [ ] Test character counter → see color changes at 80% and 100%
- [ ] Test empty reply → see disabled button
- [ ] Test successful actions → see success toast
- [ ] Test decryption success → see green checkmark toast
- [ ] Test network error during send → see retry functionality
- [ ] Test logout → see success confirmation
- [ ] Test reply > 10k chars → see validation error
- [ ] Test error with retry button → verify retry works
