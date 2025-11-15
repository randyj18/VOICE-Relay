# iOS Setup Guide for VOICE Relay

**Purpose**: Step-by-step guide for iOS-specific configuration and native module setup

---

## Quick Start

### 1. Install Node Dependencies
```bash
cd /path/to/VOICE-Relay/app
npm install
```

### 2. Install CocoaPods
```bash
cd ios
pod install
# or if you need to update specs
pod install --repo-update
cd ..
```

### 3. Verify Setup
```bash
# Check that Podfile has autolinking enabled
grep "use_native_modules!" ios/Podfile

# Should output:
# use_native_modules!
```

### 4. Build & Run
```bash
# Use Xcode with the .xcworkspace file
open ios/VoiceRelay.xcworkspace

# Or command line
react-native run-ios

# Or with device
react-native run-ios --device "iPhone 15 Pro"
```

---

## iOS Permissions Setup

### Current Permissions (Phase 1-2)

**Current**: No special permissions needed for encryption/storage

### Phase 3 Permissions (Voice Features)

Add these keys to `ios/VoiceRelay/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Existing keys... -->

  <!-- Speech Recognition Permissions (Phase 3) -->
  <key>NSMicrophoneUsageDescription</key>
  <string>VOICE Relay uses the microphone to capture your voice for speech recognition and hands-free interaction.</string>

  <key>NSSpeechRecognitionUsageDescription</key>
  <string>VOICE Relay uses speech recognition to convert your voice to text commands.</string>

  <!-- Optional: Add if app uses background audio -->
  <key>UIBackgroundModes</key>
  <array>
    <string>audio</string>
  </array>

</dict>
</plist>
```

### Runtime Permission Requests

Add permission checks before using voice features (Phase 3):

```typescript
// src/services/voiceService.ts
import { Platform } from 'react-native';
import { Voice } from '@react-native-voice/voice';

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return true;

  try {
    const permission = await Voice.requestMicrophonePermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Microphone permission error:', error);
    return false;
  }
};
```

---

## Native Module Linking Verification

### Auto-Linked Modules

After `pod install`, verify these are present in `ios/Pods`:

**Current (Phase 1-2)**:
```bash
ls -la ios/Pods/Target\ Support\ Files/ | grep -i async
# Should show: RNAsyncStorage
```

**Phase 3 additions**:
```bash
ls -la ios/Pods/Target\ Support\ Files/ | grep -i "Voice\|Text\|Keep"
# Should show: RNVoice, TextToSpeech, RNKeepAwake (when installed)
```

### Verify Podfile Configuration

```bash
cat ios/Podfile | grep -A 5 "use_native_modules!"
```

Should contain:
```ruby
# Then as dependencies are added:
target 'VoiceRelay' do
  # ... other configs ...
  use_native_modules!
  use_react_native!
end
```

---

## Build Configuration

### Minimum Deployment Target

Verify in Xcode or Podfile:

```ruby
# ios/Podfile
platform :ios, '13.4'
```

For Phase 3, update if needed:
```ruby
# Once ready for iOS 13+
platform :ios, '13.4'  # Supports voice features
```

### Code Signing

Ensure these are set in Xcode:

1. **Team ID**: Set to your Apple Developer account
2. **Bundle Identifier**: Should be unique (e.g., `com.voicerelay.app`)
3. **Signing Certificate**: Development or Distribution

```bash
# Command line setup (optional)
cd ios
xcodebuild -list -project VoiceRelay.xcodeproj
```

---

## Troubleshooting iOS Build Issues

### Issue: CocoaPods Not Found
```bash
# Solution: Install CocoaPods
sudo gem install cocoapods
pod setup
cd ios && pod install && cd ..
```

### Issue: "use_native_modules! Not Working"
```bash
# Solution: Update pod specs
cd ios
rm Podfile.lock
pod repo update
pod install --repo-update
cd ..
```

### Issue: "Unknown package identifier" in Podfile
```bash
# Solution: Update React Native CLI
npm install -g react-native-cli
npx react-native doctor
```

### Issue: Xcode Can't Find Headers
```bash
# Solution: Clean build folder
rm -rf ios/Pods ios/Podfile.lock
cd ios && pod install && cd ..
open VoiceRelay.xcworkspace
# In Xcode: Product > Clean Build Folder
# Then rebuild
```

### Issue: "ALWAYS USE .xcworkspace, NOT .xcodeproj"
```bash
# WRONG:
open ios/VoiceRelay.xcodeproj

# CORRECT:
open ios/VoiceRelay.xcworkspace
```

---

## Native Module Configuration Details

### AsyncStorage (Current)

**Pod Name**: `RNAsyncStorage`
**Source**: `@react-native-async-storage/async-storage`
**Status**: Autolinked ✅

**Files Included**:
- RNAsyncStorage.m (native iOS code)
- RNAsyncStorage.h (header file)
- Linked to React-Core

**Usage**: No additional configuration needed

### React Native Voice (Phase 3)

**Pod Name**: `RNVoice`
**Source**: `@react-native-voice/voice`
**Status**: Will be autolinked once installed

**Installation**:
```bash
npm install @react-native-voice/voice
cd ios && pod install && cd ..
```

**Required Info.plist entries** (see above)

**Native Files Included**:
- RNVoice.m
- RNVoice.h
- Linked to Speech.framework and AVFoundation.framework

### React Native TTS (Phase 3)

**Pod Name**: `TextToSpeech`
**Source**: `react-native-tts`
**Status**: Will be autolinked once installed

