# VOICE Relay - Dependency Compatibility Matrix

**Last Updated**: 2025-11-15
**Project**: VOICE Relay (React Native 0.73.0)
**Target Platforms**: iOS (13.4+) & Android (API 23+)

---

## Executive Summary

All current dependencies support iOS. However, **node-forge has significant performance issues** on iOS for cryptographic operations and should be evaluated for migration to a native-backed alternative like libsodium.

All three future Phase 3 dependencies (voice, TTS, screen wake) have full iOS support but require native linking and specific permissions.

---

## CURRENT DEPENDENCIES - Compatibility Matrix

| Package | iOS Support | Min iOS | Android Support | Min Android | Native Linking | CocoaPods | Notes |
|---------|-------------|---------|-----------------|-------------|-----------------|-----------|-------|
| **react-native** | Yes | 13.4 | Yes | API 23 | N/A | Yes | Core framework. RN 0.73 uses iOS 13.4+ minimum. RN 0.76+ will require iOS 15.1+ |
| **react** | Yes | 13.4 | Yes | API 23 | No | No | Pure JavaScript, no native code |
| **@react-native-async-storage/async-storage** | Yes | 13.4 | Yes | API 16 | Yes | Yes | Uses native iOS code. Autolinked. Privacy manifest included (v1.23.0+). Well-maintained |
| **axios** | Yes | 13.4 | Yes | API 23 | No | No | Pure JavaScript HTTP client. Works perfectly with React Native. No native modules |
| **node-forge** | Partial | 13.4 | Yes | API 16 | No | No | **⚠️ PERFORMANCE CRITICAL**: Cryptographic operations are 20-50x slower than native alternatives. RSA key generation takes ~75s on iOS vs ~3s on desktop. Not suitable for production on iOS. See recommendations below. |

---

## FUTURE DEPENDENCIES (Phase 3) - Compatibility Matrix

| Package | iOS Support | Min iOS | Android Support | Min Android | Native Linking | CocoaPods | Required Permissions | Status |
|---------|-------------|---------|-----------------|-------------|-----------------|-----------|---------------------|--------|
| **react-native-voice** | Yes | 10.0 | Yes | API 16 | Yes | Yes | Microphone, Speech Recognition | ✅ Ready. On-device STT requires iOS 13.0+ |
| **react-native-tts** | Yes | 9.0 | Yes | API 16 | Yes | Yes | None (uses native frameworks) | ✅ Ready. Well-tested library |
| **react-native-keep-awake** | Yes | 9.0+ | Yes | API 16+ | Yes | Yes | None (uses native APIs) | ✅ Ready. Fork @sayem314/react-native-keep-awake recommended for updated maintenance |

---

## Detailed Dependency Analysis

### 1. react-native 0.73.0

**Status**: ✅ Fully Compatible

- **iOS Minimum**: 13.4
- **Android Minimum**: API 23 (Android 6.0)
- **Native Linking**: Framework level (handled automatically)
- **CocoaPods**: Yes, required for iOS
- **Known Issues**: None for 0.73 specifically
- **Important Notes**:
  - React Native 0.76+ will increase iOS minimum to 15.1
  - Plan upgrade path if iOS 13 support needed beyond 0.73
  - Autolinking for native modules works with `use_native_modules!` in Podfile

**Build Process**:
```bash
cd ios && pod install && cd ..
react-native run-ios
```

---

### 2. react 18.2.0

**Status**: ✅ Fully Compatible

- **iOS Minimum**: 13.4 (inherited from react-native)
- **Android Minimum**: API 23 (inherited from react-native)
- **Native Code**: None
- **Known Issues**: None
- **Notes**: Pure JavaScript library, no platform-specific concerns

---

### 3. @react-native-async-storage/async-storage 1.21.0

**Status**: ✅ Fully Compatible

- **iOS Minimum**: 13.4 (with RN 0.73)
- **Android Minimum**: API 16+
- **Native Linking**: Yes (automatic via autolinking)
- **CocoaPods**: Yes
- **Storage Location**:
  - < 1024 characters: Stored in manifest.json
  - > 1024 characters: Individual files
