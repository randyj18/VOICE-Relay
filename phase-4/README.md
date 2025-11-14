# Phase 4: Visual UI Mode (Topics/Queues)

## Overview

Phase 4 transforms VOICE Relay from a single-screen app into a **complete multi-screen application** with intuitive navigation and message organization. Users can now browse topics, view message queues, and manage replies through a polished visual interface.

**Core Features**:
- ✓ Home screen with topics list
- ✓ Topics organized with unread counts
- ✓ Message queue view (all prompts for a topic)
- ✓ Message detail screen (decrypt, compose reply, send)
- ✓ Settings panel (configure, view usage, support link)
- ✓ Smooth navigation between screens
- ✓ Message status indicators

---

## Screen Architecture

### 1. Login Screen (Existing from Phase 2)
User authenticates with GitHub token
- Generates permanent RSA key pair
- Stores token and keys securely
- Initializes API connection

### 2. Home Screen (NEW)
**Purpose**: Main dashboard showing topics and quick actions

**Content**:
- Title: "VOICE Relay"
- Subtitle: Total message count
- Prominent: "🎤 Start Voice Mode" button
- Topics list with unread count badges
- Settings button
- Info box explaining how it works

**Interactions**:
- Tap topic → Open Message Queue
- Tap Voice Mode → Enter hands-free mode
- Tap Settings → Open settings panel

**Visual**:
```
┌─────────────────────────┐
│ VOICE Relay             │
│ 15 messages             │
├─────────────────────────┤
│                         │
│ [🎤 Start Voice Mode]   │
│                         │
│ Topics (3)              │
│                         │
│ ┌─────────────────────┐ │
│ │ Project Phoenix   (3)│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Jira Incidents    (5)│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Weekly Updates    (7)│ │
│ └─────────────────────┘ │
│                         │
│ [⚙️ Settings]           │
└─────────────────────────┘
```

### 3. Message Queue Screen (NEW)
**Purpose**: Display all messages for a selected topic

**Content**:
- Back button
- Topic name with message count
- List of messages with:
  - Message number
  - Prompt preview (truncated)
  - Time received
  - Status badge (🔐 Encrypted, 📖 Decrypted, ✓ Sent, ❌ Error)

**Interactions**:
- Tap message → Open Message Detail
- Tap back → Return to Home

**Visual**:
```
┌────────────────────────────┐
│ ← Back  Project Phoenix    │
│         5 messages         │
├────────────────────────────┤
│                            │
│ 1. Tell me about Q3 sales  │
│    3:45 PM  [🔐 Encrypted] │
│                            │
│ 2. How's the team morale?  │
│    3:52 PM  [📖 Decrypted] │
│                            │
│ 3. Budget review summary   │
│    4:01 PM  [✓ Sent]       │
│                            │
│ 4. Next quarter planning   │
│    4:15 PM  [❌ Error]     │
│                            │
│ 5. Customer feedback notes │
│    4:28 PM  [📖 Decrypted] │
│                            │
└────────────────────────────┘
```

### 4. Message Detail Screen (NEW)
**Purpose**: View single message with reply composition

**Content**:
- Back button
- Topic name
- Message status (Pending Reply / ✓ Sent)
- Created timestamp
- **Prompt section**: Full prompt text
- **Reply section**: Text input for reply (if not already sent)
- Security info: E2EE explanation
- If already replied: Success message

**Interactions**:
- Type reply in text area
- Tap "Send Reply" to encrypt and submit
- Tap back to return to queue

**Visual**:
```
┌──────────────────────────────┐
│ ← Back  Project Phoenix      │
├──────────────────────────────┤
│                              │
│ Status: 📖 Pending Reply     │
│ Created: Nov 14, 2025 3:45PM │
│                              │
│ ┌────────────────────────┐   │
│ │ Prompt                 │   │
│ │                        │   │
│ │ Tell me about Q3       │   │
│ │ sales performance      │   │
│ │ and growth            │   │
│ │ trajectory            │   │
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ Your Reply             │   │
│ │                        │   │
│ │ [Text input area]      │   │
│ │ [Multiple lines]       │   │
│ │                        │   │
│ └────────────────────────┘   │
│                              │
│ [Send Reply]                 │
│                              │
│ 🔒 End-to-End Encrypted      │
│ Your reply is encrypted with │
│ a unique key before sending. │
│                              │
└──────────────────────────────┘
```

