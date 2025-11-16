# 🚀 START HERE - Claude Code on the Web

Welcome! You're taking over the VOICE Relay project. This file gets you started in 5 minutes.

---

## What Is This Project?

**VOICE Relay** - A voice conversation relay app (Voice Operated Interface for Context Engines)

**Status**: 95% complete, blocked by 1 runtime error

**Your Job**: Fix the error and complete Phase 2

---

## 5-Minute Startup

### 1. Read the North Star (2 min)
```bash
cat CLAUDE.md
```

This tells you WHY you're doing everything. Read it first!

Key: "Be the fastest, simplest, most secure relay for voice conversation."

### 2. Understand Current Status (2 min)
```bash
cat HANDOFF_SUMMARY.md
```

Quick overview of:
- What works ✅
- What doesn't ❌
- What's your job

### 3. Run Verification (1 min)
```bash
./scripts/verify_all.sh
```

This checks if everything is in order. Should see mostly green ✅.

---

## The Problem You're Solving

**Status**: App builds perfectly. App crashes on startup.

**Your Goal**: Make it start without crashing.

**How**: Add logging, find error, fix it.

---

## The Tools You Have

### Build & Test
```bash
cd app

# Check types
npm run test:types

# Check code quality
npm run test:lint

# Build APK
npm run test:build

# Run all checks
npm run test:all

# Run unit tests
npm test
```

### Test Backend (without device)
```bash
python3 ../scripts/test_backend.py
```

This verifies the backend works. Useful for debugging API issues.

### Verify Everything
```bash
../scripts/verify_all.sh
```

One command, comprehensive check.

---

## The First Thing To Do

1. **Read the error screenshot**
   - Where is it stored?
   - What exactly does it say?
   - Can you see what line of code crashed?

2. **Add logging to find the problem**
   ```typescript
   // app/src/App.tsx
   console.log('App starting...');
   console.log('Loading services...');
   // ... add logs everywhere
   ```

3. **Build and see where logging stops**
   ```bash
   npm run test:build
   # Check output for where logs stop
   ```

4. **Fix the line that crashed**

That's it. You've fixed Phase 2.

---

## Project Structure

```
VOICE-Relay/
├── CLAUDE.md                    ← Read first (North Star)
├── HANDOFF_SUMMARY.md           ← Quick overview
├── CLAUDE_CODE_HANDOFF.md       ← Detailed docs
├── SESSION_SUMMARY.txt          ← What happened this session
├── START_HERE.md                ← You are here

├── app/                         ← React Native app
│   ├── src/
│   │   ├── App.tsx              ← Main component (probably has error)
│   │   ├── services/
│   │   │   ├── authService.ts   ← Backend communication
│   │   │   └── api.ts           ← API client
│   ├── babel.config.js          ← Babel config (FIXED - don't break!)
│   ├── metro.config.js          ← Metro bundler
│   ├── android/
│   │   ├── app/build.gradle     ← Android build (debuggableVariants = [])
│   │   └── gradlew              ← Gradle wrapper
│   └── package.json             ← Dependencies & scripts

├── backend/                     ← FastAPI backend
│   ├── main_production.py       ← Replit deployment
│   └── requirements.txt

├── scripts/                     ← Testing tools
│   ├── verify_all.sh            ← One-command verification
│   ├── test_backend.py          ← Backend testing without device
│   └── README.md                ← How to use scripts

└── .git/
    └── hooks/
        └── pre-commit           ← North Star enforcement
```

---

## Important Files You'll Edit

### Top Priority
- **app/src/App.tsx** - Main component, probably where error is
- **app/src/services/authService.ts** - If API connection fails
- **app/babel.config.js** - CRITICAL: Don't break this (has Flow fix)

### Configuration
- **app/package.json** - Dependencies and scripts
- **app/android/app/build.gradle** - Android build settings

### Don't Touch (They Work)
- **backend/main_production.py** - Backend works fine
- **.git/hooks/pre-commit** - This enforces standards, respect it

---

## Common Tasks

### Build the App
```bash
cd app && npm run test:build
```

### Check for Errors
```bash
cd app && npm run test:all
```

### Test API
```bash
python3 scripts/test_backend.py
```

### Run Tests
```bash
cd app && npm test
```

### Commit Changes
```bash
git add .
git commit -m "Your detailed message here"
git push origin master
```

The pre-commit hook will check your changes. Answer yes to continue.

---

## What's Blocking Phase 2?

**1 Runtime Error** on app startup

Could be:
- Missing import
- Undefined variable
- Wrong API URL
- React Native module issue
- Improper lifecycle

**How to find it**:
1. Add `console.log` everywhere in App.tsx
2. Rebuild and look for where logging stops
3. That's your error
4. Fix it

---

## What You Can Do

✅ Edit files
✅ Build APKs
✅ Run tests
✅ Commit changes
✅ Test backend
✅ Check code quality

❌ Test on physical device
❌ See visual rendering
❌ Test voice features
❌ See real-time UI

**This is OK because:** Phase 2 is mostly logic (API, encryption, state). Those can be tested without a device.

---

## What's Next After Phase 2?

Once the runtime error is fixed:

**Phase 3**: Voice integration
- Add voice libraries
- Implement speech-to-text
- Implement text-to-speech
- Create voice loop

**Phase 4**: UI Polish
- Make it look nice
- Add animations
- Improve UX

**Phase 5**: Monetization
- Implement 100-prompt limit
- Add payment system

But first: **Fix Phase 2**

---

## If You Get Stuck

1. **Check the error screenshot**: What does it say?
2. **Read CLAUDE_CODE_HANDOFF.md**: Detailed explanations
3. **Run verify_all.sh**: See if something is broken
4. **Test backend**: `python3 scripts/test_backend.py`
5. **Check logs**: Add more `console.log` statements

---

## Key Principle: North Star

Before making ANY change, ask:
1. Does this help fix the error?
2. Is this the simplest solution?
3. Am I adding bloat?

If you're adding features that aren't necessary, STOP. That violates the North Star.

---

## You're Ready!

You have:
- ✅ Solid infrastructure
- ✅ Working backend
- ✅ Working build system
- ✅ Testing tools
- ✅ Clear documentation
- ✅ One specific goal: Fix the app

Go fix that error. You got this! 💪

---

## Quick Links

| Document | Purpose |
|----------|---------|
| CLAUDE.md | Core principles (North Star) |
| HANDOFF_SUMMARY.md | Quick overview |
| CLAUDE_CODE_HANDOFF.md | Detailed context |
| SESSION_SUMMARY.txt | What happened this session |
| scripts/README.md | How to use test scripts |

All pushed to GitHub: https://github.com/randyj18/VOICE-Relay

---

**Next Step**: Read CLAUDE.md, then run `./scripts/verify_all.sh`

Good luck! 🚀