- **Permissions**: None required
- **Known Issues**: Legacy version `@react-native-community/async-storage` is deprecated—current version is correct
- **Privacy**: Includes Privacy Manifest (v1.23.0+), compliant with Apple's requirements

**Installation**:
```bash
npm install @react-native-async-storage/async-storage
cd ios && pod install && cd ..
```

---

### 4. axios 1.6.0+

**Status**: ✅ Fully Compatible

- **iOS Minimum**: 13.4 (via react-native)
- **Android Minimum**: API 23 (via react-native)
- **Native Linking**: None
- **CocoaPods**: None
- **Known Issues**: None
- **Notes**:
  - Pure JavaScript HTTP client
  - Works identically on iOS and Android
  - No platform-specific code needed
  - Common choice for React Native API communication

**Usage**: Works out of the box, no additional configuration needed

---

### 5. node-forge 1.3.0

**Status**: ⚠️ CONDITIONAL - Performance Issue Critical

- **iOS Minimum**: 13.4 (technically compatible)
- **Android Minimum**: API 16+
- **Native Linking**: None
- **CocoaPods**: None
- **Permissions**: None
- **Known Issues**:
  - **CRITICAL PERFORMANCE**: RSA key generation ~75 seconds on iOS vs ~3 seconds on desktop
  - 20-50x slower than native alternatives
  - No access to native cryptographic APIs (CommonCrypto on iOS)
  - No Web Crypto API in React Native
  - Dynamic require issues in some React Native environments

**Impact on VOICE Relay**:
- Currently used for E2EE encryption in Phase 1 (backend) and Phase 2 (app communication)
- For Phase 1 (Python backend): node-forge works but Python crypto libraries are better
- For Phase 2 (React Native app): Not suitable for key generation operations

**Recommendations**:

**Option A: Use for Communication Only (Recommended)**
- Use platform's native encryption for any key operations
- Use node-forge only for symmetric encryption/decryption of already-established sessions
- Still performs poorly; consider alternative

**Option B: Migrate to Native-Backed Alternative (Best)**
- **Replace with**: libsodium via `react-native-sodium` or `expo-crypto`
- **Benefits**:
  - 10-50x faster than node-forge
  - Native performance on iOS and Android
  - Better for cryptographic operations
  - Uses CommonCrypto on iOS (optimized for mobile)

- **Implementation**:
  ```bash
  npm install react-native-sodium
  cd ios && pod install && cd ..
  ```

**Option C: Use Web Crypto API Polyfill (Not Recommended)**
- Libraries like `isomorphic-webcrypto` attempt to polyfill Web Crypto
- Still slower than native alternatives
- More complex setup

**Estimated Effort to Migrate**:
- If encryption logic is abstracted: 2-4 hours
- If node-forge used directly in components: 8-16 hours

---

## iOS Phase 3 Dependencies - Detailed Requirements

### 6. react-native-voice (Future - Phase 3)

**Package Name**: `@react-native-voice/voice` (recommended over deprecated `react-native-voice`)
**Status**: ✅ Ready for Phase 3

**Compatibility**:
- **iOS Minimum**: 10.0
- **On-Device STT**: Requires iOS 13.0+
- **Android Minimum**: API 16
- **Framework**: Uses Apple's Speech Recognition framework

**Native Linking**: Yes (automatic)
**CocoaPods**: Yes

**iOS Permissions Required**:
```xml
<!-- Info.plist -->
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone to recognize your voice commands.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>We need speech recognition to process your voice input.</string>
```

**Implementation Notes**:
- Speech recognition requires network connection on iOS 10-12
- On-device recognition (offline) available iOS 13+
- Apple enforces rate limits on requests per app/day
- Permissions must be granted at runtime on iOS 13+

**Installation**:
```bash
npm install @react-native-voice/voice
cd ios && pod install && cd ..
react-native run-ios
```

**Android Notes**:
- Minimum SDK 21 for speech recognition
- Requires `android.intent.action.RECOGNIZE_SPEECH` permission
- May use Google's speech recognition service or device default

