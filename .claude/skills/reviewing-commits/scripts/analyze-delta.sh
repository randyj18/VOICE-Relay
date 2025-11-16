#!/bin/bash

# analyze-delta.sh
# Automated commit delta analysis for reviewing-commits skill
# Provides structured data about staged changes for AI review

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emoji for visual feedback
CHECK="✅"
WARN="⚠️"
BLOCK="❌"
INFO="ℹ️"

echo "🔍 Analyzing Commit Delta"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if there are staged changes
if ! git diff --cached --quiet 2>/dev/null; then
  : # There are staged changes, continue
else
  echo "${BLOCK} No staged changes to analyze"
  echo ""
  echo "Run: git add <files>"
  exit 1
fi

# Initialize counters
total_files=0
doc_files=0
code_files=0
test_files=0
config_files=0
skill_files=0

# Initialize arrays for file categorization
declare -a doc_file_list
declare -a code_file_list
declare -a test_file_list
declare -a config_file_list
declare -a skill_file_list

# Get list of staged files
staged_files=$(git diff --cached --name-only)

# Analyze each file
while IFS= read -r file; do
  ((total_files++))

  case "$file" in
    *.md)
      ((doc_files++))
      doc_file_list+=("$file")
      ;;
    *.ts|*.tsx|*.js|*.jsx|*.py)
      if [[ "$file" == *test* ]] || [[ "$file" == *spec* ]]; then
        ((test_files++))
        test_file_list+=("$file")
      else
        ((code_files++))
        code_file_list+=("$file")
      fi
      ;;
    package.json|package-lock.json|requirements.txt|Pipfile|Pipfile.lock)
      ((config_files++))
      config_file_list+=("$file")
      ;;
    .claude/skills/*)
      ((skill_files++))
      skill_file_list+=("$file")
      ;;
    *)
      # Other file types
      ;;
  esac
done <<< "$staged_files"

# Display file summary
echo "${INFO} File Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total files:         $total_files"
echo "Documentation:       $doc_files"
echo "Code files:          $code_files"
echo "Test files:          $test_files"
echo "Config files:        $config_files"
echo "Skill files:         $skill_files"
echo ""

# Documentation Bloat Check
echo "${INFO} Documentation Bloat Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $doc_files -eq 0 ] && [ $skill_files -eq 0 ]; then
  echo "${CHECK} No documentation changes"
elif [ $doc_files -gt 2 ]; then
  echo "${BLOCK} Exceeds documentation limit: $doc_files files (max 2)"
  echo "Files:"
  for f in "${doc_file_list[@]}"; do
    echo "  - $f"
  done
elif [ $doc_files -gt 0 ]; then
  echo "${WARN} Documentation files: $doc_files (approaching limit of 2)"
  echo "Files:"
  for f in "${doc_file_list[@]}"; do
    echo "  - $f"
  done

  # Check for procedural documentation patterns
  for f in "${doc_file_list[@]}"; do
    if [[ "$f" =~ (HOW_TO|HOWTO|STEPS|PROCEDURES|GUIDE|SETUP|DEPLOY) ]]; then
      echo "${WARN} Potential procedural doc: $f"
      echo "    Consider converting to Claude Skill"
    fi

    if [[ "$f" =~ (SESSION|SUMMARY|HANDOFF|NOTES|LOG) ]]; then
      echo "${BLOCK} Session/summary doc: $f"
      echo "    Should be archived, not committed"
    fi
  done
else
  echo "${CHECK} No markdown documentation changes"
fi

if [ $skill_files -gt 0 ]; then
  echo "${CHECK} Skill files added: $skill_files"
  echo "Files:"
  for f in "${skill_file_list[@]}"; do
    echo "  - $f"
  done
fi

echo ""

# Dependency Bloat Check
echo "${INFO} Dependency Bloat Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $config_files -eq 0 ]; then
  echo "${CHECK} No dependency changes"
else
  for config in "${config_file_list[@]}"; do
    echo "Checking: $config"

    # Check for bloat patterns in package.json
    if [ "$config" = "package.json" ]; then
      # Check for utility libraries
      if git diff --cached "$config" | grep -qE '\+.*"(lodash|underscore|ramda|moment)"'; then
        echo "${WARN} Utility library detected"
        echo "    Consider native JS implementation"
      fi

      # Check for state management
      if git diff --cached "$config" | grep -qE '\+.*"(redux|mobx|zustand|recoil)"'; then
        echo "${BLOCK} State management library detected"
        echo "    VOICE Relay should use React state"
      fi

      # Check for UI libraries
      if git diff --cached "$config" | grep -qE '\+.*"(native-base|react-native-elements|react-native-paper)"'; then
        echo "${WARN} UI component library detected"
        echo "    Consider building custom components"
      fi

      # List added dependencies
      added_deps=$(git diff --cached "$config" | grep -E '^\+.*".*":' | grep -v '^\+\+\+' | sed 's/^\+[ ]*//')
      if [ -n "$added_deps" ]; then
        echo "${INFO} Added dependencies:"
        echo "$added_deps"
      fi
    fi
  done
