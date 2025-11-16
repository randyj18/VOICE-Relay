---
name: reviewing-commits
description: Review commit deltas before committing to ensure North Star alignment, prevent bloat, validate proper use of skills vs documentation, and increase autonomous agency. Use before any git commit operation.
version: 1.0.0
allowed-tools: ["Bash", "Read", "Grep", "Edit"]
dependencies: []
auto-invoke: ["commit", "pre-commit", "git add", "staging changes"]
---

# Reviewing Commits - North Star Alignment Check

Intelligent pre-commit review to ensure every commit serves the North Star:

> **"Be the fastest, simplest, most secure relay for a voice conversation."**

## Quick Checklist

Before ANY commit, verify:

1. ✅ **North Star Alignment**: Does this change make VOICE Relay faster, simpler, or more secure?
2. ✅ **Bloat Check**: Am I adding unnecessary files, dependencies, or complexity?
3. ✅ **Skills vs Docs**: Should this documentation be a skill instead?
4. ✅ **Testing Value**: Are new tests meaningful and executable?
5. ✅ **Agency Increase**: Does this improve AI's ability to work autonomously?

## Usage

**Automatic Invocation**: This skill auto-invokes when you mention "commit", "pre-commit", or "staging changes".

**Manual Invocation**: You can also explicitly invoke this skill before committing:

```bash
# Stage your changes
git add <files>

# Review staged changes with this skill
# The skill will analyze: git diff --cached
```

**Workflow**:
1. Stage changes with `git add`
2. Skill reviews the delta automatically or on invocation
3. Skill provides ✅ approval or ❌ rejection with reasoning
4. Address issues or proceed with commit
5. Skill logs decision to learning-log.md

## Core Validation Logic

### A) North Star Alignment Check

For each changed file, ask:

**1. Does this make VOICE Relay FASTER?**
- ✅ Reduces latency in voice loop
- ✅ Optimizes encryption/decryption
- ✅ Improves API response time
- ✅ Reduces app startup time
- ✅ Decreases bundle size
- ❌ Adds unnecessary processing steps
- ❌ Increases network roundtrips

**2. Does this make VOICE Relay SIMPLER?**
- ✅ Reduces code complexity
- ✅ Removes unnecessary abstractions
- ✅ Simplifies user interaction
- ✅ Reduces configuration options
- ✅ Consolidates duplicate functionality
- ❌ Adds new dependencies
- ❌ Creates additional UI complexity
- ❌ Introduces new configuration

**3. Does this make VOICE Relay MORE SECURE?**
- ✅ Strengthens E2EE implementation
- ✅ Improves key management
- ✅ Reduces attack surface
- ✅ Enhances zero-knowledge architecture
- ✅ Adds security testing
- ❌ Weakens encryption
- ❌ Exposes sensitive data
- ❌ Increases attack vectors

**Decision Rule**: If answer is "no" to ALL THREE → ❌ **REJECT COMMIT** with reasoning

### B) Documentation Bloat Check

**Rules**:
- Max 2 documentation files per commit
- No "summary" documents (HANDOFF_SUMMARY, SESSION_SUMMARY, etc.)
- No duplicate guides (e.g., iOS_SETUP.md + IOS_QUICK_START.md + iOS_SETUP_GUIDE.md)
- Documentation must be necessary reference material, not procedural knowledge

**For each .md file added/modified**:

1. **Could this be a Claude Skill instead?**
   - If it teaches HOW to do something → Should be a skill
   - If it's static reference (API docs) → OK as markdown

2. **Does this duplicate existing documentation?**
   - Check for overlapping content
   - Suggest consolidation if duplicate

3. **Is this a "session report" or "summary"?**
   - These should be archived, not committed to active repo

**Actions**:
- ✅ **ALLOW** if passes checks
- ⚠️ **WARN** if borderline (let AI decide with reasoning)
- ❌ **BLOCK** if clear bloat (>2 docs, duplicate, should be skill)

### C) Dependency Bloat Check

**For package.json changes**:

1. **Is this dependency absolutely essential?**
   - React Native core dependencies: ✅ OK
   - Voice libraries (react-native-voice, react-native-tts): ✅ OK
   - Encryption (node-forge): ✅ OK (until native replacement)
   - Keep awake (react-native-keep-awake): ✅ OK
   - UI libraries (animation, theming): ❌ Bloat unless explicitly required
   - State management (Redux, MobX): ❌ Bloat (use React state)
   - Form libraries: ❌ Bloat (build simple forms)
   - Utility libraries (lodash): ❌ Bloat (use native JS)

