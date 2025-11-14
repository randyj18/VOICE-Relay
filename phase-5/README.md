# Phase 5: Monetization (100-Prompt Free Tier)

## Overview

Phase 5 implements the monetization layer for VOICE Relay. Users get 100 free prompts per month (30-day rolling window), with automatic monthly reset. When users reach their limit, they're prompted to upgrade via Ko-fi support link. All tracking is local on the device—server never sees usage data.

**Core Features**:
- ✓ Track messages sent per month (rolling 30-day window)
- ✓ Automatic monthly reset after 30 days
- ✓ Display usage in Settings (X / 100)
- ✓ Warning at 80%+ usage
- ✓ Block reply submission when limit exceeded
- ✓ Show upgrade prompt (Ko-fi link)

---

## Architecture

### Usage Tracking Flow

```
1. User composes reply in MessageDetailScreen
   ↓
2. Check SettingsService.isLimitExceeded()
   ↓
3. If exceeded:
   - Show "Limit Reached" alert
   - Offer "Upgrade on Ko-fi" button
   - Prevent submission
   ↓
4. If allowed:
   - Submit reply (MessageService.submitReply)
   - Increment counter (SettingsService.incrementMessageUsage)
   - Show success
   ↓
5. Display in SettingsScreen
   - "X / 100 messages sent this month"
   - Warning color at 80%+
   - Red alert at 100%
```

### Monthly Reset Logic

```
Every time SettingsService methods are called:
1. Check messages_reset_date in settings
2. If 30+ days have passed:
   - Reset messages_used to 0
   - Update messages_reset_date to now
   - User gets fresh 100 prompts
```

---

## Data Structure

### Updated AppSettings Type

```typescript
export interface AppSettings {
  auto_send: boolean;
  relay_url: string;
  relay_timeout_ms: number;
  messages_limit: number;
  messages_used?: number; // NEW: Track messages sent this month
  messages_reset_date?: number; // NEW: Unix timestamp of last reset
}
```

### Storage

- **Key**: `@voice_relay:settings` (AsyncStorage)
- **Contents**: JSON serialized AppSettings
- **Cleared on logout**: Yes

---

## Implementation Details

### SecureStorage Usage Methods

```typescript
// Increment message usage counter
static async incrementMessageUsage(): Promise<number>

// Reset monthly usage (called automatically)
static async resetMonthlyUsage(): Promise<void>

// Check if 30+ days have passed, auto-reset if needed
static async checkAndResetIfNeeded(): Promise<boolean>
```

### SettingsService Usage Methods

```typescript
// Increment usage (called after successful reply)
static async incrementMessageUsage(): Promise<number>

// Check if limit exceeded (with auto-reset)
static async isLimitExceeded(): Promise<boolean>

// Get usage percentage 0-100 (with auto-reset)
static async getUsagePercentage(): Promise<number>

// Get remaining messages (with auto-reset)
static async getRemainingMessages(): Promise<number>

// Get messages used (with auto-reset)
static async getMessagesUsed(): Promise<number>
```

---

## UI/UX Integration

### MessageDetailScreen

**Before Sending Reply**:
```typescript
// Check limit before submission
const limitExceeded = await SettingsService.isLimitExceeded();
if (limitExceeded) {
  Alert.alert(
    'Free Tier Limit Reached',
    'You have reached your monthly message limit (100 prompts). Upgrade to continue!',
    [
      { text: 'Upgrade on Ko-fi', onPress: () => {...} },
      { text: 'OK', style: 'cancel' },
    ]
  );
  return;
}
```

**Success Flow**:
- MessageService.submitReply() sends reply
- SettingsService.incrementMessageUsage() increments counter
- Alert shows "Reply sent!"

### SettingsScreen

**Usage Section** displays:
- **Sent This Month**: Current count (e.g., "42")
- **Free Tier**: "42 / 100"
- **Warning at 80%+**: Orange box with "⚠️ You're using 85% of your free tier. Upgrade soon!"
- **Alert at 100%**: Red box with "[LIMIT REACHED] Monthly message limit reached. Upgrade to continue!"

---

## Monthly Reset Behavior

