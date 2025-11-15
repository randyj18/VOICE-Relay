# iOS Build Guide

This guide covers building the VOICE Relay app for production deployment on iOS.

## Build Configurations

### Debug Build

Used for development and testing on device:

```bash
# Build in Xcode
open ios/VoiceRelay.xcworkspace

# Or from command line
react-native run-ios --configuration Debug
```

Debug builds include:
- Full debugging symbols
- Console logging enabled
- Performance monitoring tools
- Smaller optimizations

### Release Build

Optimized for production deployment:

```bash
# Build for simulator
react-native run-ios --configuration Release

# Or from Xcode:
# 1. Open ios/VoiceRelay.xcworkspace
# 2. Set Scheme to "Release"
# 3. Select device
# 4. Product > Archive
```

Release builds:
- Optimized for size and performance
- Debugging symbols stripped
- All logging disabled
- Suitable for App Store

## Code Signing Setup

### Prerequisites

- Apple Developer account (enrolled in Apple Developer Program)
- Xcode with Apple ID signed in

### First-Time Configuration

1. **Sign in to Xcode**:
   ```bash
   # Open Xcode
   open ios/VoiceRelay.xcworkspace

   # Go to Preferences (Cmd+,)
   # Select Accounts
   # Click + to add your Apple ID
   # Sign in with your Developer account
   ```

2. **Configure Code Signing**:
   - Select "VoiceRelay" in Project navigator (left panel)
   - Select "VoiceRelay" target
   - Go to "Signing & Capabilities"
   - Check "Automatically manage signing"
   - Select your Team from the dropdown
   - Xcode will create certificates and provisioning profiles automatically

3. **Verify Bundle ID**:
   - Still in "Signing & Capabilities"
   - Bundle Identifier should be: `com.voicerelay.app`
   - If different, update it to match

### Manual Signing (Advanced)

For manual code signing without automatic management:

1. Go to "Signing & Capabilities"
2. Uncheck "Automatically manage signing"
3. For "Debug":
   - Select a provisioning profile for development
4. For "Release":
   - Select a provisioning profile for distribution

## Provisioning Profiles

### Understanding Provisioning Profiles

Provisioning profiles link your code signing certificate to an App ID and authorized devices.

- **Development Profile**: Allows testing on registered devices
- **Distribution Profile**: Required for App Store submissions

### Creating Profiles Manually

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Select "Certificates, Identifiers & Profiles"
3. Create App ID:
   - Select "Identifiers"
   - Click +
   - Choose "App IDs"
   - Enter identifier (e.g., `com.voicerelay.app`)
4. Create Provisioning Profile:
   - Select "Profiles"
   - Click +
   - Choose type (Development or Distribution)
   - Select the App ID
   - Select certificate
   - Select devices (for Development only)
   - Download profile

### Using Profiles in Xcode

```bash
# Place downloaded profiles in:
~/Library/MobileDevice/Provisioning\ Profiles/

# Xcode will automatically discover them
```

## App Store Preparation

### Prerequisites

- Xcode 14.0 or later
- App created in App Store Connect
- Code signed with Distribution certificate
- Privacy policy URL (required)

### Steps

1. **Create App in App Store Connect**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Select "My Apps"
   - Click +
   - Choose "New App"
   - Fill in app information:
     - Platform: iOS
     - Name: VOICE Relay
     - Primary Language: English
     - Bundle ID: `com.voicerelay.app`
     - SKU: (any unique identifier)
     - User Access: Full Access

2. **Configure App Information**:
   - App Category: Productivity
   - Subtitle (optional): Voice-controlled encrypted messaging
   - Description: A secure, voice-operated relay for encrypted conversations
   - Keywords: voice, secure, encrypted, relay
   - Support URL: [Your support website]
   - Privacy Policy URL: [Required]

3. **Add App Icons and Screenshots**:
   - Prepare 1024x1024px icon (PNG, no transparency)
   - Prepare screenshots for iPhone and iPad
   - Add promotional text and keywords

4. **Configure App Pricing and Availability**:
   - Select price tier (Free or Paid)
   - Choose countries
   - Set availability date

### Building for App Store

1. **Update Version Numbers**:
   ```bash
   # Open ios/VoiceRelay.xcodeproj
   # In Xcode:
   # - Select VoiceRelay target
   # - General tab
   # - Update "Version" and "Build"
   ```

