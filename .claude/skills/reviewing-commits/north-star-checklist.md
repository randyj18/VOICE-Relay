# North Star Alignment Checklist

Detailed validation criteria for ensuring every commit serves the North Star:

> **"Be the fastest, simplest, most secure relay for a voice conversation."**

## Core Principle

Before committing ANY code, ask:

1. **Does this feature add complexity, or does it directly serve the North Star?**
2. **Is this the simplest possible way to implement this requirement?**
3. **Am I adding bloat?**

If you answer "adds complexity", "no", or "yes" respectively → **STOP AND RECONSIDER**

---

## 1. FASTER - Performance & Speed

### What Counts as "Faster"?

**Voice Loop Latency** ✅
- Reduces time from speech input → transcription → API → response → TTS
- Optimizes STT/TTS library usage
- Minimizes processing between voice events
- Reduces audio buffer delays

**Encryption/Decryption Speed** ✅
- Optimizes RSA operations
- Improves AES-GCM performance
- Reduces key generation time
- Implements efficient cipher selection

**API Response Time** ✅
- Reduces backend processing time
- Optimizes database queries
- Implements efficient caching
- Reduces network roundtrips

**App Startup Time** ✅
- Reduces initialization overhead
- Lazy loads non-critical components
- Optimizes bundle loading
- Minimizes splash screen duration

**Bundle Size Reduction** ✅
- Removes unused dependencies
- Optimizes asset sizes
- Tree shakes unused code
- Compresses resources

### What Does NOT Count as "Faster"?

**Premature Optimization** ❌
- Micro-optimizations without profiling
- Complex caching for rarely-accessed data
- Over-indexing databases with low query volume

**Performance at Cost of Simplicity** ❌
- Adding complex performance monitoring that slows development
- Implementing advanced techniques for negligible gains
- Creating abstractions for "potential future performance"

**Theoretical Speed Improvements** ❌
- "This could be faster if we need it later"
- Optimizations without measured baseline
- Performance features without real-world testing

### Examples

**✅ APPROVED - Makes VOICE Relay Faster**

```typescript
// Before: Multiple API calls for each message
async getMessage(id: string) {
  const message = await api.get(`/messages/${id}`);
  const user = await api.get(`/users/${message.userId}`);
  return { ...message, user };
}

// After: Single API call with joined data
async getMessage(id: string) {
  return await api.get(`/messages/${id}?include=user`);
}
```

**Reasoning**: Reduces network roundtrips from 2 to 1, directly speeds up message loading.

**❌ REJECTED - Premature Optimization**

```typescript
// Adding complex memoization for static config
import memoize from 'lodash/memoize';

const getAppConfig = memoize(() => {
  return {
    apiUrl: 'https://api.example.com',
    version: '1.0.0'
  };
});
```

**Reasoning**: Config is static and called once. Adds dependency and complexity for zero benefit.

---

## 2. SIMPLER - Simplicity & Clarity

### What Counts as "Simpler"?

**Code Complexity Reduction** ✅
- Removes unnecessary abstractions
- Consolidates duplicate code
- Simplifies complex conditionals
- Reduces file count
- Eliminates dead code

**User Interaction Simplification** ✅
- Reduces steps to complete a task
- Removes configuration options
- Simplifies UI flows
- Auto-configures when possible

**Configuration Reduction** ✅
- Removes unnecessary settings
- Uses sensible defaults
- Auto-detects environment
- Reduces decision points

**Dependency Reduction** ✅
- Removes unused npm packages
- Replaces heavy libraries with native code
- Consolidates similar dependencies

**Documentation Consolidation** ✅
- Merges duplicate guides
- Converts procedural docs to skills
- Removes outdated documentation

### What Does NOT Count as "Simpler"?

**Oversimplification** ❌
- Removing necessary error handling
- Skipping security validation
- Hiding important information from users
- Removing necessary configuration

**False Simplicity** ❌
- Creating "simple" wrappers around complex libraries
- Abstracting away important details
- "Magic" that hides essential behavior

**Short-term Simplicity, Long-term Complexity** ❌
- Hardcoding values that should be configurable
- Skipping abstraction that prevents duplication
- Quick hacks that create technical debt