2. **Does this increase bundle size significantly?**
   - Check package size (warn if >1MB)
   - Suggest alternatives if large

3. **Does this add unnecessary complexity?**
   - Does it require configuration?
   - Does it introduce new patterns?
   - Can we achieve the same with less?

**Actions**:
- ✅ **ALLOW** essential dependencies
- ⚠️ **WARN** for large but justified dependencies
- ❌ **BLOCK** unnecessary dependencies

### D) Code Complexity Check

**For code file changes** (.ts, .tsx, .js, .py):

1. **Does this add unnecessary abstraction?**
   - Excessive interfaces/types not used
   - Over-engineered class hierarchies
   - Premature optimization
   - Generic solutions for specific problems

2. **Does this increase cyclomatic complexity significantly?**
   - Deep nesting (>3 levels)
   - Long functions (>50 lines)
   - Many conditional branches
   - Complex boolean logic

3. **Could this be simpler?**
   - Is there a more straightforward approach?
   - Are all abstractions necessary?
   - Can we reduce the number of files?

**Actions**:
- ✅ **ALLOW** if complexity is justified
- ⚠️ **WARN** if complexity is high, ask for justification
- ❌ **BLOCK** if obviously over-engineered

### E) Testing Value Check

**For test file changes**:

1. **Are these tests executable autonomously?**
   - No device-only tests (unless clearly marked as future)
   - Clear goals and expected outcomes
   - Can run in CI/CD environment

2. **Do these tests provide meaningful validation?**
   - Not just coverage for coverage's sake
   - Test critical paths and edge cases
   - Validate core functionality

3. **Are tests well-documented?**
   - Clear test names describing what's being tested
   - Comments explaining complex test logic
   - Expected outcomes clearly stated

**Actions**:
- ✅ **ALLOW** valuable, executable tests
- ⚠️ **WARN** if tests seem low-value
- ❌ **BLOCK** if tests are untestable in current environment without acknowledgment

### F) Skills Usage Check

**For new procedural documentation**:

1. **Should this be a Claude Skill?**
   - Procedural knowledge ("how to test", "how to deploy"): → Skill
   - Reference material (API docs, architecture): → Markdown OK

2. **Is an existing skill being ignored?**
   - Check `.claude/skills/` for relevant skills
   - Suggest using skill instead of creating new docs

**Actions**:
- ⚠️ **SUGGEST** converting to skill if appropriate
- ✅ **ALLOW** if genuinely better as markdown

### G) Agency Increase Check

**Overall commit assessment**:

1. **Does this make it easier for AI to work autonomously?**
   - Better error messages
   - Clearer test output
   - More automated scripts
   - Better skill documentation
   - Self-documenting code

2. **Does this reduce manual intervention required?**
   - Automated vs manual steps
   - Clear success/failure criteria
   - Actionable error messages

**Actions**:
- ✅ **HIGHLIGHT** and encourage agency-increasing changes
- ⚠️ **WARN** if change reduces agency

## Review Process

### Step 1: Analyze Staged Changes

```bash
# Get list of staged files
git diff --cached --name-only

# Get detailed diff
git diff --cached

# Check file types and counts
git diff --cached --name-only | grep -E '\.(md|json|ts|tsx|js|py)$'
```

### Step 2: Apply Validation Checks

Run through checks A-G above for each changed file.

### Step 3: Generate Report

Provide structured output:

```
🔍 Reviewing Commit Delta

Files changed: X
- Documentation files: Y
- Code files: Z
- Test files: W
- Config files: V

✅ North Star Alignment:
  [Analysis for each file]

✅ Bloat Detection:
  [Results of bloat checks]

✅ Skills vs Docs:
  [Recommendations]

✅ Testing Value:
  [Test assessment]

✅ Agency Increase:
  [Impact on autonomy]

Decision: ✅ APPROVE / ⚠️ WARN / ❌ BLOCK

[Detailed reasoning]
[Suggestions for improvement if blocking]
```

### Step 4: Log Decision

Append to `learning-log.md`:

```markdown
## YYYY-MM-DD - Commit [short-hash]

**Changes**: [Brief description]
**Decision**: ✅/⚠️/❌ [Reasoning]
**Outcome**: [What happened]
**Learning**: [What to remember for next time]
```

