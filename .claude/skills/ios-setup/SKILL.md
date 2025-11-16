---
name: ios-setup
description: Setting up and deploying VOICE Relay iOS application including Xcode configuration, CocoaPods installation, simulator testing, and troubleshooting iOS build issues. Use when building iOS, running on simulator, or debugging iOS-specific problems.
version: 1.0.0
allowed-tools: ["Bash", "Read", "Write", "Edit", "Grep"]
dependencies: []
---

# iOS Setup - VOICE Relay

Get the VOICE Relay app running on iOS simulator in 5 commands.

## Prerequisites

Before starting, ensure you have:
- **macOS** 10.15 or later
- **Xcode** 14+ (from App Store)
- **Node.js** 16+ (from nodejs.org)
- **CocoaPods**: Install with `sudo gem install cocoapods`

**Estimated setup time**: 30-45 minutes (mostly downloads)

## Quick Start (5 Commands)

From the project root:

### 1. Install Node Dependencies
```bash
cd app
npm install
```
Takes: 2-3 minutes

### 2. Install iOS Pods
```bash
cd ios
pod install
cd ..
```
Takes: 5-10 minutes (first time, downloads native dependencies)

### 3. Start Metro Bundler
```bash
npm run start
```
Leave this terminal open. Wait for: "Metro has started the development server..."

### 4. Build and Run (new terminal)
```bash
npm run ios:simulator
```
Takes: 5-10 minutes first time, 30-60 seconds subsequent runs

The app should launch in iPhone 14 simulator automatically.

## Common Commands

```bash
# Clean build
npm run ios:clean && npm run ios:pod-install && npm run ios:simulator

# Rebuild app (Metro must be running)
npm run ios:simulator

# Reinstall pods
npm run ios:pod-install

# Run on specific simulator
npm run ios:simulator -- --simulator='iPhone 15 Pro'

# Run tests
npm run test:all

# Check TypeScript
npm run test:types

# Check linting
npm run test:lint
```

## Troubleshooting

### "pod: command not found"
```bash
sudo gem install cocoapods
```

### "No suitable version of node found"
Install Node.js from https://nodejs.org (requires Node 16+)

### App won't launch
Try a clean build:
```bash
npm run ios:clean
npm run ios:pod-install
npm run ios:simulator
```

### Metro bundler won't start
Clear the cache:
```bash
npm run start -- --reset-cache
```

### Slow startup
- First build is slow (5-10 min)
- Subsequent runs: 30-60 seconds
- Hot reload not working? Press Cmd+D in simulator, toggle "Fast Refresh"

### Memory issues
Restart simulator: Cmd+Q, then relaunch

## Simulator Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+D | Developer menu |
| Cmd+R | Reload app |
| Cmd+M | Toggle hardware menu |
| Cmd+H | Home |
| Cmd+L | Lock screen |

## Development Workflow

1. **Terminal 1** - Metro bundler: `npm run start`
2. **Terminal 2** - Build once: `npm run ios:simulator`
3. **Editor** - Make code changes (auto-reload in simulator)
4. **Debug** - Cmd+D in simulator for dev menu

## Verification Checklist

After first run:
- [ ] App appears in simulator
- [ ] No red error screen
- [ ] Metro bundler shows "Bundle complete"
- [ ] Screen is not blank (shows app UI)

## Complete Reset

To start fresh:
```bash
cd app
rm -rf node_modules ios/Pods
npm install
npm run ios:clean
npm run ios:pod-install
npm run test:types
npm run ios:simulator
```

## Performance Tips

- **Slow Metro?** Run `npm run start -- --reset-cache`
- **Hot reload issues?** Toggle "Fast Refresh" in dev menu (Cmd+D)
- **Simulator lag?** Restart simulator

## Timeline Estimates

| Task | Time | Notes |
|------|------|-------|
| Install prerequisites | 30-60 min | Xcode, Node.js, CocoaPods |
| npm install | 2-3 min | JavaScript dependencies |
| pod install | 5-10 min | Native dependencies |
| Metro start | 1 min | Development server |
| First build | 5-10 min | Slower first time |
| Subsequent builds | 30-60 sec | Much faster |

## When to Invoke This Skill

- Setting up iOS development environment
- Building app for iOS simulator
- Troubleshooting iOS build issues
- Running iOS tests
- Debugging simulator problems
- Resetting iOS environment