---

### 7. react-native-tts (Future - Phase 3)

**Package Name**: `react-native-tts`
**Status**: ✅ Ready for Phase 3

**Compatibility**:
- **iOS Minimum**: 9.0
- **Android Minimum**: API 16
- **Framework**: Uses Apple's AVFoundation (native)

**Native Linking**: Yes (automatic)
**CocoaPods**: Yes

**iOS Permissions**: None required (uses existing audio system)

**Implementation Notes**:
- Uses native iOS text-to-speech engine
- No additional permissions needed beyond basic audio
- High quality voice synthesis on iOS
- Works offline
- Configurable pitch, rate, volume

**Installation**:
```bash
npm install react-native-tts
cd ios && pod install && cd ..
react-native run-ios
```

**Android Notes**:
- Uses Android's TextToSpeech engine
- Works with any installed TTS engine
- May require language data download for offline support

---

### 8. react-native-keep-awake (Future - Phase 3)

**Package Name**: `react-native-keep-awake` or `@sayem314/react-native-keep-awake`
**Status**: ✅ Ready for Phase 3

**Compatibility**:
- **iOS Minimum**: 9.0
- **Android Minimum**: API 16
- **Framework**: Uses native UIApplication/PowerManager APIs

**Native Linking**: Yes (automatic)
**CocoaPods**: Yes

**iOS Permissions**: None required

**Recommendation**:
- Use `@sayem314/react-native-keep-awake` (actively maintained fork)
- Original `react-native-keep-awake` less frequently updated
- No Expo dependency required with the fork version

**Implementation Notes**:
- Simple boolean API (activate/deactivate)
- Prevents screen from sleeping while app is in foreground
- Useful for voice interaction mode
- No battery drain when app is backgrounded

**Installation**:
```bash
npm install @sayem314/react-native-keep-awake
cd ios && pod install && cd ..
react-native run-ios
```

---

## iOS Build & CocoaPods Setup

### Required Workflow for React Native 0.73

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Update CocoaPods**:
   ```bash
   cd ios
   pod install  # or pod install --repo-update
   cd ..
   ```

3. **Always use .xcworkspace file**:
   ```bash
   # NOT the .xcodeproj file!
   open ios/VoiceRelay.xcworkspace
   ```

4. **Verify native modules are linked**:
   ```bash
   grep "use_native_modules!" ios/Podfile
   ```

### CocoaPods Pods Included

These will be installed automatically after `pod install`:

**Current**:
- RNAsyncStorage (from @react-native-async-storage/async-storage)
- React-Core (base)
- React-RCTBlob (blob support)
- React-RCTNetwork (networking)
- React-RCTAppDelegate (app setup)

**Future (Phase 3)**:
- RNVoice (speech recognition)
- TextToSpeech (TTS)
- RNKeepAwake (screen wake)

---

## Android API Requirements

| Dependency | Min API | Target API | Notes |
|------------|---------|-----------|-------|
| react-native 0.73 | API 23 | API 34+ | Target API will increase soon |
| react-native-voice | API 16 | API 23+ | Effective minimum is API 23 from RN 0.73 |
| react-native-tts | API 16 | API 23+ | Effective minimum is API 23 from RN 0.73 |
| react-native-keep-awake | API 16 | API 23+ | Effective minimum is API 23 from RN 0.73 |
| AsyncStorage | API 16 | API 23+ | Effective minimum is API 23 from RN 0.73 |

---

## Known Issues & Workarounds

### Issue 1: node-forge Cryptographic Performance
**Severity**: 🔴 Critical for key generation
**Workaround**: Migrate to libsodium or native crypto APIs

### Issue 2: react-native-voice Android 12+
**Severity**: 🟡 Medium (fixable)
**Workaround**: Add `<queries>` element to AndroidManifest.xml
```xml
<queries>
  <intent>
    <action android:name="android.speech.RecognitionService" />
  </intent>
</queries>
```