### 5. Voice Mode Screen (From Phase 3)
Hands-free conversation interface
- Speak prompt aloud (TTS)
- Listen for reply (STT)
- Auto-send or manual confirmation
- Real-time transcript display

### 6. Settings Screen (NEW)
**Purpose**: Configuration and information

**Sections**:
1. **Voice Mode**:
   - Toggle auto-send on/off
   - Description of what it does

2. **Usage Statistics**:
   - Messages count
   - Free tier usage (X / 100)
   - Warning if >80% usage

3. **Server**:
   - Relay URL
   - Connection timeout

4. **About**:
   - App name and version
   - Description
   - Privacy explanation

5. **Support**:
   - "❤️ Support Developer" button (Ko-fi link)

6. **Privacy & Security**:
   - Bullet points explaining E2EE
   - Key storage on device
   - No server storage of plaintext
   - One-time keys per reply

7. **Account**:
   - Logout button

**Visual**:
```
┌──────────────────────────┐
│ ← Back  Settings         │
├──────────────────────────┤
│                          │
│ Voice Mode               │
│ ┌────────────────────┐   │
│ │ Auto-Send      [●] │   │
│ │ Send after 2s...   │   │
│ └────────────────────┘   │
│                          │
│ Usage                    │
│ Messages:  15            │
│ Free Tier: 85 / 100      │
│                          │
│ Server                   │
│ URL: https://...         │
│ Timeout: 30000ms         │
│                          │
│ [❤️ Support Developer]   │
│                          │
│ [Logout]                 │
│                          │
└──────────────────────────┘
```

---

## Navigation Service

Simple state-based navigation without heavy library dependencies:

```typescript
// Navigate to screen with params
navigationService.navigate(AppScreen.MESSAGE_QUEUE, { topicName: 'Project Phoenix' });

// Get current screen
const current = navigationService.getCurrentScreen();

// Get params for current screen
const params = navigationService.getParams();

// Go back
navigationService.back();

// Listen for navigation changes
navigationService.onNavigate((screen, params) => {
  console.log(`Navigated to ${screen}`, params);
});
```

---

## Multi-Screen Flow

### Complete User Journey

```
1. APP LAUNCH
   ↓
2. CHECK AUTHENTICATION
   ├─ If not authenticated: Show Login Screen
   └─ If authenticated: Show Home Screen
   ↓
3. HOME SCREEN
   ├─ Option: Tap "Start Voice Mode" → Voice Mode Screen
   ├─ Option: Tap topic → Message Queue Screen
   └─ Option: Tap "Settings" → Settings Screen
   ↓
4. MESSAGE QUEUE SCREEN
   ├─ Show all messages for selected topic
   ├─ Tap message → Message Detail Screen
   └─ Tap back → Return to Home
   ↓
5. MESSAGE DETAIL SCREEN
   ├─ Display prompt
   ├─ Compose and send reply (encrypted)
   ├─ Show success message
   └─ Tap back → Return to Queue
   ↓
6. VOICE MODE SCREEN
   ├─ Load all decrypted messages
   ├─ For each message:
   │   ├─ Speak prompt (TTS)
   │   ├─ Listen for reply (STT)
   │   ├─ Encrypt and send
   │   └─ Move to next
   └─ Exit back to Home
   ↓
7. SETTINGS SCREEN
   ├─ View/edit settings
   ├─ Check usage statistics
   ├─ Support developer link
   └─ Logout
```

---

## Screen Routing

| Screen | Route | Params | From | To |
|--------|-------|--------|------|-----|
| Login | `login` | - | App Init | Home |
| Home | `home` | - | Login, Any screen | Topics, Voice, Settings |
| Message Queue | `message_queue` | `topicName` | Home | Message Detail, Home |
| Message Detail | `message_detail` | `messageId` | Queue | Queue, Home |
| Voice Mode | `voice_mode` | - | Home | Home |
| Settings | `settings` | - | Home | Home |