**When Reset Occurs**:
1. User opens any Settings screen
2. SettingsService method checks `messages_reset_date`
3. If 30+ days have passed:
   - `messages_used` → 0
   - `messages_reset_date` → now
   - Automatic save to SecureStorage
4. User gets fresh 100 prompts

**Example**:
- Day 1: Send 50 messages (messages_used = 50)
- Day 20: Check settings (no reset, still 50/100)
- Day 31: Check settings (30 days passed → auto-reset to 0/100)
- User can send 100 more prompts

---

## Security & Privacy

### No Server Tracking
- Usage count ONLY stored locally on device
- Server never sees or stores usage data
- Each device tracks independently
- No enforcement at API level (trusted client model)

### Data Integrity
- Usage is stored in SecureStorage (AsyncStorage in Phase 2)
- Persists across app restarts
- Cleared when user logs out
- Manually resettable via reset monthly method

---

## Testing Checklist

- ✓ Send 100 messages, verify limit blocks 101st
- ✓ Wait 30 days (or mock timestamp), verify auto-reset
- ✓ Check SettingsScreen shows correct usage percentage
- ✓ Verify warning appears at 80%+
- ✓ Verify red alert appears at 100%
- ✓ Verify Ko-fi upgrade link shown when limit hit
- ✓ Verify usage persists across app restart
- ✓ Verify usage cleared on logout

---

## Code Changes Summary

### Files Modified

1. **types/index.ts**
   - Added `messages_used` and `messages_reset_date` to AppSettings

2. **storage/secureStorage.ts**
   - `incrementMessageUsage()`: Increment counter in settings
   - `resetMonthlyUsage()`: Reset to 0 and update date
   - `checkAndResetIfNeeded()`: Auto-reset if 30 days passed

3. **services/settingsService.ts**
   - `incrementMessageUsage()`: Wrapper for SecureStorage
   - `isLimitExceeded()`: Check and reset, then validate
   - `getUsagePercentage()`: Return 0-100 percentage
   - `getRemainingMessages()`: Return limit - used
   - `getMessagesUsed()`: Return current count

4. **services/messageService.ts**
   - Import SettingsService
   - In `submitReply()`: Call `SettingsService.incrementMessageUsage()` after success

5. **screens/MessageDetailScreen.tsx**
   - Import SettingsService
   - In `handleSubmitReply()`: Check `isLimitExceeded()` before sending
   - Show limit alert if exceeded

6. **screens/SettingsScreen.tsx**
   - Load usage via `getMessagesUsed()` and `getUsagePercentage()`
   - Display "Sent This Month" instead of message queue count
   - Show warnings at 80%+ and 100%

---

## Future Enhancements

### Server-Side Monetization
- Validate usage server-side (trusted server source of truth)
- Tie usage to GitHub account / subscription tier
- Implement premium tier (500 messages / month)
- Payment processing via Ko-fi webhook

### Usage Analytics
- Track usage patterns by topic
- Show graphs / charts in SettingsScreen
- Export usage reports

### Multiple Tiers
- Free: 100 messages/month
- Pro: 1000 messages/month ($5/month)
- Enterprise: Unlimited

### In-App Purchases
- Integrate with App Store / Play Store IAP
- One-time purchases: "+50 messages"
- Subscription management

---

## North Star Alignment

✓ **Simplicity**: Single limit (100) per month, no complex tiers
✓ **Speed**: No network calls for usage check (local only)
✓ **Security**: Usage only on device, server never sees it

---

## Files in Phase 5

```
phase-5/
└── README.md (This file - Monetization documentation)

Modified Files:
phase-2/app/src/
├── types/index.ts (AppSettings with usage fields)
├── storage/secureStorage.ts (Usage methods)
├── services/
│   ├── settingsService.ts (Usage tracking API)
│   └── messageService.ts (Increment on reply)
└── screens/
    ├── MessageDetailScreen.tsx (Check limit before send)
    └── SettingsScreen.tsx (Display usage)
```

---

**Status**: Phase 5 Complete - Monetization ready for production

All 5 phases implemented. VOICE Relay is feature-complete and production-ready.
