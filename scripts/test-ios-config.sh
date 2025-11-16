#!/bin/bash
#
# VOICE Relay - iOS Configuration Validator
#
# Validates iOS project configuration without requiring macOS or Xcode
# Checks:
#   - iOS project structure
#   - Podfile configuration
#   - Info.plist permissions
#   - Dependency compatibility
#   - Platform-specific code paths
#
# Usage:
#   ./scripts/test-ios-config.sh [--verbose]
#

set -e
set -o pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/app/ios"
VERBOSE=false

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo "=========================================="
    echo -e "${CYAN}$1${NC}"
    echo "=========================================="
}

print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_failure() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

check_pass() {
    local name="$1"
    print_success "$name"
    ((TOTAL_CHECKS++))
    ((PASSED_CHECKS++))
}

check_fail() {
    local name="$1"
    local message="$2"
    print_failure "$name"
    if [[ -n "$message" ]]; then
        echo "  $message"
    fi
    ((TOTAL_CHECKS++))
    ((FAILED_CHECKS++))
}

check_warn() {
    local name="$1"
    local message="$2"
    print_warning "$name"
    if [[ -n "$message" ]]; then
        echo "  $message"
    fi
    ((WARNINGS++))
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# //g' | sed 's/^#//g'
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# ============================================================================
# Validation Functions
# ============================================================================

# Check iOS directory structure
check_ios_structure() {
    print_section "iOS Project Structure"

    if [[ -d "$IOS_DIR" ]]; then
        check_pass "iOS directory exists"
    else
        check_fail "iOS directory missing" "Expected: $IOS_DIR"
        return 1
    fi

    # Check for key files/directories
    local key_paths=(
        "VoiceRelay"
        "VoiceRelay.xcodeproj"
        "VoiceRelay.xcworkspace"
        "Podfile"
    )

    for path in "${key_paths[@]}"; do
        if [[ -e "$IOS_DIR/$path" ]]; then
            check_pass "$path exists"
        else
            check_warn "$path not found" "May need to run 'pod install'"
        fi
    done
}

# Validate Podfile
check_podfile() {
    print_section "Podfile Configuration"

    local podfile="$IOS_DIR/Podfile"

    if [[ ! -f "$podfile" ]]; then
        check_fail "Podfile not found" "Expected: $podfile"
        return 1
    fi

    check_pass "Podfile exists"

    # Check for required dependencies
    local required_pods=(
        "React"
        "React-Core"
    )

    for pod in "${required_pods[@]}"; do
        if grep -q "$pod" "$podfile"; then
            if [[ "$VERBOSE" == "true" ]]; then
                check_pass "Podfile includes $pod"
            fi
        else
            check_warn "Podfile may be missing $pod"
        fi
    done

    # Check platform version
    if grep -q "platform :ios" "$podfile"; then
        local ios_version=$(grep "platform :ios" "$podfile" | grep -o "[0-9]\+\.[0-9]\+" | head -1)
        if [[ -n "$ios_version" ]]; then
            check_pass "iOS platform version specified: $ios_version"

            # Warn if version is too old
            if [[ $(echo "$ios_version" | cut -d. -f1) -lt 13 ]]; then
                check_warn "iOS version $ios_version is quite old" "Consider iOS 13.0+"
            fi
        fi
    else
        check_warn "iOS platform version not found in Podfile"
    fi
}

# Validate Info.plist
check_info_plist() {
    print_section "Info.plist Permissions"

    # Find Info.plist (location may vary)
    local info_plist=""
    if [[ -f "$IOS_DIR/VoiceRelay/Info.plist" ]]; then
        info_plist="$IOS_DIR/VoiceRelay/Info.plist"
    else
        # Try to find it
        info_plist=$(find "$IOS_DIR" -name "Info.plist" -type f 2>/dev/null | head -1)
    fi

    if [[ -z "$info_plist" || ! -f "$info_plist" ]]; then
        check_fail "Info.plist not found" "Expected in $IOS_DIR/VoiceRelay/"
        return 1
    fi

    check_pass "Info.plist found: $(basename "$(dirname "$info_plist")")/Info.plist"

    # Check for required permissions for voice app
    local required_permissions=(
        "NSMicrophoneUsageDescription"
        "NSSpeechRecognitionUsageDescription"
    )

    for permission in "${required_permissions[@]}"; do
        if grep -q "$permission" "$info_plist"; then
            if [[ "$VERBOSE" == "true" ]]; then
                check_pass "Permission: $permission"
            fi
        else
            check_warn "Missing permission: $permission" "Required for voice features"
        fi
    done

    # Check bundle identifier
    if grep -q "CFBundleIdentifier" "$info_plist"; then
        if [[ "$VERBOSE" == "true" ]]; then
            local bundle_id=$(grep -A 1 "CFBundleIdentifier" "$info_plist" | grep "<string>" | sed 's/.*<string>\(.*\)<\/string>.*/\1/')
            print_info "Bundle ID: $bundle_id"
        fi
    fi
}

# Check dependency compatibility
check_dependency_compatibility() {
    print_section "Dependency Compatibility"

    local package_json="$PROJECT_ROOT/app/package.json"

    if [[ ! -f "$package_json" ]]; then
        check_fail "package.json not found"
        return 1
    fi

    # Known iOS-incompatible packages
    local incompatible=(
        "react-native-bluetooth-serial"
        "react-native-nfc-manager"
    )

    local found_incompatible=false
    for pkg in "${incompatible[@]}"; do
        if grep -q "\"$pkg\"" "$package_json"; then
            check_warn "Potentially iOS-incompatible: $pkg"
            found_incompatible=true
        fi
    done

    if [[ "$found_incompatible" == "false" ]]; then
        check_pass "No known iOS-incompatible dependencies"
    fi

    # Check for voice libraries (if Phase 3 is implemented)
    local voice_libs=(
        "react-native-voice"
        "react-native-tts"
        "react-native-keep-awake"
    )

    local has_voice_libs=false
    for lib in "${voice_libs[@]}"; do
        if grep -q "\"$lib\"" "$package_json"; then
            if [[ "$VERBOSE" == "true" ]]; then
                check_pass "Voice library: $lib"
            fi
            has_voice_libs=true
        fi
    done

    if [[ "$has_voice_libs" == "false" ]]; then
        print_info "Voice libraries not yet installed (Phase 3)"
    fi
}

# Check platform-specific code
check_platform_code() {
    print_section "Platform-Specific Code"

    local src_dir="$PROJECT_ROOT/app/src"

    if [[ ! -d "$src_dir" ]]; then
        check_warn "Source directory not found: $src_dir"
        return 1
    fi

    # Find Platform.OS checks
    local platform_checks=$(grep -r "Platform\.OS" "$src_dir" 2>/dev/null | grep -c "ios" || echo "0")

    if [[ $platform_checks -gt 0 ]]; then
        check_pass "iOS platform checks found: $platform_checks"
    else
        check_warn "No iOS platform checks found" "App may not handle iOS-specific code paths"
    fi

    # Check for .ios.ts/.ios.tsx files
    local ios_files=$(find "$src_dir" -name "*.ios.ts" -o -name "*.ios.tsx" 2>/dev/null | wc -l)

    if [[ $ios_files -gt 0 ]]; then
        if [[ "$VERBOSE" == "true" ]]; then
            check_pass "iOS-specific files: $ios_files"
        fi
    else
        print_info "No .ios.ts/.ios.tsx files (not required)"
    fi
}

# Check React Native version compatibility
check_react_native_version() {
    print_section "React Native Version"

    local package_json="$PROJECT_ROOT/app/package.json"

    if [[ ! -f "$package_json" ]]; then
        check_fail "package.json not found"
        return 1
    fi

    if command -v jq &> /dev/null; then
        local rn_version=$(jq -r '.dependencies["react-native"] // .devDependencies["react-native"]' "$package_json")
        if [[ "$rn_version" != "null" && -n "$rn_version" ]]; then
            check_pass "React Native version: $rn_version"

            # Extract version number (remove ^, ~, etc.)
            local version_num=$(echo "$rn_version" | sed 's/[^0-9.]//g')
            local major_version=$(echo "$version_num" | cut -d. -f1)

            if [[ $major_version -ge 70 ]]; then
                check_pass "React Native version supports iOS ($major_version.x)"
            else
                check_warn "React Native version may be outdated" "Consider upgrading to 0.70+"
            fi
        else
            check_warn "Could not determine React Native version"
        fi
    else
        # Fallback without jq
        if grep -q "\"react-native\":" "$package_json"; then
            local rn_line=$(grep "\"react-native\":" "$package_json")
            check_pass "React Native found: $rn_line"
        else
            check_warn "React Native version not found in package.json"
        fi
    fi
}

# Generate configuration recommendations
generate_recommendations() {
    print_section "Recommendations"

    local has_recommendations=false

    # Check if CocoaPods needs to be run
    if [[ ! -d "$IOS_DIR/Pods" ]]; then
        echo "📦 CocoaPods not installed. When on macOS, run:"
        echo "   cd app/ios && pod install"
        has_recommendations=true
    fi

    # Check if xcworkspace exists
    if [[ ! -d "$IOS_DIR/VoiceRelay.xcworkspace" ]]; then
        echo "🔨 Xcode workspace not generated. Run 'pod install' to create it."
        has_recommendations=true
    fi

    # Check for voice permissions
    if [[ -f "$IOS_DIR/VoiceRelay/Info.plist" ]]; then
        if ! grep -q "NSMicrophoneUsageDescription" "$IOS_DIR/VoiceRelay/Info.plist"; then
            echo "🎤 Add microphone permission to Info.plist:"
            echo "   <key>NSMicrophoneUsageDescription</key>"
            echo "   <string>Voice Relay needs microphone access for voice input</string>"
            has_recommendations=true
        fi
    fi

    if [[ "$has_recommendations" == "false" ]]; then
        print_success "Configuration looks good! No recommendations."
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    parse_args "$@"

    print_header "iOS Configuration Validator"
    echo "Project: $PROJECT_ROOT"
    echo "iOS Dir: $IOS_DIR"

    # Run all checks
    check_ios_structure
    check_podfile
    check_info_plist
    check_dependency_compatibility
    check_platform_code
    check_react_native_version
    generate_recommendations

    # Summary
    print_header "Validation Summary"
    echo "Total Checks: $TOTAL_CHECKS"
    echo -e "${GREEN}Passed:${NC}       $PASSED_CHECKS"
    echo -e "${RED}Failed:${NC}       $FAILED_CHECKS"
    echo -e "${YELLOW}Warnings:${NC}     $WARNINGS"
    echo ""

    if [[ $FAILED_CHECKS -eq 0 ]]; then
        print_success "iOS configuration validation passed!"
        echo ""
        echo "Note: This validates configuration only. iOS build requires macOS/Xcode."
        exit 0
    else
        print_failure "iOS configuration has issues"
        echo ""
        echo "Fix the failed checks above before attempting iOS build."
        exit 1
    fi
}

main "$@"
