# Claude Code on the Web - Prompt Index

**Created**: November 15, 2025
**Purpose**: Guide Claude Code on the Web through documentation cleanup, testing strategy, and pre-commit skill creation

---

## Overview

This directory contains three comprehensive prompts designed to help Claude Code on the Web improve the VOICE Relay project by:

1. **Cleaning up documentation bloat** while preserving crucial context via Claude Skills
2. **Creating an intelligent testing strategy** for autonomous testing across all development phases
3. **Building a learnable pre-commit skill** that enforces North Star alignment and prevents future bloat

---

## Prompts

### 1. Documentation Review & Cleanup

**File**: [PROMPT_DOCUMENTATION_CLEANUP.md](PROMPT_DOCUMENTATION_CLEANUP.md)

**Goal**: Review 20+ markdown files created during overnight session and:
- Identify redundant/bloated documentation
- Convert crucial procedural knowledge to Claude Skills
- Archive historical documentation
- Delete unnecessary files
- Maintain clean, navigable repository

**Key Tasks**:
- Launch parallel agents to review every .md file
- Classify as: DELETE, ARCHIVE, CONVERT TO SKILL, or KEEP
- Create skills in `.claude/skills/` for procedural knowledge
- Generate cleanup report
- Create new documentation index

**Estimated Time**: 1-2 hours
**Deliverables**:
- Cleaned repository (50%+ reduction in root-level .md files)
- 4-5 new Claude Skills
- `.archive/` directory with historical docs
- `DOCUMENTATION.md` index

**Dependencies**: None (run first)

---

### 2. Testing Strategy Development

**File**: [PROMPT_TESTING_STRATEGY.md](PROMPT_TESTING_STRATEGY.md)

**Goal**: Create comprehensive, autonomous testing strategy for Android and iOS across all 5 development phases:
- Phase 0: E2EE Encryption
- Phase 1: Backend Relay
- Phase 2: Core App (Android)
- Phase 3: Voice Integration
- Phase 4: UI Polish
- Phase 5: Monetization

**Key Tasks**:
- Define what CAN and CANNOT be tested at each phase
- Create AI-executable test definitions with clear goals/outcomes
- Build unified test automation framework (`scripts/test-all.sh`)
- Address cross-platform testing (Android vs iOS)
- Optionally create `testing-voice-relay` Claude Skill

**Estimated Time**: 2-3 hours
**Deliverables**:
- `TESTING_STRATEGY.md` comprehensive document
- `scripts/test-all.sh` unified test runner
- `scripts/test-phase.sh` phase-specific tester
- `scripts/test-ios-config.sh` iOS configuration validator
- Test definitions (YAML/JSON) for AI execution
- Optional: `.claude/skills/testing-voice-relay/` skill

**Dependencies**: Can run in parallel with #1, but benefits from documentation cleanup first

---

### 3. Pre-Commit Bloat-Check Skill

**File**: [PROMPT_PRECOMMIT_SKILL.md](PROMPT_PRECOMMIT_SKILL.md)

**Goal**: Create an intelligent, learnable Claude Skill that reviews every commit delta to ensure:
- North Star alignment (faster, simpler, more secure)
- No documentation bloat
- Proper use of skills vs static docs
- Meaningful testing improvements
- Increased AI agency

**Key Tasks**:
- Create `.claude/skills/reviewing-commits/` skill
- Implement 7 validation checks (North Star, docs, dependencies, code, tests, skills, agency)
- Build learning mechanism (decision logging, pattern recognition)
- Integrate with git workflow (pre-commit hook or manual invocation)
- Create bloat pattern catalog
- Optional: Update `CLAUDE.md` with new workflow

**Estimated Time**: 1-2 hours
**Deliverables**:
- `.claude/skills/reviewing-commits/SKILL.md`
- `north-star-checklist.md` detailed validation criteria
- `bloat-patterns.md` known bloat patterns
- `learning-log.md` decision tracking template
- Optional: Enhanced `.git/hooks/pre-commit`
- Optional: Updated `CLAUDE.md`

**Dependencies**: Should be run AFTER #1 and #2 so it can learn from those exercises

---

## Recommended Execution Order

### Sequential Approach (Recommended)

**Day 1 Morning**: Documentation Cleanup
1. Read [PROMPT_DOCUMENTATION_CLEANUP.md](PROMPT_DOCUMENTATION_CLEANUP.md)
2. Execute documentation review with parallel agents
3. Create Claude Skills from crucial documentation
4. Archive historical docs, delete bloat
5. Commit results

**Day 1 Afternoon**: Testing Strategy
1. Read [PROMPT_TESTING_STRATEGY.md](PROMPT_TESTING_STRATEGY.md)
2. Analyze current test coverage
3. Define comprehensive testing strategy
4. Build test automation framework
5. Create test definitions for AI execution
6. Optionally create `testing-voice-relay` skill
7. Commit results

**Day 2**: Pre-Commit Skill
1. Read [PROMPT_PRECOMMIT_SKILL.md](PROMPT_PRECOMMIT_SKILL.md)
2. Review learnings from Day 1 (what bloat was found? what tests were valuable?)
3. Create `reviewing-commits` skill with those learnings
4. Implement all 7 validation checks
5. Set up learning mechanism
6. Test on previous commits to validate
7. Commit results

### Parallel Approach (Advanced)

If you have multiple Claude Code instances or want to work faster:

**Parallel Track 1**: Documentation Cleanup
- Execute [PROMPT_DOCUMENTATION_CLEANUP.md](PROMPT_DOCUMENTATION_CLEANUP.md)

**Parallel Track 2**: Testing Strategy
- Execute [PROMPT_TESTING_STRATEGY.md](PROMPT_TESTING_STRATEGY.md)