---

## Implementation Details

### HomeScreen
- Loads topics from message queue
- Groups messages by topic
- Shows unread count per topic
- Sorted by unread (descending)

### MessageQueueScreen
- Filters messages by topic
- Shows status badges with colors
- Sorts by creation time
- Displays message preview

### MessageDetailScreen
- Loads single message
- Auto-decrypts if needed
- Shows full prompt
- Compose and send reply
- Shows success state

### SettingsScreen
- Loads current settings via SettingsService
- Toggle auto-send
- Display usage (current / limit)
- Warning if >80% usage
- Ko-fi support link
- Logout confirmation

---

## Code Structure

### New Services
```
src/services/
├── navigationService.ts (NEW - Screen routing)
```

### New Screens
```
src/screens/
├── HomeScreen.tsx (NEW - Topics list)
├── MessageQueueScreen.tsx (NEW - Messages for topic)
├── MessageDetailScreen.tsx (NEW - Single message detail)
├── SettingsScreen.tsx (NEW - Settings panel)
├── VoiceModeScreen.tsx (Phase 3 - Hands-free mode)
└── LoginScreen.tsx (Phase 2 - Auth)
```

### Main App
```
src/
├── AppMultiScreen.tsx (NEW - Multi-screen router)
└── App.tsx (Original - Single screen version)
```

---

## UI/UX Details

### Status Badges
- 🔐 **Encrypted**: Blue - Message received, not yet decrypted
- 📖 **Decrypted**: Orange - Decrypted, waiting for reply
- ✓ **Sent**: Green - Reply sent successfully
- ❌ **Error**: Red - Decryption or sending failed

### Unread Count
- Red badge in top-right corner of topic
- Shows number of encrypted/decrypted messages
- Disappears when all replied

### Visual Hierarchy
- Large titles (Home, topic name)
- Subtle subtitles (message counts)
- Color-coded status
- Clear call-to-action buttons
- Ample whitespace

### Interactions
- Tap target: minimum 44x44 pts (accessibility)
- Smooth transitions between screens
- Back button on every screen
- Loading indicators during async operations
- Alert dialogs for errors/confirmations

---

## Testing Checklist

- ✓ Navigate Home → Topics → Queue → Detail
- ✓ Compose and send reply from detail screen
- ✓ Navigate back from any screen
- ✓ Start voice mode from home
- ✓ Open settings panel
- ✓ Toggle auto-send setting
- ✓ View usage statistics
- ✓ Logout and return to login
- ✓ Test with multiple topics
- ✓ Test with various message statuses
- ✓ Error handling (network, decryption)
- ✓ Loading states during operations

---

## Files Added in Phase 4

```
phase-2/app/src/
├── services/
│   └── navigationService.ts (NEW - Routing)
├── screens/
│   ├── HomeScreen.tsx (NEW - Topics)
│   ├── MessageQueueScreen.tsx (NEW - Queue)
│   ├── MessageDetailScreen.tsx (NEW - Detail)
│   └── SettingsScreen.tsx (NEW - Settings)
└── AppMultiScreen.tsx (NEW - Multi-screen router)

phase-4/
└── README.md (This file)
```

---

## Performance Considerations

- **Lazy loading**: Load messages only when entering queue
- **Memoization**: Use React.memo for list items
- **Async operations**: Load topics in background
- **Storage**: Cache message list in SecureStorage
- **Rendering**: Only render visible items in lists

---

## Accessibility

- Minimum 44x44 tap targets
- Clear color contrast (WCAG AA)
- Descriptive button labels
- Text size scaling support
- Touch-friendly inputs

---

## Future Enhancements

- Search/filter messages
- Favorite topics
- Message archive
- Keyboard shortcuts
- Dark mode
- Custom themes
- Offline mode (sync when online)

---

**Status**: Phase 4 Complete - Ready for Phase 5 (Monetization)
