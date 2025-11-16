# Known Bloat Patterns

Catalog of bloat patterns detected in VOICE Relay development, with detection rules and solutions.

**Purpose**: Help the `reviewing-commits` skill recognize and prevent common bloat patterns automatically.

**Updated**: 2025-11-16 (v1.0.0)

---

## Documentation Bloat Patterns

### Pattern: Multiple Setup Guides

**Symptom**: Multiple files covering the same topic with slight variations in naming:
- `SETUP.md`, `QUICK_START.md`, `SETUP_GUIDE.md`
- `iOS_SETUP.md`, `IOS_QUICK_START.md`, `iOS_SETUP_GUIDE.md`
- `DEPLOYMENT.md`, `DEPLOY_GUIDE.md`, `HOW_TO_DEPLOY.md`

**Problem**:
- Confusion about which guide to follow
- Duplicate content requiring multiple updates
- Documentation drift (guides become inconsistent)
- Repository bloat

**Detection**:
```bash
# Check for multiple files with similar names
git diff --cached --name-only | grep -i setup | wc -l
git diff --cached --name-only | grep -i guide | wc -l
git diff --cached --name-only | grep -i start | wc -l
```

**Solution**:
1. **If procedural**: Convert to Claude Skill (e.g., `.claude/skills/ios-setup/`)
2. **If reference**: Consolidate into ONE comprehensive guide
3. **Delete or archive** redundant guides

**Frequency**: 3+ occurrences during initial development
**Last seen**: Documentation cleanup phase
**Auto-block**: ✅ Yes (when >2 similar docs in one commit)

---

### Pattern: Session Summaries

**Symptom**: Files documenting what happened in a development session:
- `SESSION_SUMMARY.txt`
- `HANDOFF_REPORT.md`
- `CLAUDE_SESSION_NOTES.md`
- `DEVELOPMENT_LOG.md`
- Files with timestamps in names (e.g., `SUMMARY_2025_11_15.md`)

**Problem**:
- Snapshots in time, quickly outdated
- Not actionable or reference material
- Clutters repository
- Belongs in git history, not active files

**Detection**:
```bash
# Check for summary/session/handoff files
git diff --cached --name-only | grep -iE '(session|summary|handoff|notes|log)\.md'
```

**Solution**:
1. **Archive** to `.archive/YYYY-MM-DD/` if historically valuable
2. **Delete** if information is already in git history
3. **Extract** any actionable items to TODO/issues
4. **Never commit** new session summaries

**Frequency**: 5+ occurrences during overnight sessions
**Last seen**: Documentation cleanup phase
**Auto-block**: ✅ Yes (always block session summaries)

---

### Pattern: Duplicate Documentation with Different Focus

**Symptom**: Multiple documents covering the same topic from different angles:
- `TESTING.md` (general testing)
- `TESTING_STRATEGY.md` (strategy)
- `HOW_TO_TEST.md` (procedural)
- `TEST_GUIDE.md` (guide)

**Problem**:
- Overlapping content
- Unclear which is authoritative
- Maintenance burden
- Users don't know which to read

**Detection**:
```bash
# Check for multiple docs with same root word
for word in testing deployment setup android ios backend; do
  count=$(git diff --cached --name-only | grep -i "$word" | grep '\.md$' | wc -l)
  if [ "$count" -gt 1 ]; then
    echo "⚠️  Multiple $word docs detected: $count"
  fi
done
```

**Solution**:
1. **Identify the purpose**: Is it procedural or reference?
2. **Procedural** → Convert to Claude Skill
3. **Reference** → Consolidate into ONE comprehensive document
4. **Split only if necessary** (e.g., Android vs iOS setup is legitimate)

**Frequency**: 4+ occurrences
**Last seen**: Documentation cleanup phase
**Auto-block**: ⚠️ Warn (let AI decide if split is justified)

---

### Pattern: Placeholder Documentation

**Symptom**: Documentation files with TODO placeholders or minimal content:
- Files with "TODO: Write this section"
- Files with just headers and no content
- Files marked "Draft" or "WIP"
- Empty sections with comments

**Problem**:
- Commits incomplete work
- Clutters repository
- Better tracked in issues/TODOs
- Gives false impression of completedness

**Detection**:
```bash
# Check for TODO in new .md files
git diff --cached | grep -E '^\+.*TODO' | grep '\.md'
```

**Solution**:
1. **Complete the documentation** before committing
2. **Create an issue** if not ready to document
3. **Delete the file** if it's not needed yet
4. **Never commit** placeholder docs