## Learning Mechanism

This skill **learns and improves over time** through:

1. **Decision Logging**: Every commit review is logged in `learning-log.md`
2. **Pattern Recognition**: Identify recurring bloat patterns
3. **Skill Evolution**: Update validation criteria based on learnings

See [learning-log.md](learning-log.md) for historical decisions and patterns.

## Bloat Pattern Detection

Common bloat patterns are cataloged in [bloat-patterns.md](bloat-patterns.md).

The skill actively detects:
- Multiple setup guides for same topic
- Session summaries and handoff reports
- Duplicate documentation with different names
- Unnecessary npm packages
- Over-abstracted code
- Low-value tests

## Integration with Git Workflow

### Option A: Manual Invocation (Recommended)

1. Stage changes: `git add <files>`
2. Invoke this skill (auto-invokes on "commit" mention)
3. Review skill output
4. Address issues or proceed
5. Commit: `git commit -m "message"`

### Option B: Pre-Commit Hook

The existing `.git/hooks/pre-commit` can invoke this skill automatically.

See [scripts/analyze-delta.sh](scripts/analyze-delta.sh) for automated analysis.

## Examples

### Example 1: Documentation Bloat Detected

**Staged Changes**:
- iOS_QUICK_START.md (new)
- IOS_SETUP.md (new)
- iOS_SETUP_GUIDE.md (new)

**Skill Analysis**:
```
❌ BLOCK COMMIT

Documentation bloat detected:
- 3 markdown files (exceeds max of 2)
- All cover same topic: iOS setup
- Pattern match: "Multiple Setup Guides"

North Star Impact:
❌ Does not make VOICE Relay faster
❌ Does not make VOICE Relay simpler (adds confusion)
❌ Does not make VOICE Relay more secure

Recommendation:
1. Consolidate all iOS setup content
2. Create `.claude/skills/ios-setup/` skill instead
3. Keep one reference document if needed
```

### Example 2: Approved Commit

**Staged Changes**:
- backend/encryption.py (modified)
- tests/test_encryption.py (modified)

**Skill Analysis**:
```
✅ APPROVE COMMIT

North Star Alignment:
✅ Makes VOICE Relay more secure
  - Upgraded from RSA-1024 to RSA-2048
  - Added key rotation mechanism

✅ Makes VOICE Relay simpler
  - Removed deprecated encryption methods
  - Consolidated key management

Testing Value:
✅ Tests verify RSA-2048 key generation
✅ Tests validate key rotation
✅ All tests pass autonomously

Agency Increase:
✅ Better error messages for key failures
✅ Clear test output with security implications

Suggested commit message:
"Enhance E2EE with RSA-2048 and key rotation

- Upgrade from RSA-1024 to RSA-2048 for stronger encryption
- Add automatic key rotation mechanism
- Remove deprecated encryption methods
- Add comprehensive encryption tests
- Improve error messages for key failures"
```

## Override Mechanism

In rare cases, you may need to override the skill's decision.

**Requirements**:
1. Explicit justification
2. Documented in commit message
3. Logged in learning-log.md with override reason
4. User approval if blocking decision

**Override format**:
```
Overriding reviewing-commits skill recommendation.

Skill Decision: ❌ BLOCK (documentation bloat)
Override Reason: [Detailed justification]
North Star Impact: [How this still serves North Star]
Temporary: [Is this temporary? When will it be removed?]
```

## Continuous Improvement

The skill evolves through:

**Weekly**: Review learning log, identify patterns
**Monthly**: Update bloat-patterns.md with new patterns
**Quarterly**: Analyze effectiveness, refine criteria
**As needed**: Increment version, update SKILL.md

See [north-star-checklist.md](north-star-checklist.md) for detailed validation procedures.

## Quick Reference

**Before EVERY commit**:
1. ✅ North Star aligned? (faster/simpler/more secure)
2. ✅ No bloat? (<2 docs, no duplicates, no unnecessary deps)
3. ✅ Skills used properly? (procedural → skill, reference → doc)
4. ✅ Tests valuable? (executable, meaningful)
5. ✅ Agency increased? (more autonomy, less manual work)

**If uncertain**: Invoke skill explicitly and review detailed analysis.

**Remember**: Every commit shapes the codebase. Make each one count toward the North Star.
