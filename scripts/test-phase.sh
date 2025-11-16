#!/bin/bash
#
# VOICE Relay - Phase-Specific Test Runner
#
# Runs tests for a specific development phase
#
# Usage:
#   ./scripts/test-phase.sh <phase_number> [--verbose]
#
# Examples:
#   ./scripts/test-phase.sh 2              # Test Phase 2 (Core App)
#   ./scripts/test-phase.sh 1 --verbose    # Test Phase 1 with details
#
# Phases:
#   0 - E2EE Encryption
#   1 - Backend Relay
#   2 - Core App (Android)
#   3 - Voice Integration
#   4 - UI Polish
#   5 - Monetization
#   ios - iOS Configuration
#

set -e
set -o pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$SCRIPT_DIR/test-reports"
VERBOSE=false
PHASE=""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
START_TIME=$(date +%s)

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo "=========================================="
    echo -e "${CYAN}$1${NC}"
    echo "=========================================="
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

show_usage() {
    cat <<EOF
Usage: $(basename "$0") <phase_number> [--verbose]

Phases:
  0   - E2EE Encryption
  1   - Backend Relay
  2   - Core App (Android)
  3   - Voice Integration
  4   - UI Polish
  5   - Monetization
  ios - iOS Configuration

Options:
  --verbose  Show detailed output from tests

Examples:
  $(basename "$0") 2              # Test Phase 2
  $(basename "$0") 1 --verbose    # Test Phase 1 with details
EOF
}

# Parse arguments
parse_args() {
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi

    PHASE="$1"
    shift

    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate phase
    case "$PHASE" in
        0|1|2|3|4|5|ios) ;;
        *)
            echo "Error: Invalid phase '$PHASE'"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run a test
run_test() {
    local name="$1"
    local command="$2"
    local log_file="$3"

    ((TOTAL_TESTS++))

    echo -n "  Testing: $name ... "

    if [[ "$VERBOSE" == "true" ]]; then
        echo ""
        echo "  Command: $command"
    fi

    mkdir -p "$(dirname "$log_file")"

    if eval "$command" > "$log_file" 2>&1; then
        print_success "PASS"
        ((PASSED_TESTS++))
        return 0
    else
        print_failure "FAIL"
        ((FAILED_TESTS++))
        if [[ "$VERBOSE" == "true" ]]; then
            echo "  Log: $log_file"
            tail -10 "$log_file" | sed 's/^/    /'
        else
            echo "  See: $log_file"
        fi
        return 1
    fi
}

# ============================================================================
# Phase Test Functions
# ============================================================================

test_phase_0() {
    print_header "Phase 0: E2EE Encryption"

    # Check if phase is implemented
    if [[ ! -f "$PROJECT_ROOT/app/src/utils/encryption.ts" ]]; then
        print_warning "Phase 0 not fully implemented"
        echo "  Missing: app/src/utils/encryption.ts"
        return 1
    fi

    run_test \
        "Encryption utilities exist" \
        "test -f $PROJECT_ROOT/app/src/utils/encryption.ts" \
        "$REPORT_DIR/phase0-structure.log"

    # Add more Phase 0 tests here as they're implemented
}

test_phase_1() {
    print_header "Phase 1: Backend Relay"

    # Check if phase is implemented
    if [[ ! -f "$PROJECT_ROOT/backend/main_production.py" ]]; then
        print_warning "Phase 1 not fully implemented"
        echo "  Missing: backend/main_production.py"
        return 1
    fi

    run_test \
        "Backend API tests" \
        "cd $PROJECT_ROOT && python3 scripts/test_backend.py" \
        "$REPORT_DIR/backend.log" || true  # Allow failure due to WAF

    run_test \
        "Backend main file exists" \
        "test -f $PROJECT_ROOT/backend/main_production.py" \
        "$REPORT_DIR/phase1-structure.log"
}

test_phase_2() {
    print_header "Phase 2: Core App (Android)"

    # Check if phase is implemented
    if [[ ! -f "$PROJECT_ROOT/app/src/App.tsx" ]]; then
        print_warning "Phase 2 not fully implemented"
        echo "  Missing: app/src/App.tsx"
        return 1
    fi

    run_test \
        "TypeScript compilation" \
        "cd $PROJECT_ROOT/app && npm run test:types" \
        "$REPORT_DIR/typescript.log"

    run_test \
        "ESLint code quality" \
        "cd $PROJECT_ROOT/app && npm run test:lint" \
        "$REPORT_DIR/eslint.log"

    run_test \
        "Jest unit tests" \
        "cd $PROJECT_ROOT/app && npm test -- --passWithNoTests" \
        "$REPORT_DIR/jest.log"

    run_test \
        "App structure check" \
        "test -f $PROJECT_ROOT/app/src/App.tsx && test -f $PROJECT_ROOT/app/package.json" \
        "$REPORT_DIR/phase2-structure.log"

    echo ""
    echo "Note: Android APK build skipped (use test-all.sh to include build)"
}