**Frequency**: 2+ occurrences
**Last seen**: Initial development
**Auto-block**: ⚠️ Warn (encourage completion)

---

### Pattern: Procedural Documentation as Markdown

**Symptom**: Markdown files teaching "how to do" something:
- `HOW_TO_DEPLOY.md`
- `TESTING_PROCEDURES.md`
- `SETUP_STEPS.md`
- Any file with step-by-step instructions

**Problem**:
- Should be Claude Skills for better AI integration
- Skills can auto-invoke when context matches
- Skills are more maintainable
- Skills improve AI agency

**Detection**:
```bash
# Check for "how to" or "steps" in filenames
git diff --cached --name-only | grep -iE '(how_to|howto|steps|procedures)\.md'

# Check for numbered steps in content
git diff --cached | grep -E '^\+\s*[0-9]+\.' | head -5
```

**Solution**:
1. **Convert to skill**: Create `.claude/skills/<skill-name>/SKILL.md`
2. **Keep reference material** if needed in skill's subdirectory
3. **Delete the markdown** file from root
4. **Update documentation index** to reference skill

**Frequency**: 10+ occurrences during initial development
**Last seen**: Documentation cleanup phase (all converted)
**Auto-block**: ⚠️ Warn strongly (suggest skill conversion)

---

## Dependency Bloat Patterns

### Pattern: Utility Libraries

**Symptom**: Adding entire utility libraries for a few functions:
- `lodash` (for debounce, throttle, etc.)
- `underscore`
- `ramda`
- `moment` (for date formatting)

**Problem**:
- Massive bundle size (lodash: ~70KB minified)
- Most functions unused
- Native JS often sufficient
- Adds maintenance burden

**Detection**:
```bash
# Check package.json for utility libraries
git diff --cached package.json | grep -E '\+(.*"lodash|underscore|ramda|moment)'
```

**Solution**:
1. **Implement native** - most utilities are <10 lines in modern JS
2. **Import specific functions** if must use (e.g., `lodash/debounce` instead of `lodash`)
3. **Find smaller alternatives** (e.g., `date-fns` instead of `moment`)

**Examples of Native Implementations**:
```typescript
// Debounce (8 lines)
function debounce<T extends (...args: any[]) => any>(
  func: T, wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle (10 lines)
function throttle<T extends (...args: any[]) => any>(
  func: T, wait: number
): (...args: Parameters<T>) => void {
  let waiting = false;
  return (...args: Parameters<T>) => {
    if (!waiting) {
      func(...args);
      waiting = true;
      setTimeout(() => { waiting = false; }, wait);
    }
  };
}
```

**Frequency**: 2+ occurrences during development
**Last seen**: Initial Android development
**Auto-block**: ✅ Yes (suggest native implementation)

---

### Pattern: State Management Libraries

**Symptom**: Adding state management frameworks:
- `redux` + `react-redux` + `redux-thunk`/`redux-saga`
- `mobx` + `mobx-react`
- `zustand`
- `recoil`

**Problem**:
- Adds significant complexity
- Multiple dependencies
- Boilerplate code
- Learning curve
- Overkill for simple apps

**Detection**:
```bash
# Check for state management libs
git diff --cached package.json | grep -E '\+(.*"redux|mobx|zustand|recoil|jotai)'
```

**Solution**:
1. **Use React state** (`useState`, `useReducer`, `useContext`)
2. **Lift state up** when sharing between components
3. **Only add if absolutely necessary** (e.g., very complex state with 20+ actions)

**When Redux might be justified**:
- 10+ interconnected state slices
- Complex async action flows
- Time-travel debugging required
- **For VOICE Relay**: ❌ Never justified (simple app)

**Frequency**: 1 occurrence (rejected)
**Last seen**: Initial development (rejected)
**Auto-block**: ✅ Yes (VOICE Relay is too simple for this)

---

### Pattern: UI Component Libraries

**Symptom**: Adding full UI frameworks:
- `react-native-elements`
- `native-base`
- `react-native-paper`
- UI animation libraries (beyond core React Native)

**Problem**:
- Large bundle size
- Opinionated styling
- Customization difficulties
- Dependency on external updates
- Not aligned with "simple" North Star

**Detection**:
```bash
# Check for UI libraries
git diff --cached package.json | grep -E '\+(.*"native-base|react-native-elements|react-native-paper)'
```

**Solution**:
1. **Build custom components** - gives full control
2. **Use React Native core** - already includes basic components
3. **Copy specific components** if needed, rather than full library