fi

echo ""

# Code Complexity Check
echo "${INFO} Code Complexity Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $code_files -eq 0 ]; then
  echo "${CHECK} No code changes"
else
  for code in "${code_file_list[@]}"; do
    # Check file size
    if [ -f "$code" ]; then
      lines=$(wc -l < "$code" 2>/dev/null || echo 0)

      if [ "$lines" -gt 500 ]; then
        echo "${WARN} Large file: $code ($lines lines)"
        echo "    Consider splitting into smaller files"
      elif [ "$lines" -gt 300 ]; then
        echo "${INFO} Medium file: $code ($lines lines)"
      fi
    fi

    # Check for deep nesting (4+ levels)
    deep_nesting=$(git diff --cached "$code" | grep -cE '^\+\s{16,}(if|for|while)' || true)
    if [ "$deep_nesting" -gt 0 ]; then
      echo "${WARN} Deep nesting detected in $code"
      echo "    Found $deep_nesting instances of 4+ level nesting"
      echo "    Consider early returns or extracting functions"
    fi

    # Check for commented code blocks
    commented_blocks=$(git diff --cached "$code" | grep -cE '^\+\s*//(.*\(|.*\{|.*function)' || true)
    if [ "$commented_blocks" -gt 3 ]; then
      echo "${WARN} Commented code detected in $code"
      echo "    Found $commented_blocks commented code lines"
      echo "    Git history preserves old code - consider deleting"
    fi
  done
fi

echo ""

# Test Value Check
echo "${INFO} Test Value Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $test_files -eq 0 ]; then
  echo "${INFO} No test changes"
else
  for test in "${test_file_list[@]}"; do
    echo "Analyzing: $test"

    # Check for device-only tests without acknowledgment
    if git diff --cached "$test" | grep -qE '(Camera|Microphone|Voice|GPS)' && \
       ! git diff --cached "$test" | grep -qE '(DEVICE-ONLY|TODO.*mock|skip.*device)'; then
      echo "${WARN} Potential device-only test without acknowledgment"
      echo "    Consider adding DEVICE-ONLY marker or mock"
    fi

    # Count test cases
    test_count=$(git diff --cached "$test" | grep -cE '^\+.*(test|it)\(' || true)
    if [ "$test_count" -gt 0 ]; then
      echo "${CHECK} Added $test_count test case(s)"
    fi
  done
fi

echo ""

# North Star Alignment Check
echo "${INFO} North Star Alignment Guidance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "For each change, verify:"
echo ""
echo "1. ${CHECK} Does this make VOICE Relay FASTER?"
echo "   → Reduces latency, optimizes performance, decreases bundle size"
echo ""
echo "2. ${CHECK} Does this make VOICE Relay SIMPLER?"
echo "   → Reduces complexity, removes abstraction, consolidates code"
echo ""
echo "3. ${CHECK} Does this make VOICE Relay MORE SECURE?"
echo "   → Strengthens E2EE, improves keys, reduces attack surface"
echo ""
echo "If NO to all three → ${BLOCK} REJECT COMMIT"
echo ""

# Stats output
echo "${INFO} Detailed Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Lines changed
lines_added=$(git diff --cached --numstat | awk '{sum+=$1} END {print sum}')
lines_removed=$(git diff --cached --numstat | awk '{sum+=$2} END {print sum}')

echo "Lines added:         ${lines_added:-0}"
echo "Lines removed:       ${lines_removed:-0}"
echo "Net change:          $((${lines_added:-0} - ${lines_removed:-0}))"
echo ""

# Check for duplicate file names (bloat pattern)
echo "${INFO} Checking for Duplicate Documentation Patterns"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for common duplicate patterns
for word in setup guide howto testing deployment android ios backend; do
  count=$(echo "$staged_files" | grep -iE "$word.*\.md$" | wc -l)
  if [ "$count" -gt 1 ]; then
    echo "${WARN} Multiple '$word' documents detected: $count"
    echo "$staged_files" | grep -iE "$word.*\.md$" | while read -r file; do
      echo "    - $file"
    done
    echo "    Consider consolidating into one document or skill"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${INFO} Analysis Complete"
echo ""
echo "Next steps:"
echo "1. Review analysis results above"
echo "2. Address any ${BLOCK} blocking issues"
echo "3. Consider ${WARN} warnings carefully"
echo "4. Proceed with commit if all checks pass"
echo ""
echo "Run: git commit -m \"your message\""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