test_phase_3() {
    print_header "Phase 3: Voice Integration"

    # Check if phase is implemented
    if [[ ! -f "$PROJECT_ROOT/app/src/services/voiceService.ts" ]]; then
        print_warning "Phase 3 not yet implemented"
        echo "  Expected: app/src/services/voiceService.ts"
        return 1
    fi

    run_test \
        "Voice service exists" \
        "test -f $PROJECT_ROOT/app/src/services/voiceService.ts" \
        "$REPORT_DIR/phase3-structure.log"

    # Check for voice libraries
    if cd "$PROJECT_ROOT/app" && npm ls react-native-voice &>/dev/null; then
        run_test \
            "react-native-voice installed" \
            "cd $PROJECT_ROOT/app && npm ls react-native-voice" \
            "$REPORT_DIR/phase3-voice-lib.log"
    else
        print_warning "react-native-voice not installed yet"
    fi

    if cd "$PROJECT_ROOT/app" && npm ls react-native-tts &>/dev/null; then
        run_test \
            "react-native-tts installed" \
            "cd $PROJECT_ROOT/app && npm ls react-native-tts" \
            "$REPORT_DIR/phase3-tts-lib.log"
    else
        print_warning "react-native-tts not installed yet"
    fi
}

test_phase_4() {
    print_header "Phase 4: UI Polish"

    # Check if phase is implemented
    if [[ ! -f "$PROJECT_ROOT/app/src/screens/LoginScreen.tsx" ]]; then
        print_warning "Phase 4 not fully implemented"
        echo "  Expected: app/src/screens/LoginScreen.tsx"
        return 1
    fi

    run_test \
        "LoginScreen exists" \
        "test -f $PROJECT_ROOT/app/src/screens/LoginScreen.tsx" \
        "$REPORT_DIR/phase4-login.log"

    # Check for other screens
    local screens=("SettingsScreen" "QueueScreen")
    for screen in "${screens[@]}"; do
        if [[ -f "$PROJECT_ROOT/app/src/screens/${screen}.tsx" ]]; then
            run_test \
                "$screen exists" \
                "test -f $PROJECT_ROOT/app/src/screens/${screen}.tsx" \
                "$REPORT_DIR/phase4-${screen,,}.log"
        fi
    done
}

test_phase_5() {
    print_header "Phase 5: Monetization"

    # Check if phase is implemented
    if [[ ! -f "$PROJECT_ROOT/app/src/services/monetizationService.ts" ]]; then
        print_warning "Phase 5 not yet implemented"
        echo "  Expected: app/src/services/monetizationService.ts"
        return 1
    fi

    run_test \
        "Monetization service exists" \
        "test -f $PROJECT_ROOT/app/src/services/monetizationService.ts" \
        "$REPORT_DIR/phase5-structure.log"

    # Add more Phase 5 tests as implemented
}

test_ios_config() {
    print_header "iOS Configuration Validation"

    # Check if iOS config validation script exists
    if [[ -f "$SCRIPT_DIR/test-ios-config.sh" ]]; then
        run_test \
            "iOS configuration validation" \
            "$SCRIPT_DIR/test-ios-config.sh" \
            "$REPORT_DIR/ios-config.log"
    else
        # Basic iOS checks
        if [[ -d "$PROJECT_ROOT/app/ios" ]]; then
            run_test \
                "iOS folder exists" \
                "test -d $PROJECT_ROOT/app/ios" \
                "$REPORT_DIR/ios-folder.log"
        else
            print_warning "iOS folder not found"
        fi

        if [[ -f "$PROJECT_ROOT/app/ios/Podfile" ]]; then
            run_test \
                "Podfile exists" \
                "test -f $PROJECT_ROOT/app/ios/Podfile" \
                "$REPORT_DIR/ios-podfile.log"
        else
            print_warning "Podfile not found"
        fi

        if [[ -f "$PROJECT_ROOT/app/ios/VoiceRelay/Info.plist" ]]; then
            run_test \
                "Info.plist exists" \
                "test -f $PROJECT_ROOT/app/ios/VoiceRelay/Info.plist" \
                "$REPORT_DIR/ios-infoplist.log"
        else
            print_warning "Info.plist not found at expected location"
        fi
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Parse arguments
    parse_args "$@"

    # Setup
    mkdir -p "$REPORT_DIR"

    echo "VOICE Relay - Phase-Specific Test Runner"
    echo "Reports: $REPORT_DIR"

    # Run tests for the specified phase
    case "$PHASE" in
        0) test_phase_0 ;;
        1) test_phase_1 ;;
        2) test_phase_2 ;;
        3) test_phase_3 ;;
        4) test_phase_4 ;;
        5) test_phase_5 ;;
        ios) test_ios_config ;;
    esac

    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    echo ""
    echo "=========================================="
    echo "Summary"
    echo "=========================================="
    echo "Duration: ${duration}s"
    echo -e "Total:  $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"
    echo ""

    if [[ $FAILED_TESTS -eq 0 && $TOTAL_TESTS -gt 0 ]]; then
        print_success "All tests passed!"
        exit 0
    elif [[ $TOTAL_TESTS -eq 0 ]]; then
        print_warning "No tests run (phase may not be implemented)"
        exit 0
    else
        print_failure "$FAILED_TESTS test(s) failed"
        exit 1
    fi
}

main "$@"
