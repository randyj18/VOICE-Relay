# Pre-Commit Bloat-Check Skill Creation Prompt

**For**: Claude Code on the Web
**Goal**: Create an intelligent, learnable skill that reviews commit deltas before committing
**Purpose**: Ensure alignment with North Star principles, prevent bloat, increase autonomous agency

---

## Current Project Status

**VOICE Relay** is a voice-operated interface for context engines with a strict **North Star principle**:

> **"Be the fastest, simplest, most secure relay for a voice conversation."**

**Current Challenge**:
During development, there's a tendency to:
- Create excessive documentation (20+ markdown files created in one session)
- Add unnecessary dependencies
- Implement features that don't serve the North Star
- Reduce code clarity with over-engineering

**Current Protection**:
- [.git/hooks/pre-commit](.git/hooks/pre-commit) exists but is basic
- Checks for documentation bloat (max 2 docs per commit)
- Requires manual North Star confirmation
- Not learnable or improvable by AI

**The Goal**:
Replace/enhance the pre-commit hook with an intelligent Claude Skill that:
1. Reviews commit deltas automatically
2. Validates North Star alignment
3. Prevents bloat (documentation, dependencies, code)
4. Ensures proper use of Claude Skills vs static docs
5. Validates testing improvements
6. Increases AI agency over the project
7. **Learns and improves over time**

---

## North Star Principle (from CLAUDE.md)

Your North Star is: **"Be the fastest, simplest, and most secure relay for a voice conversation."**

Before committing ANY code, you MUST ask yourself:

1. **Does this feature add complexity, or does it directly serve the North Star?**
2. **Is this the simplest possible way to implement this requirement?**
3. **Am I adding bloat?**

**AVOID BLOAT AT ALL COSTS**. Do not add:
- Unnecessary documentation (e.g., placeholder "todo" docs)
- Temporary test files that aren't part of the core test suite
- Complex UI animations, themes, or settings that are not explicitly asked for
- Dependencies on libraries that are not absolutely essential

---

## Your Task

Create a comprehensive, learnable Claude Skill that acts as an intelligent pre-commit reviewer.

### 1. Skill Structure

Create the skill in `.claude/skills/reviewing-commits/`:

```
.claude/skills/reviewing-commits/
├── SKILL.md                    # Main skill file (< 500 lines)
├── north-star-checklist.md     # Detailed North Star validation criteria
├── bloat-patterns.md           # Known bloat patterns to detect
├── learning-log.md             # Track decisions and improve over time
└── scripts/
    └── analyze-delta.sh        # Optional: Automated delta analysis script
```

### 2. SKILL.md Structure

```yaml
---
name: reviewing-commits
description: Review commit deltas before committing to ensure North Star alignment, prevent bloat, validate proper use of skills vs documentation, and increase autonomous agency. Use before any git commit operation.
version: 1.0.0
allowed-tools: ["Bash", "Read", "Grep", "Edit"]
dependencies: []
auto-invoke: ["commit", "pre-commit", "git add", "staging changes"]
---

# Reviewing Commits - North Star Alignment Check

Intelligent pre-commit review to ensure every commit serves the North Star.

## Quick Checklist

Before ANY commit, verify:

1. ✅ **North Star Alignment**: Does this change make VOICE Relay faster, simpler, or more secure?
2. ✅ **Bloat Check**: Am I adding unnecessary files, dependencies, or complexity?
3. ✅ **Skills vs Docs**: Should this documentation be a skill instead?
4. ✅ **Testing Value**: Are new tests meaningful and executable?
5. ✅ **Agency Increase**: Does this improve AI's ability to work autonomously?

## North Star Validation

[Core validation logic - see north-star-checklist.md for details]

## Bloat Detection

[Known bloat patterns - see bloat-patterns.md for details]

## Learning Mechanism

[How this skill improves over time - see learning-log.md]

## Detailed Procedures

See [north-star-checklist.md](north-star-checklist.md) for complete validation procedures.
```

### 3. Core Validation Logic

The skill must check the commit delta against these criteria:

#### A) North Star Alignment Check

**For each changed file, ask**:
1. Does this make VOICE Relay **faster**?
   - Reduces latency in voice loop
   - Optimizes encryption/decryption
   - Improves API response time
   - Reduces app startup time

2. Does this make VOICE Relay **simpler**?
   - Reduces code complexity
   - Removes unnecessary abstractions
   - Simplifies user interaction
   - Reduces configuration options

3. Does this make VOICE Relay **more secure**?
   - Strengthens E2EE implementation
   - Improves key management
   - Reduces attack surface
   - Enhances zero-knowledge architecture

