# iOS Compatibility - Quick Reference Summary

**Generated**: 2025-11-15
**React Native**: 0.73.0
**Target iOS**: 13.4+

---

## At A Glance

### Current Status
✅ All current dependencies support iOS 13.4+
⚠️ node-forge has critical performance issue (75s key generation)
✅ All Phase 3 voice dependencies ready

### Required Setup
- CocoaPods for native modules
- Info.plist permissions (Phase 3)
- Minimum iOS 13.4

### Build Command
```bash
npm install
cd ios && pod install && cd ..
react-native run-ios
```

---

## Dependency Support Matrix (Simple)

| Dependency | iOS Support | Android Support | Notes |
|-----------|-------------|-----------------|-------|
| react-native 0.73 | ✅ 13.4+ | ✅ API 23+ | Core framework |
| react | ✅ Yes | ✅ Yes | No native code |
| axios | ✅ Yes | ✅ Yes | HTTP client |
| async-storage | ✅ Yes | ✅ Yes | Native linking required |
| **node-forge** | ⚠️ Yes* | ✅ Yes | *Performance issue critical |
| **react-native-voice** | ✅ Yes | ✅ Yes | Phase 3 - STT |
| **react-native-tts** | ✅ Yes | ✅ Yes | Phase 3 - TTS |
| **react-native-keep-awake** | ✅ Yes | ✅ Yes | Phase 3 - Screen wake |

*node-forge works but is 50-75x slower on iOS

---

## Phase Timeline

### Phase 1-2 (Current)
```
✅ React Native 0.73 - iOS 13.4+
✅ AsyncStorage - Configured
✅ Axios - Works out of box
⚠️ node-forge - Performance issue (see alternatives)
```

### Phase 3 (Voice Features)
```
✅ react-native-voice - iOS 10.0+ (on-device requires 13.0+)
✅ react-native-tts - iOS 9.0+
✅ react-native-keep-awake - iOS 9.0+
📋 Add Info.plist permissions
```

---

## Permissions Checklist

### Phase 1-2
- [ ] None required

### Phase 3 (Before Launch)
```xml
<!-- ios/VoiceRelay/Info.plist -->
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for voice input</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>We need speech recognition for voice commands</string>
```

---

## Native Modules (CocoaPods)

### Current
- RNAsyncStorage

### Phase 3
- RNVoice (speech-to-text)
- TextToSpeech (text-to-speech)
- RNKeepAwake (screen wake)

**All use autolinking** - just run `pod install`

---

## Build Issues & Fixes

### Issue: "Cannot find Podfile"
```bash
cd ios && pod install && cd ..
```

### Issue: "Use .xcworkspace, not .xcodeproj"
```bash
# WRONG:
open ios/VoiceRelay.xcodeproj

# RIGHT:
open ios/VoiceRelay.xcworkspace
```

### Issue: CocoaPods not installed
```bash
sudo gem install cocoapods
pod setup
cd ios && pod install && cd ..
```

### Issue: Pod cache problems
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

---

## Critical Issues

### 🔴 node-forge Performance (CRITICAL)

**Problem**: RSA key generation takes 75 seconds on iOS

**Impact**: Any key generation blocks UI for 75 seconds (unacceptable)

**Solutions**:
1. **Quick fix** (Phase 1-2): Generate keys on backend server
2. **Proper fix** (Phase 3): Migrate to libsodium (10-50x faster)
3. **Detailed**: See NODE_FORGE_ALTERNATIVES.md

**Action Required**: Decide on migration strategy before Phase 3

---

## Important Files

1. **DEPENDENCY_COMPATIBILITY.md** - Full compatibility matrix & details
2. **iOS_SETUP_GUIDE.md** - Step-by-step iOS setup & troubleshooting
3. **NODE_FORGE_ALTERNATIVES.md** - Migration options & benchmarks
4. **iOS_COMPATIBILITY_SUMMARY.md** - This file (quick reference)

---

## Testing Checklist