2. **Create Archive**:
   ```bash
   # Open Xcode project
   open ios/VoiceRelay.xcworkspace

   # Select Generic iOS Device from device menu
   # Product > Archive
   # Wait for build to complete
   ```

3. **Upload to App Store**:
   - Archives window opens automatically
   - Click "Distribute App"
   - Select "App Store Connect"
   - Choose "Upload"
   - Select certificate and provisioning profile
   - Review app details
   - Click "Upload"

4. **Fill App Store Submission Form**:
   - Go to App Store Connect
   - Select app version
   - Fill in release notes
   - Select content rating (required)
   - Review app information
   - Submit for review

## TestFlight Deployment

Internal testing before App Store release:

### Prerequisites

- TestFlight setup in App Store Connect
- Test build created and uploaded

### Process

1. **Build and Archive**:
   ```bash
   open ios/VoiceRelay.xcworkspace
   # Select Generic iOS Device
   # Product > Archive
   ```

2. **Upload to TestFlight**:
   - In Archives window
   - Select your build
   - Click "Distribute App"
   - Select "TestFlight"
   - Click "Upload"
   - Sign in and wait for upload to complete

3. **Add Testers**:
   - Go to App Store Connect
   - Select app
   - Go to TestFlight > Internal Testing
   - Add your team members as testers
   - They'll receive invitation email

4. **Manage Builds**:
   - In TestFlight, select build
   - Edit beta review information
   - Set expiration date
   - Enable/disable testing

### Beta Testing

Testers will:
1. Receive invitation email
2. Install TestFlight app from App Store
3. Accept invitation
4. Download beta build
5. Test the app

Collect feedback through TestFlight feedback mechanism.

## Certificate Management

### Viewing Certificates

```bash
# List installed certificates
security find-identity -v -p codesigning

# View certificate details
security find-certificate -a -c "iPhone Developer" -Z
```

### Renewing Certificates

Certificates expire after 1 year for development, 3 years for distribution.

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Select "Certificates, Identifiers & Profiles"
3. View expiring certificates
4. Revoke old certificate
5. Create new certificate
6. Download and install in Xcode

### Revoking Certificates

If certificate is compromised:

```bash
# In Apple Developer Portal:
# - Certificates, Identifiers & Profiles
# - Certificates
# - Select certificate
# - Click Revoke
```

## Troubleshooting Builds

### Issue: "Code signing identity not found"

**Solution:**
```bash
# Verify certificates are installed
security find-identity -v -p codesigning

# Sign in to Xcode with developer account
# Preferences > Accounts > Select team
```

### Issue: "Provisioning profile doesn't include"

**Solution:**
- Update Bundle ID to match App ID in provisioning profile
- Recreate provisioning profile with correct App ID
- Refresh profiles in Xcode (Preferences > Accounts > Download Profiles)

### Issue: "Archive succeeded but upload failed"

**Solution:**
1. Verify app was built with Release configuration
2. Check Bundle ID matches App Store Connect
3. Verify version numbers are unique in App Store
4. Try uploading again (temporary network issue)

### Issue: "The executable was signed with invalid entitlements"

**Solution:**
1. Open ios/VoiceRelay.xcworkspace
2. Select VoiceRelay target
3. Go to Signing & Capabilities
4. Remove any unused capability toggles
5. Rebuild

## Performance Optimization

### Profiling Tools

Use Xcode's built-in tools:

1. **Instruments**:
   - Product > Profile
   - Select tool (Time Profiler, System Trace, etc.)
   - Analyze performance bottlenecks

2. **Memory Debugger**:
   - Debug > Memory Graph
   - Identify memory leaks
   - Monitor allocations

### Code-Level Optimization

- Use appropriate collection types (Array vs Set)
- Minimize main thread work
- Profile before optimizing
- Monitor for memory leaks

## Deployment Checklist

Before submitting to App Store:

- [ ] Version numbers incremented
- [ ] All TypeScript errors resolved
- [ ] All console logs removed/disabled
- [ ] Privacy policy URL configured
- [ ] App icons and screenshots added
- [ ] Release notes written
- [ ] Tested on actual device
- [ ] Tested with Release build configuration
- [ ] All required capabilities configured
- [ ] Code signed with Distribution profile
- [ ] No external dependencies missing
- [ ] Entitlements configured correctly
- [ ] Supported devices verified

## Resources

- [Apple Developer Program](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Xcode Build Settings Reference](https://developer.apple.com/documentation/xcode/build-settings-reference)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