### Examples

**✅ APPROVED - Makes VOICE Relay Simpler**

```typescript
// Before: Complex state management with Redux
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

const store = createStore(rootReducer, applyMiddleware(thunk));

// After: Simple React state
const [messages, setMessages] = useState<Message[]>([]);
```

**Reasoning**: Removes 2 dependencies (redux, redux-thunk), reduces boilerplate, simpler mental model.

**❌ REJECTED - False Simplicity**

```typescript
// Adding "simple" wrapper that hides important crypto details
export const encrypt = (data: string) => {
  // Magic encryption! Don't worry about the details!
  return magicCrypto.doIt(data);
}
```

**Reasoning**: Security requires understanding. Hiding crypto details reduces transparency.

---

## 3. MORE SECURE - Security & Privacy

### What Counts as "More Secure"?

**E2EE Strengthening** ✅
- Upgrades encryption algorithms (RSA-1024 → RSA-2048)
- Implements proper key rotation
- Adds forward secrecy
- Improves cipher mode (CBC → GCM)

**Key Management Improvements** ✅
- Secure key generation
- Proper key storage (not in plaintext)
- Key lifecycle management
- Secure key exchange

**Attack Surface Reduction** ✅
- Removes unnecessary endpoints
- Validates all inputs
- Implements rate limiting
- Reduces exposed APIs

**Zero-Knowledge Architecture** ✅
- Server never sees plaintext
- Client-side encryption
- Minimal metadata leakage
- Ephemeral keys when possible

**Security Testing** ✅
- Adds encryption tests
- Validates key strength
- Tests for common vulnerabilities
- Penetration testing automation

### What Does NOT Count as "More Secure"?

**Security Theater** ❌
- Adding authentication to public endpoints
- Obfuscation instead of encryption
- Complex security that isn't needed
- Over-engineering auth flows

**False Security** ❌
- Using weak/broken crypto
- Rolling your own crypto (use established libraries)
- Security by obscurity
- Incomplete security measures

**Unnecessary Security** ❌
- Adding authentication where not needed
- Complex permission systems for single-user app
- Excessive logging that creates privacy issues

### Examples

**✅ APPROVED - Makes VOICE Relay More Secure**

```python
# Before: RSA-1024 key generation
def generate_keypair():
    return rsa.generate_private_key(
        public_exponent=65537,
        key_size=1024,
        backend=default_backend()
    )

# After: RSA-2048 key generation
def generate_keypair():
    return rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,  # Stronger encryption
        backend=default_backend()
    )
```

**Reasoning**: Directly strengthens E2EE with industry-standard key size.

**❌ REJECTED - Security Theater**

```typescript
// Adding complex permission system for single-user app
class PermissionManager {
  private roles: Map<string, string[]> = new Map();
  private permissions: Map<string, Permission> = new Map();

  checkPermission(user: User, action: string): boolean {
    // 100 lines of complex permission logic
    // for an app with one user
  }
}
```

**Reasoning**: VOICE Relay is single-user. This adds complexity without security benefit.

---

## Decision Trees

### Decision Tree: New File Addition

```
New file being added?
│
├─ Is it .md documentation?
│  │
│  ├─ Is it procedural ("how to")?
│  │  └─ ❌ Should be a Claude Skill instead
│  │
│  ├─ Does it duplicate existing docs?
│  │  └─ ❌ Consolidate with existing
│  │
│  ├─ Is it a summary/report?
│  │  └─ ❌ Archive or delete
│  │
│  └─ Is it necessary reference material?
│     └─ ✅ OK if <2 docs in commit
│
├─ Is it a dependency (package.json)?
│  │
│  ├─ Is it absolutely essential?
│  │  ├─ Yes → ✅ OK
│  │  └─ No → ❌ Can you implement it yourself?
│  │
│  ├─ Is it >1MB?
│  │  └─ ⚠️ Warn - suggest alternatives
│  │
│  └─ Can you use native JS/React Native instead?
│     └─ ❌ Use native implementation
│
├─ Is it a test file?
│  │
│  ├─ Is it executable autonomously?
│  │  ├─ Yes → ✅ Good
│  │  └─ No → ⚠️ Mark as future/manual
│  │
│  ├─ Does it test critical functionality?
│  │  ├─ Yes → ✅ Good
│  │  └─ No → ❌ Remove or improve
│  │
│  └─ Is it well-documented?
│     ├─ Yes → ✅ Approve
│     └─ No → ⚠️ Add documentation
│
└─ Is it code (.ts/.tsx/.js/.py)?
   │
   ├─ Does it serve the North Star?
   │  ├─ Yes → Continue checks
   │  └─ No → ❌ Reject
   │
   ├─ Is it the simplest implementation?
   │  ├─ Yes → ✅ Good
   │  └─ No → ⚠️ Suggest simplification
   │
   └─ Does it add unnecessary abstraction?
      ├─ Yes → ❌ Simplify
      └─ No → ✅ Approve
```