- [ ] `npm install` completes
- [ ] `pod install` completes in ios/
- [ ] Xcode opens `VoiceRelay.xcworkspace`
- [ ] Build succeeds on iOS simulator
- [ ] App runs on iOS 13.4 simulator
- [ ] AsyncStorage write/read works
- [ ] Axios API call works
- [ ] Encryption works (node-forge)
- [ ] No CocoaPods warnings

---

## Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| macOS | 11.0+ (for Xcode) |
| Xcode | 13.0+ |
| CocoaPods | 1.11.0+ |
| iOS Deployment Target | 13.4 |
| React Native | 0.73.0 |
| Node | 14.0+ |
| npm | 6.0+ |

---

## Quick Commands

```bash
# Setup
npm install
cd ios && pod install && cd ..

# Develop
react-native start
react-native run-ios

# Test
npm test
npm run test:types
npm run test:lint

# Build
react-native run-ios --device "iPhone 15 Pro"

# Clean (if issues)
rm -rf ios/Pods ios/Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*
cd ios && pod install && cd ..

# Debug
react-native start -- --reset-cache
```

---

## iOS 13.4 Minimum - Why?

React Native 0.73 set iOS 13.4 as minimum. If you need to support older iOS:

- **iOS 12.x support**: Downgrade to React Native 0.72 (not recommended)
- **iOS 11.x support**: Use React Native 0.70 or older (outdated)

**Recommendation**: Keep iOS 13.4+ as minimum. Very few users on older iOS versions.

---

## Future iOS Version Planning

| RN Version | iOS Min | Status |
|-----------|---------|--------|
| 0.73 (current) | 13.4 | Stable |
| 0.74-0.75 | 13.4 | Latest |
| 0.76+ | 15.1 | Future |

**Plan to upgrade to 0.76+ when ready** to stay on recent versions.

---

## Voice Mode Requirements (Phase 3)

For voice interaction to work on iOS:

1. **Microphone**: Physical device required (simulator limited)
2. **Permissions**: User must grant at runtime
3. **Network**: Required for online speech recognition (iOS < 13)
4. **iOS 13+**: Supports on-device speech recognition

```typescript
// Check before using voice features
if (Platform.OS === 'ios' && parseInt(Platform.Version) >= 13) {
  // On-device speech recognition available
}
```

---

## Security Considerations

1. **Never hardcode secrets** in Info.plist
2. **Use Keychain** for tokens/keys
3. **Enable encryption** for sensitive async storage
4. **Validate microphone input** before processing
5. **Privacy manifest** required for iOS 17+

---

## Need Help?

1. **Build Issues**: See iOS_SETUP_GUIDE.md → Troubleshooting
2. **Dependency Issues**: See DEPENDENCY_COMPATIBILITY.md
3. **node-forge Performance**: See NODE_FORGE_ALTERNATIVES.md
4. **iOS Permissions**: See iOS_SETUP_GUIDE.md → Permissions

---

## Repository Structure

```
VOICE-Relay/
├── app/
│   ├── package.json              ← Dependencies
│   ├── ios/
│   │   ├── Podfile               ← CocoaPods config
│   │   ├── VoiceRelay.xcworkspace ← USE THIS
│   │   └── VoiceRelay/
│   │       └── Info.plist        ← iOS permissions
│   └── src/
│       └── services/
│           └── cryptoService.ts  ← node-forge location
├── DEPENDENCY_COMPATIBILITY.md   ← Full details
├── iOS_SETUP_GUIDE.md            ← Setup instructions
├── NODE_FORGE_ALTERNATIVES.md    ← Migration guide
└── iOS_COMPATIBILITY_SUMMARY.md  ← This file
```

---

## Next Steps

**Before Phase 2 launch**:
- [ ] Verify iOS build works
- [ ] Test on iOS device (if available)
- [ ] Decide on node-forge strategy

**Before Phase 3 launch**:
- [ ] Decide on cryptography migration (node-forge alternatives)
- [ ] Add microphone permissions to Info.plist
- [ ] Test voice features on iOS device
- [ ] Get Apple app store ready

---

**For detailed information, see the full compatibility matrix and setup guides.**