**Sequential Track 3**: Pre-Commit Skill (waits for 1 & 2)
- Execute [PROMPT_PRECOMMIT_SKILL.md](PROMPT_PRECOMMIT_SKILL.md) after tracks 1 & 2 complete

**Advantage**: Faster completion
**Disadvantage**: Pre-commit skill won't learn from cleanup/testing exercises

---

## Context for Claude Code on the Web

### Current Project Status

**VOICE Relay** - Voice Operated Interface for Context Engines

**Completed**:
- ✅ Phase 0: E2EE (RSA-2048 + AES-256-GCM)
- ✅ Phase 1: Backend (FastAPI on Replit)
- ✅ Phase 2: Core App (React Native Android)
- ✅ iOS Support: Xcode project created
- ✅ UI: Login, message queue, settings, onboarding

**Ready to Start**:
- 🟡 Phase 3: Voice Integration (STT/TTS)
- ⏸️ Phase 5: Monetization

**The Problem**:
Overnight session created 26 commits with excellent functionality BUT:
- 20+ markdown files (many redundant)
- Documentation bloat
- Testing could be more comprehensive
- No pre-commit enforcement of North Star principles

**The Solution**:
These three prompts address all issues while:
- Leveraging Claude Skills for procedural knowledge
- Creating autonomous testing framework
- Preventing future bloat with learnable skill

### North Star Principle

> **"Be the fastest, simplest, most secure relay for a voice conversation."**

Every change must:
1. Serve the North Star (faster, simpler, or more secure)
2. Be the simplest possible implementation
3. Avoid bloat at all costs

See [CLAUDE.md](CLAUDE.md) for complete constitution.

---

## Expected Outcomes

After executing all three prompts:

**Repository**:
- Clean, navigable, minimal documentation
- 4-6 Claude Skills for procedural knowledge
- Comprehensive testing framework
- Pre-commit skill preventing future bloat

**Testing**:
- Autonomous tests for every testable phase
- Clear goals and expected outcomes
- AI-executable with actionable failure info
- Cross-platform coverage (Android + iOS)

**Development Workflow**:
- AI invokes `reviewing-commits` skill before every commit
- Commits are validated against North Star
- Bloat is prevented automatically
- AI learns and improves over time

**Metrics**:
- 50%+ reduction in root-level .md files
- 4-6 new Claude Skills
- 80%+ code coverage (where testable)
- 100% commit reviews before committing

---

## Success Criteria

### Documentation Cleanup
- [x] 20+ files reviewed
- [x] Redundant docs deleted or archived
- [x] 4-5 skills created from procedural docs
- [x] New documentation index created
- [x] Repository is cleaner and more navigable

### Testing Strategy
- [x] Comprehensive strategy document created
- [x] Test automation framework implemented
- [x] All phases have defined test suites
- [x] Tests are AI-executable
- [x] Cross-platform testing addressed

### Pre-Commit Skill
- [x] `reviewing-commits` skill created
- [x] 7 validation checks implemented
- [x] Learning mechanism active
- [x] Bloat patterns catalog started
- [x] Integrated with git workflow

### Overall
- [x] North Star principles enforced
- [x] No crucial context lost
- [x] AI agency increased
- [x] Future bloat prevented
- [x] Development velocity improved

---

## How to Use These Prompts

### Option 1: Copy-Paste Entire Prompt

Simply copy the entire content of each prompt file and paste it into Claude Code on the Web. The prompts are self-contained.

### Option 2: Reference Files

If Claude Code on the Web has access to the repository:
```
Please read and execute the prompt in PROMPT_DOCUMENTATION_CLEANUP.md
```

### Option 3: Hybrid Approach

Start with the overview from this index, then reference specific prompts:
```
I need you to clean up documentation bloat in this repository.
Please read PROMPT_DOCUMENTATION_CLEANUP.md for detailed instructions.
Use parallel agents to review all .md files and convert crucial content to Claude Skills.
```

---

## Tips for Claude Code on the Web

1. **Read CLAUDE.md first**: Understand the North Star principle
2. **Use parallel agents**: These prompts are designed for parallel execution
3. **Be aggressive about bloat**: When in doubt, delete or archive
4. **Skills > Documentation**: Procedural knowledge should be skills
5. **Learn as you go**: The pre-commit skill should learn from cleanup/testing
6. **Commit incrementally**: Don't batch all changes into one massive commit
7. **Test the tests**: Validate that your test automation actually works

---

## Questions & Support

If anything is unclear:
1. Refer back to [CLAUDE.md](CLAUDE.md) for project principles
2. Check [CLAUDE_CODE_WEB_SESSION_RESULTS.md](CLAUDE_CODE_WEB_SESSION_RESULTS.md) for context on overnight session
3. Review git history: `git log --oneline -26` to see what was done

**Remember**: The goal is a cleaner, more maintainable, more autonomous project that serves the North Star.

---

## File Locations

All prompt files are in the repository root:

```
c:\VSCode\VOICE-Relay\
├── PROMPTS_INDEX.md                      # This file
├── PROMPT_DOCUMENTATION_CLEANUP.md       # Documentation cleanup prompt
├── PROMPT_TESTING_STRATEGY.md            # Testing strategy prompt
├── PROMPT_PRECOMMIT_SKILL.md             # Pre-commit skill creation prompt
├── CLAUDE.md                              # Project constitution (read first!)
└── CLAUDE_CODE_WEB_SESSION_RESULTS.md    # Overnight session results
```

---

**Status**: ✅ Ready for execution
**Next Step**: Start with PROMPT_DOCUMENTATION_CLEANUP.md