### Decision Tree: Dependency Addition

```
Adding npm package?
│
├─ Is it in the approved list?
│  ├─ react-native → ✅ OK
│  ├─ react-native-voice → ✅ OK
│  ├─ react-native-tts → ✅ OK
│  ├─ react-native-keep-awake → ✅ OK
│  ├─ node-forge (temporary) → ✅ OK
│  └─ Other → Continue evaluation
│
├─ Can you implement it yourself in <50 lines?
│  ├─ Yes → ❌ Implement yourself
│  └─ No → Continue evaluation
│
├─ Does it have native alternatives?
│  ├─ Yes → ❌ Use native instead
│  └─ No → Continue evaluation
│
├─ Is it >1MB minified?
│  ├─ Yes → ⚠️ Warn - justify or find alternative
│  └─ No → Continue evaluation
│
├─ Does it require configuration/setup?
│  ├─ Complex setup → ⚠️ Warn - is it worth it?
│  └─ Minimal setup → Continue evaluation
│
└─ Is it absolutely essential to the North Star?
   ├─ Yes → ✅ Approve with justification
   └─ No → ❌ Reject
```

### Decision Tree: Code Complexity

```
Code change increases complexity?
│
├─ Is abstraction necessary?
│  ├─ Used in 3+ places → ✅ Good abstraction
│  ├─ Used in 1-2 places → ❌ Inline it
│  └─ Not used yet → ❌ YAGNI - remove
│
├─ Function >50 lines?
│  ├─ Can it be broken down? → ⚠️ Suggest refactor
│  └─ Logical unit that shouldn't be split → ✅ OK with comment
│
├─ Nesting >3 levels?
│  ├─ Can you early return? → ⚠️ Suggest improvement
│  ├─ Can you extract function? → ⚠️ Suggest refactor
│  └─ Inherent complexity → ✅ OK with comment
│
└─ Multiple responsibilities?
   ├─ Can you split into focused functions? → ⚠️ Suggest refactor
   └─ Single cohesive responsibility → ✅ OK
```

---

## Common Scenarios

### Scenario 1: Adding iOS Setup Documentation

**Question**: Should I add iOS_SETUP.md to the repository?

**Checklist**:
- [ ] Does this make VOICE Relay faster? → No
- [ ] Does this make VOICE Relay simpler? → No (adds file to navigate)
- [ ] Does this make VOICE Relay more secure? → No
- [ ] Is this procedural knowledge? → Yes
- [ ] Should this be a skill? → **Yes!**

**Decision**: ❌ **REJECT** - Create `.claude/skills/ios-setup/` instead

---

### Scenario 2: Upgrading Encryption

**Question**: Should I upgrade from RSA-1024 to RSA-2048?

**Checklist**:
- [ ] Does this make VOICE Relay faster? → Slightly slower (acceptable tradeoff)
- [ ] Does this make VOICE Relay simpler? → Same complexity
- [x] Does this make VOICE Relay more secure? → **Yes!** Stronger encryption
- [ ] Does this add bloat? → No
- [ ] Is this the simplest implementation? → Yes

**Decision**: ✅ **APPROVE** - Directly serves North Star (more secure)

---

### Scenario 3: Adding Redux for State Management

**Question**: Should I add Redux to manage application state?

