#!/bin/bash
#
# VOICE Relay - Comprehensive Test Suite
#
# Runs all applicable tests across all development phases:
# - Phase 0: E2EE Encryption
# - Phase 1: Backend Relay
# - Phase 2: Core App (Android)
# - Phase 3: Voice Integration (when implemented)
# - Phase 4: UI Polish
# - Phase 5: Monetization (when implemented)
# - iOS: Configuration validation
#
# Usage:
#   ./scripts/test-all.sh [--verbose] [--skip-build]
#
# Options:
#   --verbose     Show detailed output from each test
#   --skip-build  Skip Android build (saves time, ~4 minutes)
#   --help        Show this help message
#

set -e  # Exit on first error
set -o pipefail  # Catch errors in pipes

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$SCRIPT_DIR/test-reports"
VERBOSE=false
SKIP_BUILD=false

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0
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

print_skip() {
    echo -e "${MAGENTA}⊘${NC} $1"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --help)
                grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# //g' | sed 's/^#//g'
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Run with --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Run a test and track results
run_test() {
    local name="$1"
    local command="$2"
    local log_file="$3"
    local allow_failure="${4:-false}"

    ((TOTAL_TESTS++))

    echo -n "  Testing: $name ... "

    if [[ "$VERBOSE" == "true" ]]; then
        echo ""
        echo "  Command: $command"
    fi

    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$log_file")"

    # Run the test
    if eval "$command" > "$log_file" 2>&1; then
        print_success "PASS"
        ((PASSED_TESTS++))
        return 0
    else
        if [[ "$allow_failure" == "true" ]]; then
            print_warning "WARN (allowed to fail)"
            ((SKIPPED_TESTS++))
            return 0
        else
            print_failure "FAIL"
            ((FAILED_TESTS++))
            if [[ "$VERBOSE" == "true" ]]; then
                echo "  Log: $log_file"
                echo "  Last 10 lines:"
                tail -10 "$log_file" | sed 's/^/    /'
            else
                echo "  Run with --verbose or see: $log_file"
            fi
            return 1
        fi
    fi
}

# Check if a file or directory exists
file_exists() {
    local path="$1"
    local type="$2"  # "file" or "dir"

    if [[ "$type" == "file" && -f "$path" ]]; then
        return 0
    elif [[ "$type" == "dir" && -d "$path" ]]; then
        return 0
    else
        return 1
    fi
}

# ============================================================================
# Phase Detection
# ============================================================================

detect_phase() {
    local phase_name="$1"
    local indicator_file="$2"

    if file_exists "$PROJECT_ROOT/$indicator_file" "file"; then
        echo "true"
    else
        echo "false"
    fi
}

# ============================================================================
# Test Execution
# ============================================================================

# Setup
setup_tests() {
    print_header "VOICE Relay Comprehensive Test Suite"
    echo "Project: $PROJECT_ROOT"
    echo "Reports: $REPORT_DIR"
    echo ""

    # Create report directory
    rm -rf "$REPORT_DIR"
    mkdir -p "$REPORT_DIR"

    # Detect phases
    echo "Detecting implemented phases..."
    PHASE_0=$(detect_phase "Phase 0: E2EE" "app/src/utils/encryption.ts")
    PHASE_1=$(detect_phase "Phase 1: Backend" "backend/main_production.py")
    PHASE_2=$(detect_phase "Phase 2: Core App" "app/src/App.tsx")
    PHASE_3=$(detect_phase "Phase 3: Voice" "app/src/services/voiceService.ts")
    PHASE_4=$(detect_phase "Phase 4: UI Polish" "app/src/screens/LoginScreen.tsx")
    PHASE_5=$(detect_phase "Phase 5: Monetization" "app/src/services/monetizationService.ts")

    echo -e "  Phase 0 (E2EE): ${PHASE_0}"
    echo -e "  Phase 1 (Backend): ${PHASE_1}"
    echo -e "  Phase 2 (Core App): ${PHASE_2}"
    echo -e "  Phase 3 (Voice): ${PHASE_3}"
    echo -e "  Phase 4 (UI): ${PHASE_4}"
    echo -e "  Phase 5 (Monetization): ${PHASE_5}"
}

# Phase 0: E2EE Tests
test_phase_0() {
    if [[ "$PHASE_0" != "true" ]]; then
        print_skip "Phase 0 (E2EE) not implemented"
        return 0
    fi

    print_section "Phase 0: E2EE Encryption"

    # Note: Comprehensive E2EE tests would go here
    # For now, we verify the encryption utilities exist
    run_test \
        "Encryption utils exist" \
        "test -f $PROJECT_ROOT/app/src/utils/encryption.ts" \
        "$REPORT_DIR/phase0-structure.log"
}

# Phase 1: Backend Tests
test_phase_1() {
    if [[ "$PHASE_1" != "true" ]]; then
        print_skip "Phase 1 (Backend) not implemented"
        return 0
    fi

    print_section "Phase 1: Backend Relay"

    # Run backend tests
    run_test \
        "Backend API endpoints" \
        "cd $PROJECT_ROOT && python3 scripts/test_backend.py" \
        "$REPORT_DIR/backend.log" \
        "true"  # Allow failure due to Replit WAF
}