**Exceptions**:
- ✅ `react-native-vector-icons` - small, useful, hard to replicate
- ❌ Full UI kits - overkill

**Frequency**: 0 occurrences (good!)
**Last seen**: N/A
**Auto-block**: ⚠️ Warn strongly (justify or reject)

---

### Pattern: "Just in Case" Dependencies

**Symptom**: Adding dependencies for potential future use:
- "We might need analytics later" → `react-native-analytics`
- "We might add charts" → `react-native-charts`
- "We might need this utility" → `<unused-library>`

**Problem**:
- YAGNI (You Aren't Gonna Need It)
- Increases bundle size now
- Adds security surface
- May become outdated before use

**Detection**:
```bash
# Manual review - check if dependency is actually imported
for dep in $(git diff --cached package.json | grep '^\+' | grep -o '"[^"]*"' | tr -d '"'); do
  if ! git grep -q "from '$dep'" && ! git grep -q "require('$dep')"; then
    echo "⚠️  Dependency $dep not imported anywhere"
  fi
done
```

**Solution**:
1. **Delete the dependency** - add it when actually needed
2. **If adding dependency**, use it in the same commit
3. **Never add** "for future use"

**Frequency**: 1+ occurrences
**Last seen**: Initial development
**Auto-block**: ⚠️ Warn (must be used in same commit)

---

## Code Bloat Patterns

### Pattern: Premature Abstraction

**Symptom**: Creating abstractions before they're needed:
- Interface used by only one implementation
- Generic wrapper for specific use case
- "Manager" classes for simple operations
- Abstract base classes with one child

**Problem**:
- Adds complexity without benefit
- Harder to understand
- More files to maintain
- YAGNI violation

**Detection**:
```bash
# Manual review - look for abstractions
git diff --cached | grep -E '^\+\s*(interface|abstract class|extends)'
```

**Solution**:
1. **Wait until 3rd use** - abstract when you have 3 concrete cases
2. **Keep it simple** - solve the specific problem first
3. **Refactor later** - easier to abstract from concrete than to make abstract concrete

**Rule of Three**: Only abstract when:
- You have 3+ similar implementations, OR
- You're absolutely certain it's needed, AND
- It meaningfully simplifies the code

**Frequency**: 2+ occurrences
**Last seen**: Initial backend development
**Auto-block**: ⚠️ Warn (justify abstraction)

---

### Pattern: Deeply Nested Conditionals

**Symptom**: Code with >3 levels of nesting:
```typescript
if (condition1) {
  if (condition2) {
    if (condition3) {
      if (condition4) {
        // Do something
      }
    }
  }
}
```

**Problem**:
- Hard to read and understand
- Difficult to test
- Easy to introduce bugs
- Increases cyclomatic complexity

**Detection**:
```bash
# Manual review during commit
git diff --cached | grep -E '^\+\s+\s+\s+\s+if'  # 4+ levels
```

**Solution**:
1. **Early returns**: Exit early for error cases
2. **Extract functions**: Break complex logic into named functions
3. **Guard clauses**: Validate inputs at the top

**Example Refactor**:
```typescript
// Before: Nested
function process(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        return doSomething(user);
      }
    }
  }
  return null;
}

// After: Early returns
function process(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;
  return doSomething(user);
}
```

**Frequency**: 1+ occurrences
**Last seen**: Initial app development
**Auto-block**: ⚠️ Warn (suggest refactoring)

---

### Pattern: God Files/Functions

**Symptom**:
- Files >500 lines
- Functions >100 lines
- Files with multiple unrelated responsibilities
- Functions doing 5+ distinct things

**Problem**:
- Hard to understand
- Difficult to test
- Merge conflicts
- Tight coupling

**Detection**:
```bash
# Check for large files being added
git diff --cached --numstat | awk '$1 > 500 {print $3}'

# Check for long functions (manual review)
```

**Solution**:
1. **Split files** by responsibility (e.g., `auth.ts` → `login.ts`, `register.ts`, `password.ts`)
2. **Extract functions** - each function should do ONE thing
3. **Use directories** to organize related files

**Guidelines**:
- **Files**: Aim for <300 lines, max 500 lines
- **Functions**: Aim for <30 lines, max 50 lines
- **One responsibility** per file/function

**Frequency**: 1+ occurrences
**Last seen**: Initial development
**Auto-block**: ⚠️ Warn for files >500 lines

---

### Pattern: Commented-Out Code

**Symptom**: Blocks of commented code:
```typescript
// const oldFunction = () => {
//   // Old implementation
//   // return something;
// };

function newFunction() {
  // New implementation
}
```

**Problem**:
- Git history already preserves old code
- Clutters codebase
- Confusing (is it needed?)
- Rots over time

**Detection**:
```bash
# Check for blocks of commented code
git diff --cached | grep -E '^\+\s*//'
```

**Solution**:
1. **Delete it** - git history preserves everything
2. **If needed for reference**, add a comment with git commit hash
3. **Never commit** blocks of commented code

**Exception**: Explanatory comments are fine:
```typescript
// Using AES-256-GCM for authenticated encryption
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
```

**Frequency**: 1+ occurrences
**Last seen**: Refactoring phases
**Auto-block**: ⚠️ Warn (suggest deletion)

---

## Test Bloat Patterns

### Pattern: Low-Value Tests

**Symptom**: Tests that don't provide meaningful validation:
- Testing trivial getters/setters
- Testing library functionality
- Testing implementation details instead of behavior
- Snapshot tests for everything

**Problem**:
- False confidence
- Maintenance burden
- Slow test suite
- Obscures important tests

**Detection**:
```bash
# Manual review of test files
git diff --cached | grep -E '^\+.*test\('
```

**Solution**:
1. **Test behavior**, not implementation
2. **Test critical paths** (auth, encryption, API)
3. **Skip trivial tests** (getters/setters)
4. **Focus on value** over coverage percentage

**Good Tests**:
```typescript
// ✅ Tests critical E2EE behavior
test('encrypts message with RSA-2048 and AES-256-GCM', async () => {
  const encrypted = await encrypt(message, publicKey);
  const decrypted = await decrypt(encrypted, privateKey);
  expect(decrypted).toBe(message);
});
```

**Bad Tests**:
```typescript
// ❌ Tests trivial getter
test('getName returns name', () => {
  user.name = 'Alice';
  expect(user.getName()).toBe('Alice');
});
```

**Frequency**: 1+ occurrences
**Last seen**: Initial testing phase
**Auto-block**: ⚠️ Warn (review test value)

---

### Pattern: Device-Only Tests Without Acknowledgment

**Symptom**: Tests that can only run on physical devices:
- Tests requiring camera/microphone
- Tests requiring actual STT/TTS
- Tests requiring GPS/sensors
- No comment acknowledging limitation

**Problem**:
- Can't run in CI/CD
- Blocks automated testing
- Reduces AI agency
- Creates confusion

**Detection**:
```bash
# Manual review for device-specific APIs
git diff --cached | grep -E '(Camera|Microphone|Voice|TTS|STT|GPS)'
```

**Solution**:
1. **Mark clearly** with comments
2. **Create mock version** for automated testing when possible
3. **Document in test file** what can/can't be automated
4. **Separate** device tests from unit tests

**Example**:
```typescript
// ✅ Clearly marked device-only test
test('voice recognition (DEVICE-ONLY)', async () => {
  // This test requires physical device with microphone
  // TODO: Create mock for CI/CD
  if (!Device.hasMicrophone()) {
    console.log('Skipping: requires device microphone');
    return;
  }
  // Test implementation
});
```

**Frequency**: Multiple in voice integration phase
**Last seen**: Phase 3 planning
**Auto-block**: ⚠️ Warn (require acknowledgment)

---

## Pattern Evolution

New patterns are added when:

1. **Pattern occurs 2+ times** in different commits
2. **Pattern is caught by manual review** and should be automated
3. **Community reports** new bloat pattern
4. **Learning log** identifies recurring issue

**How to Add a Pattern**:

1. Document in this file with structure:
   - Symptom
   - Problem
   - Detection
   - Solution
   - Frequency
   - Last seen
   - Auto-block decision

2. Update SKILL.md if detection logic needs to be in main skill

3. Test the pattern detection on past commits

4. Increment version number

---

## Pattern Statistics

**Total Patterns Cataloged**: 17

**By Category**:
- Documentation: 5 patterns
- Dependencies: 4 patterns
- Code: 4 patterns
- Tests: 2 patterns

**Auto-block Patterns**: 4
**Warning Patterns**: 13

**Detection Coverage**:
- ✅ Automated detection: 8 patterns
- ⚠️ Manual review required: 9 patterns

**Next Review**: 2025-12-16 (monthly update)

---

## Version History

- **v1.0.0** (2025-11-16): Initial catalog based on documentation cleanup and testing strategy phases
  - 17 patterns identified
  - 8 with automated detection
  - Learned from 26 commits during initial development