### Issue 3: Speech Recognition Rate Limiting
**Severity**: 🟡 Medium (Apple-enforced)
**Workaround**: Implement local caching of recognition results and backoff strategies

### Issue 4: CocoaPods Not Installed
**Severity**: 🔴 Critical (build blocker)
**Workaround**: Run `pod install` in ios directory before building

---

## Recommendations Summary

### For Current Phase (Phase 1-2)

1. **✅ KEEP**: react-native, react, axios, async-storage
2. **⚠️ REVIEW**: node-forge
   - Short-term: OK if used only for symmetric encryption of pre-established keys
   - Long-term: Plan migration to libsodium or native crypto
   - Effort: 2-4 hours if well-abstracted

3. **📋 PREPARE**: Add iOS permissions to Info.plist (preparation)

### For Phase 3 (Voice Implementation)

1. **✅ USE**:
   - `@react-native-voice/voice` for STT
   - `react-native-tts` for TTS
   - `@sayem314/react-native-keep-awake` for screen wake

2. **CONFIGURE**: Add these Info.plist keys:
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>We need microphone access for voice input</string>
   <key>NSSpeechRecognitionUsageDescription</key>
   <string>We need speech recognition to process your voice</string>
   ```

3. **TEST**: Verify permissions at runtime before using voice features

### iOS Minimum Version Target

Current: **iOS 13.4** (with RN 0.73)
Future: **iOS 15.1** (planned for RN 0.76)

Plan upgrade to RN 0.75 or later if iOS 13 support critical; otherwise migrate to 0.76+ when ready.

---

## Native Module Linking Status

### Current (after `pod install`)

- ✅ RNAsyncStorage - Autolinked
- ✅ React-Core - Autolinked

### Phase 3 (after `pod install`)

- ✅ RNVoice - Autolinked
- ✅ TextToSpeech - Autolinked
- ✅ RNKeepAwake - Autolinked

**All use React Native's autolinking**. Manual linking NOT required for RN 0.60+.

---

## Testing Checklist for iOS Compatibility

- [ ] Run `pod install` successfully in ios directory
- [ ] Xcode project builds without CocoaPods warnings
- [ ] App runs on iOS 13.4+ simulator
- [ ] App runs on physical iOS device (iOS 13.4+)
- [ ] Async storage writes/reads work correctly
- [ ] Axios HTTP requests complete successfully
- [ ] Encryption/decryption works (test node-forge limits)

---

## Migration Path for node-forge

If performance becomes critical:

1. **Create crypto abstraction layer** (2 hours):
   ```typescript
   // src/services/cryptoService.ts
   export interface CryptoProvider {
     encrypt(data: string, key: string): Promise<string>;
     decrypt(data: string, key: string): Promise<string>;
     generateKeyPair(): Promise<KeyPair>;
   }
   ```

2. **Implement node-forge version** (existing)

3. **Implement libsodium version** (4-6 hours):
   ```bash
   npm install react-native-sodium
   cd ios && pod install && cd ..
   ```

4. **Add provider selection**:
   ```typescript
   const cryptoProvider = Platform.OS === 'ios'
     ? new SodiumCryptoProvider()
     : new NodeForgeCryptoProvider();
   ```

5. **Test both implementations**

6. **Remove node-forge** once libsodium is verified

**Total effort**: 8-12 hours (well-architected code), 16-24 hours (scattered code)

---

## References & Links

- React Native 0.73 Release: https://reactnative.dev/blog/2023/12/06/0.73-debugging-improvements-stable-symlinks
- Async Storage Docs: https://react-native-async-storage.github.io/async-storage/docs/install/
- React Native Voice: https://github.com/react-native-voice/voice
- React Native TTS: https://github.com/ak1394/react-native-tts
- React Native Keep Awake: https://github.com/corbt/react-native-keep-awake
- iOS Speech Framework: https://developer.apple.com/documentation/speech/sfspeechrecognizer
- CocoaPods Setup: https://cocoapods.org/

---

**Document Version**: 1.0
**Next Review**: After Phase 3 dependencies are installed
**Owner**: VOICE Relay Development Team