# Phase 2: Core App Tests
test_phase_2() {
    if [[ "$PHASE_2" != "true" ]]; then
        print_skip "Phase 2 (Core App) not implemented"
        return 0
    fi

    print_section "Phase 2: Core App (Android)"

    # TypeScript compilation
    run_test \
        "TypeScript compilation" \
        "cd $PROJECT_ROOT/app && npm run test:types" \
        "$REPORT_DIR/typescript.log"

    # ESLint code quality
    run_test \
        "ESLint code quality" \
        "cd $PROJECT_ROOT/app && npm run test:lint" \
        "$REPORT_DIR/eslint.log"

    # Jest unit tests
    if file_exists "$PROJECT_ROOT/app/src" "dir"; then
        run_test \
            "Jest unit tests" \
            "cd $PROJECT_ROOT/app && npm test -- --passWithNoTests" \
            "$REPORT_DIR/jest.log"
    fi

    # Android build (optional, takes time)
    if [[ "$SKIP_BUILD" == "false" ]]; then
        run_test \
            "Android APK build" \
            "cd $PROJECT_ROOT/app && npm run test:build" \
            "$REPORT_DIR/build.log"
    else
        print_skip "Android APK build (--skip-build specified)"
        ((SKIPPED_TESTS++))
    fi

    # Component structure
    run_test \
        "App.tsx exists" \
        "test -f $PROJECT_ROOT/app/src/App.tsx" \
        "$REPORT_DIR/phase2-structure.log"
}

# Phase 3: Voice Tests
test_phase_3() {
    if [[ "$PHASE_3" != "true" ]]; then
        print_skip "Phase 3 (Voice) not implemented yet"
        return 0
    fi

    print_section "Phase 3: Voice Integration"

    # Voice service structure
    run_test \
        "Voice service exists" \
        "test -f $PROJECT_ROOT/app/src/services/voiceService.ts" \
        "$REPORT_DIR/phase3-structure.log"

    # Voice libraries installed
    run_test \
        "react-native-voice installed" \
        "cd $PROJECT_ROOT/app && npm ls react-native-voice" \
        "$REPORT_DIR/phase3-deps.log" \
        "true"  # May not be installed yet
}

# Phase 4: UI Polish Tests
test_phase_4() {
    if [[ "$PHASE_4" != "true" ]]; then
        print_skip "Phase 4 (UI Polish) not implemented yet"
        return 0
    fi

    print_section "Phase 4: UI Polish"

    # Screen components exist
    run_test \
        "LoginScreen exists" \
        "test -f $PROJECT_ROOT/app/src/screens/LoginScreen.tsx" \
        "$REPORT_DIR/phase4-structure.log"
}

# Phase 5: Monetization Tests
test_phase_5() {
    if [[ "$PHASE_5" != "true" ]]; then
        print_skip "Phase 5 (Monetization) not implemented yet"
        return 0
    fi

    print_section "Phase 5: Monetization"

    # Monetization service
    run_test \
        "Monetization service exists" \
        "test -f $PROJECT_ROOT/app/src/services/monetizationService.ts" \
        "$REPORT_DIR/phase5-structure.log"
}

# iOS Configuration Tests
test_ios_config() {
    print_section "iOS Configuration"

    # Run iOS config validation script if it exists
    if file_exists "$SCRIPT_DIR/test-ios-config.sh" "file"; then
        run_test \
            "iOS configuration" \
            "$SCRIPT_DIR/test-ios-config.sh" \
            "$REPORT_DIR/ios-config.log"
    else
        # Basic iOS checks
        run_test \
            "iOS folder exists" \
            "test -d $PROJECT_ROOT/app/ios" \
            "$REPORT_DIR/ios-basic.log" \
            "true"

        run_test \
            "Podfile exists" \
            "test -f $PROJECT_ROOT/app/ios/Podfile" \
            "$REPORT_DIR/ios-podfile.log" \
            "true"
    fi
}

# Generate summary report
generate_summary() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))

    # Create JSON summary
    cat > "$REPORT_DIR/summary.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "duration_seconds": $duration,
  "total_tests": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "skipped": $SKIPPED_TESTS,
  "phases": {
    "phase_0": $PHASE_0,
    "phase_1": $PHASE_1,
    "phase_2": $PHASE_2,
    "phase_3": $PHASE_3,
    "phase_4": $PHASE_4,
    "phase_5": $PHASE_5
  }
}
EOF

    # Print summary
    print_header "Test Summary"
    echo "Duration: ${minutes}m ${seconds}s"
    echo ""
    echo -e "Total Tests:   $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC}        $PASSED_TESTS"
    echo -e "${RED}Failed:${NC}        $FAILED_TESTS"
    echo -e "${MAGENTA}Skipped:${NC}       $SKIPPED_TESTS"
    echo ""

    if [[ $FAILED_TESTS -eq 0 ]]; then
        print_success "All tests passed!"
        echo ""
        echo "Detailed reports: $REPORT_DIR/"
        return 0
    else
        print_failure "$FAILED_TESTS test(s) failed"
        echo ""
        echo "Check logs in: $REPORT_DIR/"
        echo ""
        echo "Failed test logs:"
        for log in "$REPORT_DIR"/*.log; do
            if grep -q "error\|Error\|ERROR\|FAIL\|failed" "$log" 2>/dev/null; then
                echo "  - $(basename "$log")"
            fi
        done
        return 1
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Parse arguments
    parse_args "$@"

    # Setup
    setup_tests

    # Run tests for each phase
    test_phase_0 || true
    test_phase_1 || true
    test_phase_2 || true
    test_phase_3 || true
    test_phase_4 || true
    test_phase_5 || true
    test_ios_config || true

    # Generate summary
    if generate_summary; then
        exit 0
    else
        exit 1
    fi
}

# Run main
main "$@"