**Installation**:
```bash
npm install react-native-tts
cd ios && pod install && cd ..
```

**Native Files Included**:
- TextToSpeech.m
- TextToSpeech.h
- Linked to AVFoundation.framework

### React Native Keep Awake (Phase 3)

**Pod Name**: `RNKeepAwake` or `RNKeepAwakeFork`
**Source**: `@sayem314/react-native-keep-awake` (recommended)
**Status**: Will be autolinked once installed

**Installation**:
```bash
npm install @sayem314/react-native-keep-awake
cd ios && pod install && cd ..
```

---

## iOS Testing on Devices

### Real Device Setup

1. **Connect iPhone via USB or WiFi**
2. **In Xcode**:
   - Select your device in the device menu
   - Verify development team is set
   - Build: Cmd+B
   - Run: Cmd+R

3. **Command line**:
```bash
react-native run-ios --device "My iPhone"
react-native run-ios --udid <DEVICE_UDID>
```

### Get Device UDID
```bash
xcrun xcode-select --print-path
# or
system_profiler SPUSBDataType
```

### Test Voice Features on Device (Phase 3)

```bash
# After implementing voice features
react-native run-ios --device "iPhone 15 Pro"

# In app:
# 1. Grant microphone permission when prompted
# 2. Grant speech recognition permission when prompted
# 3. Test voice input
# 4. Test text-to-speech output
# 5. Test screen stays awake during voice interaction
```

---

## Debugging iOS Native Issues

### View Native Logs
```bash
# In Xcode: View > Debug Area > Show Debug Area
# Or: Cmd+Option+Y
```

### Use Console App
```bash
# macOS Console application
open /Applications/Utilities/Console.app

# Filter for app name:
VoiceRelay
```

### Enable NSLog Debugging
```typescript
// In native code (Objective-C):
NSLog(@"Debug message: %@", variable);
```

### Use React Native Debugger
```bash
# Download from: https://github.com/jhen0409/react-native-debugger

# Enable in app:
# Shake device -> Enable Remote JS Debugging
```

### Metro Bundler Issues
```bash
# If seeing "Unable to resolve module"
npm start -- --reset-cache
react-native run-ios
```

---

## iOS Specific Code Examples

### Checking iOS Platform

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific code
  console.log('Running on iOS version', Platform.Version);
}
```

### iOS Version Check

```typescript
import { Platform } from 'react-native';

const isIOS13Plus = Platform.OS === 'ios' &&
  parseInt(Platform.Version, 10) >= 13;

if (isIOS13Plus) {
  // Use on-device speech recognition
}
```

### Native Module Example

```typescript
// Using NativeModules to access native code
import { NativeModules } from 'react-native';

const { VoiceModule } = NativeModules;

// Call native iOS method
VoiceModule.startListening()
  .then(() => console.log('Listening started'))
  .catch(error => console.error('Error:', error));
```

---

## CocoaPods Best Practices

### Keep Pods Directory Clean

```bash
# After pod install, Pods directory is created:
# ios/Pods/
#
# DO NOT commit to git:
echo "Pods/" >> .gitignore
git rm --cached -r ios/Pods/
git commit -m "Remove Pods from tracking"
```

### Update Dependencies

```bash
# Update all pods to latest versions
cd ios
pod update
cd ..

# Or update specific pod
pod update RNAsyncStorage
```

### Troubleshoot Pod Issues

```bash
# Clear everything and reinstall
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..

# Rebuild in Xcode
# Product > Clean Build Folder (Cmd+Shift+K)
# Product > Build (Cmd+B)
```

---

## iOS Privacy & Security

### Privacy Manifest (iOS 17+)

For iOS 17+, Apple requires Privacy Manifest files in pods that use sensitive APIs.

**Already included** in:
- @react-native-async-storage/async-storage v1.23.0+

**May be needed** in Phase 3:
- @react-native-voice/voice (for microphone access)

**Check if included**:
```bash
find ios/Pods -name "PrivacyInfo.xcprivacy" | grep -i voice
```

### Security Best Practices

1. **Never hardcode secrets** in Info.plist
2. **Use Keychain** for sensitive data:
   ```bash
   npm install react-native-keychain
   ```
3. **Encrypt sensitive data** before storing in AsyncStorage
4. **Validate all microphone input** before processing

---

## Useful iOS Commands

```bash
# List available simulators
xcrun simctl list devices

# Launch specific simulator
xcrun simctl boot "iPhone 15 Pro"

# Install app on simulator
xcrun simctl install booted path/to/app.app

# Clear simulator data
xcrun simctl erase all

# View simulator logs
xcrun simctl spawn booted log stream --predicate 'eventMessage contains[c] "VoiceRelay"'
```

---

## Resources

- Apple Speech Framework: https://developer.apple.com/documentation/speech/
- AVFoundation: https://developer.apple.com/documentation/avfoundation/
- CocoaPods Docs: https://guides.cocoapods.org/
- React Native iOS Docs: https://reactnative.dev/docs/native-modules-ios
- Xcode Documentation: https://developer.apple.com/xcode/

---

## Next Steps

1. **For Phase 1-2**: Ensure CocoaPods setup works, async-storage functional
2. **Before Phase 3**: Review permissions setup, prepare Info.plist
3. **Phase 3 Start**: Install voice libraries, test on device with microphone permission
4. **Pre-Launch**: Test on multiple iOS versions (13.4, 14, 15, 16, 17)

---

**Last Updated**: 2025-11-15
**React Native Version**: 0.73.0
**iOS Target**: 13.4+