**If answer is "no" to all three**: ❌ Reject commit, provide reasoning

#### B) Documentation Bloat Check

**Rules**:
- Max 2 documentation files per commit (existing rule)
- No "summary" documents (HANDOFF_SUMMARY, SESSION_SUMMARY, etc.)
- No duplicate guides (e.g., iOS_SETUP.md + IOS_QUICK_START.md + iOS_SETUP_GUIDE.md)
- Documentation must be necessary reference material, not procedural knowledge

**For each .md file added/modified**:
1. Could this be a Claude Skill instead?
   - If it teaches HOW to do something → Should be a skill
   - If it's a static reference (API docs) → OK as markdown

2. Does this duplicate existing documentation?
   - Check for overlapping content
   - Suggest consolidation if duplicate

3. Is this a "session report" or "summary"?
   - These should be archived, not committed to active repo

**Action**:
- ✅ Allow if passes checks
- ⚠️ Warn if borderline (let AI decide with reasoning)
- ❌ Block if clear bloat (>2 docs, duplicate, should be skill)

#### C) Dependency Bloat Check

**For `package.json` changes**:
1. Is this dependency absolutely essential?
   - React Native core dependencies: ✅ OK
   - Voice libraries (react-native-voice, react-native-tts): ✅ OK
   - Encryption (node-forge): ✅ OK (until native replacement)
   - UI libraries (animation, theming): ❌ Bloat unless explicitly required

2. Does this increase bundle size significantly?
   - Check package size (warn if >1MB)
   - Suggest alternatives if large

3. Does this add unnecessary complexity?
   - State management libraries (Redux, MobX): ❌ Bloat (use React state)
   - Form libraries: ❌ Bloat (build simple forms)
   - Utility libraries (lodash): ❌ Bloat (use native JS)

**Action**:
- ✅ Allow essential dependencies
- ⚠️ Warn for large but justified dependencies
- ❌ Block unnecessary dependencies

#### D) Code Complexity Check

**For code file changes** (.ts, .tsx, .js):
1. Does this add unnecessary abstraction?
   - Excessive interfaces/types not used
   - Over-engineered class hierarchies
   - Premature optimization

2. Does this increase cyclomatic complexity significantly?
   - Deep nesting (>3 levels)
   - Long functions (>50 lines)
   - Many conditional branches

3. Could this be simpler?
   - Suggest simplification if complex

**Action**:
- ✅ Allow if complexity is justified
- ⚠️ Warn if complexity is high, ask for justification
- ❌ Block if obviously over-engineered

#### E) Testing Value Check

**For test file changes**:
1. Are these tests executable autonomously?
   - No device-only tests (unless clearly marked as future)
   - Clear goals and expected outcomes

2. Do these tests provide meaningful validation?
   - Not just coverage for coverage's sake
   - Test critical paths and edge cases

3. Are tests well-documented?
   - Clear test names describing what's being tested
   - Comments explaining complex test logic

**Action**:
- ✅ Allow valuable, executable tests
- ⚠️ Warn if tests seem low-value
- ❌ Block if tests are untestable in current environment without acknowledgment

#### F) Skills Usage Check

**For new procedural documentation**:
1. Should this be a Claude Skill?
   - Procedural knowledge ("how to test", "how to deploy"): → Skill
   - Reference material (API docs, architecture): → Markdown OK

2. Is an existing skill being ignored?
   - Check `.claude/skills/` for relevant skills
   - Suggest using skill instead of creating new docs

**Action**:
- ⚠️ Suggest converting to skill if appropriate
- ✅ Allow if genuinely better as markdown

#### G) Agency Increase Check

**Overall commit assessment**:
1. Does this make it easier for AI to work autonomously?
   - Better error messages
   - Clearer test output
   - More automated scripts
   - Better skill documentation

2. Does this reduce manual intervention required?
   - Automated vs manual steps
   - Clear success/failure criteria

**Action**:
- ✅ Highlight and encourage agency-increasing changes
- ⚠️ Warn if change reduces agency

### 4. Learning Mechanism

The skill should **learn and improve over time**:

#### A) Decision Logging

**Track every commit review in `learning-log.md`**:

