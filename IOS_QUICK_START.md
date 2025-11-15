# iOS Quick Start - 5 Minute Setup

Get the VOICE Relay app running on iOS simulator in 5 commands. Full setup guide available in [IOS_SETUP.md](./IOS_SETUP.md).

## Requirements

- **macOS** (10.15 or later)
- **Xcode** 14+ (from App Store)
- **Node.js** 16+ (from nodejs.org)
- **CocoaPods** (run: `sudo gem install cocoapods`)

Estimated total setup time: **30-45 minutes** (mostly waiting for downloads)

## 5 Commands to Run

From the project root, run these commands in order:

### 1. Install Node Dependencies

```bash
cd app
npm install
```

Takes: 2-3 minutes

### 2. Install iOS Pods

```bash
cd ../ios
pod install
```

Takes: 5-10 minutes (first time only, downloads native dependencies)

### 3. Return to App Directory

```bash
cd ../app
```

### 4. Start Metro Bundler

```bash
npm run start
```

Leave this terminal open. You should see:
```
Metro has started the development server...
```

Takes: 1 minute

### 5. Build and Run (in new terminal)

```bash
npm run ios:simulator
```

Takes: 5-10 minutes first time, 30-60 seconds subsequent runs

The app should launch in iPhone 14 simulator automatically.

## First Run Checklist

After the app launches:

- [ ] App appears in simulator
- [ ] No red error screen
- [ ] Metro bundler shows "Bundle complete" in terminal
- [ ] Screen is not blank (should show app UI)

## If Something Goes Wrong

### "pod: command not found"

```bash
sudo gem install cocoapods
```

### "No such file or directory: ../ios"

Ensure you're in the `app` directory before running pod install:

```bash
cd app
cd ../ios  # This should work now
```

### "No suitable version of node found"

Install Node.js from [nodejs.org](https://nodejs.org). Requires Node 16 or later.

### App won't launch

Try a clean build:

```bash
# In app directory
npm run ios:clean
npm run ios:pod-install
npm run ios:simulator
```

### Metro bundler won't start

Clear the cache:

```bash
npm run start -- --reset-cache
```

## Next Steps

1. **View app in simulator**:
   - Press `Cmd+1` to show simulator
   - Interact with the app

2. **Make code changes**:
   - Edit files in `src/`
   - Changes auto-reload (Hot Reload)
   - Check Metro bundler terminal for errors

3. **Debug the app**:
   - Press `Cmd+D` in simulator to open developer menu
   - Select "Debug"
   - Browser console appears with logs

4. **Test on different simulator**:

```bash
npm run ios:simulator -- --simulator='iPhone 15 Pro'
```

Available: iPhone 14, iPhone 14 Pro, iPhone 15, iPhone 15 Pro, iPad (various models)

5. **Build for real device**:

See [IOS_SETUP.md](./IOS_SETUP.md) section "Building for Device"

## Common Commands

```bash
# Start from scratch
npm run ios:clean && npm run ios:pod-install && npm run ios:simulator

# Just rebuild the app (Metro must be running)
npm run ios:simulator

# Clean pods and reinstall
npm run ios:pod-install

# Run tests
npm run test:all

# Check for TypeScript errors
npm run test:types

# Check for linting errors
npm run test:lint
```

## Useful Keyboard Shortcuts (Simulator)

| Shortcut | Action |
|----------|--------|
| Cmd+D | Developer menu |
| Cmd+R | Reload app |
| Cmd+M | Toggle hardware menu |
| Cmd+1 | iPhone |
| Cmd+2 | Apple Watch |
| Cmd+H | Home |
| Cmd+L | Lock screen |

## Development Workflow

1. **Terminal 1** - Start Metro bundler:
```bash
npm run start
```

2. **Terminal 2** - Build and run once:
```bash
npm run ios:simulator
```

3. **Terminal 3** - Make code changes in your editor
   - Changes auto-reload in simulator
   - Check Terminal 1 for errors

4. **Debug as needed**:
   - Cmd+D in simulator for dev menu
   - Select "Debug" to open Chrome DevTools

## Uninstall / Start Over

To completely clean up and start fresh:

```bash
# Remove everything
cd app
rm -rf node_modules
npm install

# Clean iOS
npm run ios:clean
npm run ios:pod-install

# Verify setup
npm run test:types

# Run
npm run ios:simulator
```

## Performance Tips

- **Slow startup?** First build is slow. Subsequent runs are 30-60 seconds.
- **Hot reload not working?** Press Cmd+D and toggle "Fast Refresh"
- **Memory issues?** Restart simulator (Cmd+Q, then relaunch)
- **Slow Metro?** Run `npm run start -- --reset-cache`

## Estimated Timeline

| Task | Time | Notes |
|------|------|-------|
| Prerequisites install | 30-60 min | Download Node.js, Xcode, CocoaPods |
| npm install | 2-3 min | Install JavaScript dependencies |
| pod install | 5-10 min | Install native dependencies |
| Metro start | 1 min | Start development server |
| Build & run | 5-10 min | First build is slower |
| **Total** | **30-45 min** | Subsequent builds: 1 minute |

## Get Help

1. **Installation issues?** See [IOS_SETUP.md](./IOS_SETUP.md)
2. **Build for production?** See [docs/IOS_BUILD_GUIDE.md](./docs/IOS_BUILD_GUIDE.md)
3. **Platform questions?** See [PLATFORM_COMPARISON.md](./PLATFORM_COMPARISON.md)
4. **JavaScript errors?** Check Metro bundler terminal
5. **Native errors?** Check Xcode console output

## Useful Links

- [React Native iOS Guide](https://reactnative.dev/docs/native-modules-ios)
- [Xcode Help](https://developer.apple.com/documentation/xcode)
- [CocoaPods Guide](https://guides.cocoapods.org)
- [Apple Developer](https://developer.apple.com)

---

**You're ready to develop!** After these 5 commands run successfully, the app is running and you can start making code changes. Changes to JavaScript files will hot-reload automatically.