**Checklist**:
- [ ] Does this make VOICE Relay faster? → No
- [ ] Does this make VOICE Relay simpler? → No (adds complexity)
- [ ] Does this make VOICE Relay more secure? → No
- [ ] Is it absolutely essential? → No (React state works)
- [ ] Adds dependencies? → Yes (redux, react-redux, potentially middleware)

**Decision**: ❌ **REJECT** - Use React's built-in state management

---

### Scenario 4: Adding Encryption Tests

**Question**: Should I add comprehensive E2EE tests?

**Checklist**:
- [ ] Does this make VOICE Relay faster? → No
- [ ] Does this make VOICE Relay simpler? → No
- [x] Does this make VOICE Relay more secure? → **Yes!** Validates security
- [x] Are tests executable autonomously? → **Yes**
- [x] Do tests provide value? → **Yes!** Critical path validation
- [x] Increases AI agency? → **Yes!** Can validate security without manual testing

**Decision**: ✅ **APPROVE** - Serves North Star and increases agency

---

### Scenario 5: Adding Lodash for Utility Functions

**Question**: Should I add lodash for debounce, throttle, etc.?

**Checklist**:
- [ ] Does this make VOICE Relay faster? → No
- [ ] Does this make VOICE Relay simpler? → No (adds dependency)
- [ ] Does this make VOICE Relay more secure? → No
- [ ] Is it absolutely essential? → No
- [ ] Can I implement it myself? → Yes (8-10 lines for debounce)
- [ ] Bundle size? → ~70KB (significant)

**Decision**: ❌ **REJECT** - Implement native debounce/throttle

**Alternative**:
```typescript
// Simple debounce (8 lines)
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

---

## Red Flags 🚩

If you see any of these, **STOP AND RECONSIDER**:

🚩 **Documentation Red Flags**
- Adding multiple .md files with similar names
- Creating "SUMMARY" or "HANDOFF" documents
- Duplicating existing documentation
- Writing procedural guides instead of skills

🚩 **Dependency Red Flags**
- Adding UI libraries (animations, themes)
- Adding state management libraries (Redux, MobX)
- Adding utility libraries (lodash, underscore)
- Adding libraries >1MB
- Adding libraries "in case we need it later"

🚩 **Code Red Flags**
- Creating interfaces/types never used
- Building generic solutions for specific problems
- Adding abstraction layers "for future flexibility"
- Implementing features "we might need"
- Complex patterns for simple use cases

🚩 **Test Red Flags**
- Tests that require manual setup
- Tests that can't run in CI/CD
- Tests for trivial getters/setters
- Tests that don't validate critical paths
- Tests that test implementation, not behavior

---

## Quick Reference Card

Print this and keep it visible:

```
╔══════════════════════════════════════════════════════════╗
║           VOICE RELAY - NORTH STAR CHECKLIST             ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Before EVERY commit, ask:                               ║
║                                                          ║
║  ✅ Does this make VOICE Relay FASTER?                   ║
║     → Voice loop, encryption, API, startup, bundle       ║
║                                                          ║
║  ✅ Does this make VOICE Relay SIMPLER?                  ║
║     → Less code, fewer deps, simpler UX, less config     ║
║                                                          ║
║  ✅ Does this make VOICE Relay MORE SECURE?              ║
║     → Stronger E2EE, better keys, smaller attack surface ║
║                                                          ║
║  If NO to all three → REJECT THE COMMIT                  ║
║                                                          ║
║  ❌ AVOID BLOAT:                                         ║
║     • Max 2 docs per commit                              ║
║     • Procedural knowledge → Skills                      ║
║     • No unnecessary dependencies                        ║
║     • No premature abstraction                           ║
║                                                          ║
║  💡 ASK:                                                 ║
║     • Is this the SIMPLEST way?                          ║
║     • Can I do this with LESS?                           ║
║     • Does this SERVE THE NORTH STAR?                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Continuous Refinement

This checklist evolves based on:

1. **Decisions logged** in `learning-log.md`
2. **Patterns detected** in `bloat-patterns.md`
3. **Project evolution** as VOICE Relay develops
4. **Community feedback** from users and contributors

**Version History**:
- v1.0.0 (2025-11-16): Initial checklist based on CLAUDE.md principles