```markdown
# Reviewing Commits - Learning Log

## 2025-11-15 - Commit abc123

**Changes**: Added 3 iOS setup guides
**Decision**: ❌ Blocked - documentation bloat
**Reasoning**: 3 guides cover same topic, should be 1 skill
**Outcome**: Files consolidated into `.claude/skills/deploying-voice-relay-ios/`
**Learning**: Always check for duplicate guides before allowing multiple docs

## 2025-11-15 - Commit def456

**Changes**: Added `lodash` dependency
**Decision**: ❌ Blocked - unnecessary dependency
**Reasoning**: Only used for `_.debounce`, can use native implementation
**Outcome**: Replaced with custom debounce function (8 lines)
**Learning**: Always check if dependency can be replaced with native JS
```

#### B) Pattern Recognition

**Identify patterns in past decisions**:
- What types of bloat are most common?
- What justifications were accepted/rejected?
- What alternative solutions worked well?

**Update `bloat-patterns.md`** with new patterns:

```markdown
# Known Bloat Patterns

## Documentation Bloat

### Pattern: Multiple Setup Guides
**Symptom**: Files like `SETUP.md`, `QUICK_START.md`, `SETUP_GUIDE.md`
**Problem**: Duplicate content, confusion
**Solution**: One `SETUP.md` or convert to skill
**Frequency**: 3 occurrences
**Last seen**: 2025-11-15

### Pattern: Session Summaries
**Symptom**: Files like `SESSION_SUMMARY.txt`, `HANDOFF_REPORT.md`
**Problem**: Snapshots in time, quickly outdated
**Solution**: Archive to `.archive/` or delete
**Frequency**: 5 occurrences
**Last seen**: 2025-11-15
```

#### C) Skill Evolution

**Periodically update the skill**:
- Add new bloat patterns to detection logic
- Refine North Star alignment criteria
- Improve decision-making based on past outcomes

**Version the skill** (increment `version` in YAML frontmatter):
- v1.0.0: Initial implementation
- v1.1.0: Added iOS-specific bloat patterns
- v1.2.0: Improved dependency size checking

### 5. Integration with Git Workflow

**Two integration options**:

#### Option A: Enhance Existing Pre-Commit Hook

Update [.git/hooks/pre-commit](.git/hooks/pre-commit) to invoke the skill:

```bash
#!/bin/bash

# Invoke Claude skill for commit review
# This requires Claude Code to be running

echo "🔍 Reviewing commit with North Star alignment check..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

# Check if Claude Code is available
if command -v claude &> /dev/null; then
  # Invoke skill (this is conceptual - actual invocation depends on Claude CLI)
  claude skill reviewing-commits --files "$STAGED_FILES"
else
  echo "⚠️  Claude Code not available, performing basic checks..."

  # Fallback to basic checks
  DOC_COUNT=$(echo "$STAGED_FILES" | grep -c '\.md$' || true)
  if [ "$DOC_COUNT" -gt 2 ]; then
    echo "❌ BLOCKED: More than 2 documentation files in commit"
    echo "   North Star: Avoid documentation bloat"
    exit 1
  fi
fi
```

#### Option B: Manual Skill Invocation

**Before committing, AI should**:
1. Review staged changes: `git diff --cached`
2. Invoke the `reviewing-commits` skill (auto-invoked when "commit" mentioned)
3. Skill performs all checks
4. Skill provides ✅ approval or ❌ rejection with reasoning
5. AI addresses issues or proceeds with commit

### 6. Deliverables

Create the following artifacts:

1. **`.claude/skills/reviewing-commits/SKILL.md`**
   - Main skill file with YAML frontmatter
   - Quick checklist for fast reviews
   - Core validation logic (or references to detail files)
   - Learning mechanism overview

2. **`.claude/skills/reviewing-commits/north-star-checklist.md`**
   - Detailed criteria for North Star alignment
   - Examples of aligned vs misaligned changes
   - Decision trees for complex cases

3. **`.claude/skills/reviewing-commits/bloat-patterns.md`**
   - Comprehensive list of known bloat patterns
   - Detection rules for each pattern
   - Suggested alternatives/solutions
   - Frequency and last occurrence tracking

4. **`.claude/skills/reviewing-commits/learning-log.md`**
   - Template for logging commit review decisions
   - Historical decisions (initially empty)
   - Pattern analysis section
   - Skill evolution history

5. **`.claude/skills/reviewing-commits/scripts/analyze-delta.sh`** (optional)
   - Automated script to analyze commit delta
   - Checks file counts, sizes, types
   - Outputs structured data for skill to review

6. **Updated `.git/hooks/pre-commit`** (optional)
   - Enhanced to invoke skill
   - Fallback to basic checks if Claude unavailable

7. **Updated `CLAUDE.md`** (if needed)
   - Reference to the new skill
   - Commitment workflow update
   - Emphasis on using skill before committing

