# iOS Setup Guide

This guide covers setting up the VOICE Relay app for iOS development. iOS development requires macOS and Xcode.

## Prerequisites

Before starting iOS development, ensure you have:

- **macOS** (10.15 or later recommended)
- **Xcode** (14.0 or later) - Install from the App Store
- **CocoaPods** (1.11 or later)
  ```bash
  sudo gem install cocoapods
  ```
- **Node.js** (16 or later) and npm
- **React Native CLI**
  ```bash
  npm install -g react-native-cli
  ```

## First-Time Setup

### 1. Install Dependencies

From the project root:

```bash
# Install npm dependencies
cd app
npm install

# Return to project root
cd ..
```

### 2. Install iOS Pods

CocoaPods manages native iOS dependencies:

```bash
# Navigate to iOS directory
cd ios

# Install dependencies
pod install

# Return to app directory
cd ../app
```

**Note:** If you encounter pod install issues:
- Delete `Podfile.lock` and try again
- Run `pod repo update` to update pod specs
- Ensure you're using a compatible version of Ruby (2.7 or later)

### 3. Verify Setup

Test that everything is configured correctly:

```bash
# From app directory
npm run test:types  # Should pass with no TypeScript errors
npm run test:lint   # Should pass with no linting issues
```

## Building for Simulator

### Default Simulator (iPhone 14)

```bash
npm run ios:simulator
```

This will:
- Start the Metro bundler
- Build the app
- Launch the simulator with the app

### Alternative Simulators

To run on a specific simulator:

```bash
# List available simulators
xcrun simctl list devices available

# Run on specific device
react-native run-ios --simulator='iPhone 15 Pro'
```

Common simulators:
- `iPhone 14`
- `iPhone 14 Pro`
- `iPhone 15`
- `iPhone 15 Pro`

## Building for Device

### Prerequisites

- An Apple Developer account ($99/year)
- An iOS device running the same OS version as Xcode (or newer)
- USB cable to connect device

### Steps

1. **Connect Device**: Plug in your iOS device via USB

2. **Open Xcode Project**:
   ```bash
   open ios/VoiceRelay.xcworkspace
   ```
   (Note: Always use `.xcworkspace`, not `.xcodeproj`)

3. **Configure Code Signing**:
   - Select "VoiceRelay" in the left panel
   - Select "VoiceRelay" target
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team
   - Xcode will automatically create a provisioning profile

4. **Build and Run**:
   ```bash
   npm run ios:device
   ```

   Or from Xcode:
   - Select your device from the device menu (top of window)
   - Press Cmd+R to build and run

## Development Workflow

### Watch Mode

Keep the Metro bundler running while developing:

```bash
npm run start
```

Then, in another terminal, build the app:

```bash
npm run ios:simulator
```

The app will reload when you save changes to JavaScript files.

### Debugging

#### React Native Debugger

Install React Native Debugger:
```bash
brew install react-native-debugger
```

In the app, press `Cmd+D` (simulator) or shake the device to open the Dev Menu, then select "Debug with Chrome".

#### Xcode Debugger

For native code issues:
1. Open `ios/VoiceRelay.xcworkspace`
2. Select the scheme (top of window)
3. Press the play button to build and run
4. Use Xcode's standard debugging tools

#### Console Logs

View logs from simulator:
```bash
# In another terminal
xcrun simctl spawn booted log stream --predicate 'process == "VoiceRelay"'
```

## Cleaning Build Cache

Clean builds are sometimes necessary:

```bash
# Clean Xcode build folder
npm run ios:clean

# Reinstall pods
npm run ios:pod-install

# Full clean
npm run ios:clean && npm run ios:pod-install && npm run ios:simulator
```

## Common Issues

### Issue: "Pod install" fails

**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ../app
```

### Issue: "Command PhaseScriptExecution failed with a nonzero exit code"

**Solution:**
1. Open `ios/VoiceRelay.xcworkspace`
2. Select "VoiceRelay" target
3. Go to Build Phases
4. Check for any red errors in build scripts
5. Clear build folder: `npm run ios:clean`

### Issue: "App crashes on startup"

**Solution:**
1. Check console logs: `xcrun simctl spawn booted log stream`
2. Verify pods are installed: `npm run ios:pod-install`
3. Clear Metro cache: `npm run start -- --reset-cache`

### Issue: "Cannot find module" errors

**Solution:**
```bash
cd app
rm -rf node_modules
npm install
cd ..
npm run ios:pod-install
```

### Issue: Xcode says "No team" or code signing issues

**Solution:**
1. Open `ios/VoiceRelay.xcworkspace`
2. Select VoiceRelay target
3. Go to "Signing & Capabilities"
4. Ensure "Automatically manage signing" is checked
5. Select your team from the dropdown

## Platform Differences from Android

### Build System
- **Android**: Uses Gradle build system
- **iOS**: Uses Xcode with CocoaPods for dependencies

### Permissions
- **Android**: Declared in AndroidManifest.xml, requested at runtime
- **iOS**: Declared in Info.plist, prompted to user automatically

### Storage
- **Android**: Uses getExternalFilesDir() or shared storage
- **iOS**: Uses app sandbox (Documents folder)

### Navigation
- **Android**: Hardware back button
- **iOS**: Gesture-based navigation (swipe to go back)

### Performance
- **iOS**: Generally better performance on comparable hardware due to ecosystem optimization

## Next Steps

1. Complete the setup verification
2. Try building for the simulator
3. Review [IOS_QUICK_START.md](./IOS_QUICK_START.md) for a rapid start guide
4. Check [docs/IOS_BUILD_GUIDE.md](./docs/IOS_BUILD_GUIDE.md) for production builds

## Resources

- [React Native iOS Guide](https://reactnative.dev/docs/native-modules-ios)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [CocoaPods Guide](https://guides.cocoapods.org/)