### 7. Example Skill Usage

**Scenario**: AI is about to commit 3 new iOS setup guides

**Skill invocation**:
```
AI: I'm about to commit these changes:
- iOS_QUICK_START.md (new)
- IOS_SETUP.md (new)
- iOS_SETUP_GUIDE.md (new)

Invoking reviewing-commits skill...
```

**Skill analysis**:
```
🔍 Reviewing Commit Delta

Files changed: 3
Documentation files: 3 (❌ exceeds max of 2)

North Star Alignment:
❌ Does not make VOICE Relay faster
❌ Does not make VOICE Relay simpler (adds complexity via multiple guides)
❌ Does not make VOICE Relay more secure

Bloat Detection:
❌ Documentation bloat: 3 guides cover same topic (iOS setup)
❌ Pattern match: "Multiple Setup Guides" (see bloat-patterns.md)

Skills vs Docs:
⚠️  This procedural knowledge should be a Claude Skill
💡 Suggestion: Create `.claude/skills/deploying-voice-relay-ios/` instead

Decision: ❌ BLOCK COMMIT

Recommendation:
1. Consolidate all iOS setup content
2. Create `.claude/skills/deploying-voice-relay-ios/SKILL.md`
3. Move detailed steps to reference file
4. Archive or delete redundant guides
```

**AI response**:
```
AI: The reviewing-commits skill blocked this commit.
Creating `.claude/skills/deploying-voice-relay-ios/` skill instead...

[Creates skill]

New commit will include:
- .claude/skills/deploying-voice-relay-ios/SKILL.md (new)
- .claude/skills/deploying-voice-relay-ios/detailed-setup.md (new)

Invoking reviewing-commits skill again...
```

**Skill re-analysis**:
```
🔍 Reviewing Commit Delta

Files changed: 2
Skills created: 1
Documentation files: 0

North Star Alignment:
✅ Makes VOICE Relay simpler (skill auto-invokes, reduces manual doc searching)
✅ Increases AI agency (skill provides just-in-time knowledge)

Bloat Detection:
✅ No bloat patterns detected

Skills vs Docs:
✅ Properly using skill for procedural knowledge

Agency Increase:
✅ Skill increases autonomous deployment capability

Decision: ✅ APPROVE COMMIT

Commit message suggestion:
"Create iOS deployment skill for autonomous setup

- Add .claude/skills/deploying-voice-relay-ios/ skill
- Auto-invokes when deploying or building iOS
- Consolidates setup knowledge in one location
- Increases AI agency for iOS deployment"

Logging decision to learning-log.md...
```

### 8. Success Criteria

- ✅ Skill created in `.claude/skills/reviewing-commits/`
- ✅ All 7 validation checks implemented (A-G above)
- ✅ Learning mechanism with decision logging
- ✅ Bloat patterns catalog
- ✅ North Star checklist with examples
- ✅ Optional automation script for delta analysis
- ✅ Integration with git workflow (hook or manual)
- ✅ Skill auto-invokes before commits
- ✅ Clear approval/rejection with reasoning
- ✅ Suggestions for improvement when blocking
- ✅ Learning log template ready to use

### 9. Continuous Improvement Plan

**How the skill evolves**:

1. **After each commit review**: Log decision in `learning-log.md`
2. **Weekly**: Review learning log, identify patterns
3. **Monthly**: Update `bloat-patterns.md` with new patterns
4. **Quarterly**: Analyze effectiveness, refine North Star criteria
5. **As needed**: Increment skill version, update SKILL.md

**AI should proactively**:
- Suggest skill improvements based on recurring issues
- Add new bloat patterns when discovered
- Refine decision criteria based on outcomes
- Update CLAUDE.md if workflow changes

### 10. Integration with Other Skills

**This skill should coordinate with**:
- `testing-voice-relay`: Validate test improvements before committing
- `deploying-voice-relay-ios`: Ensure iOS commits follow deployment best practices
- `voice-relay-backend-integration`: Validate backend changes don't break integration

**Cross-skill validation**:
If a commit touches iOS code, invoke both `reviewing-commits` and `deploying-voice-relay-ios` to ensure:
1. North Star alignment (reviewing-commits)
2. iOS best practices (deploying-voice-relay-ios)

---

## Notes

- This skill is foundational to preventing bloat and maintaining focus
- It should be strict but provide clear reasoning and alternatives
- The learning mechanism makes it increasingly valuable over time
- AI should use this skill religiously before every commit
- The skill can be temporarily overridden with explicit justification (logged for learning)

Start by creating the skill structure and implementing the core validation logic.
