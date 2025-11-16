# Documentation Review & Cleanup Prompt

**For**: Claude Code on the Web
**Goal**: Clean repository while preserving crucial context via Claude Skills
**Method**: Parallel agent review of all documentation

---

## Current Project Status

**VOICE Relay** is a voice-operated interface for context engines. You've just completed a major overnight session with 26 commits that accomplished:

- ✅ **Phase 2 Complete**: Core Android app runs without errors
- ✅ **iOS Ready**: Full Xcode project structure created
- ✅ **Backend Verified**: 8/8 endpoint tests passing locally
- ✅ **UI Complete**: Login, message queue, settings, onboarding screens
- ✅ **TypeScript Clean**: Zero implicit 'any' errors
- ✅ **Code Quality**: A+ with comprehensive error handling

**Current State**:
- Phase 0 (E2EE): Complete
- Phase 1 (Backend): Complete
- Phase 2 (Core App): Complete
- Phase 3 (Voice Integration): Ready to start
- Phase 4 (UI Polish): Complete
- Phase 5 (Monetization): Pending

**The Problem**: During the overnight session, 20+ markdown documentation files were created. Many may be redundant or contain context that would be better stored as Claude Skills.

---

## North Star Principle

**"Be the fastest, simplest, most secure relay for a voice conversation."**

Before keeping ANY documentation, ask:
1. Does this documentation serve the North Star?
2. Is this information better suited as a Claude Skill?
3. Are we adding bloat?

**Critical**: [CLAUDE.md](CLAUDE.md) is the project constitution and MUST NOT be modified or deleted during this exercise.

---

## Your Task

### 1. Documentation Inventory (Parallel Agents)

Launch parallel agents to review ALL markdown files in the repository root. For each file, agents should determine:

**Files to Review**:
- BACKEND_INTEGRATION_STATUS.md
- BACKEND_TEST_REPORT.md
- BACKEND_VERIFICATION_COMPLETE.md
- CLAUDE_CODE_HANDOFF.md
- CLAUDE_CODE_WEB_SESSION_RESULTS.md
- CREATE_NEW_PR.md
- DEPENDENCY_COMPATIBILITY.md
- DEPLOY_FREE_TIER.md
- ERROR_HANDLING_IMPROVEMENTS.md
- EXAMPLES_USER_FEEDBACK.md
- FINAL_HANDOFF_REPORT.md
- HANDOFF_SUMMARY.md
- INTEGRATION_GUIDE.md
- iOS_COMPATIBILITY_SUMMARY.md
- iOS_DOCUMENTATION_INDEX.md
- IOS_QUICK_START.md
- IOS_READINESS_COMPLETE.md
- IOS_SETUP.md
- iOS_SETUP_GUIDE.md
- iOS_VERIFICATION_REPORT.md
- NODE_FORGE_ALTERNATIVES.md
- PLATFORM_COMPARISON.md
- PULL_REQUEST.md
- README_HANDOFF.md
- START_HERE.md
- TESTING_SUMMARY.txt
- UX_IMPROVEMENTS_SUMMARY.md
- UX_TRANSFORMATION_SUMMARY.md

**Do NOT review** (protected files):
- CLAUDE.md (project constitution)
- README.md (if exists - primary project readme)

### 2. Classification Criteria

For each file, classify as:

**A) DELETE** - Redundant, outdated, or bloat
- Examples: Multiple handoff summaries covering same info
- Multiple iOS setup guides with overlapping content
- Session summaries now obsolete
- Verification reports that are snapshots in time

**B) ARCHIVE** - Historical value but not needed in active repo
- Move to `.archive/` directory
- Examples: Handoff documentation from previous sessions
- Initial research notes
- Session summaries

**C) CONVERT TO SKILL** - Crucial procedural knowledge
- Information teaches Claude HOW to do something
- Would benefit from auto-invocation
- Examples: Testing procedures, deployment steps, iOS setup
- Create skill in `.claude/skills/` with proper structure

**D) KEEP AS-IS** - Essential static reference
- Information that's frequently manually referenced
- Better as markdown than skill
- Examples: Architecture diagrams, API references

### 3. Claude Skills Structure

When converting documentation to skills, use this structure:

```
.claude/skills/skill-name/
├── SKILL.md              # Main skill file (< 500 lines)
├── detailed-guide.md     # Optional: Extended reference
└── scripts/              # Optional: Executable scripts
    └── automation.sh
```

**SKILL.md Format**:
```yaml
---
name: skill-name-in-kebab-case
description: Clear, concise description that triggers auto-invocation. Use gerunds (testing, deploying, building). Mention key concepts.
version: 1.0.0
allowed-tools: ["Bash", "Read", "Write", "Edit", "Grep"]
dependencies: []
---

# Skill Name

Brief overview of what this skill teaches.

## Quick Commands

[Most common commands/procedures]

## Key Concepts

[Essential knowledge]

## Detailed Procedures

See [detailed-guide.md](detailed-guide.md) for complete procedures.
```

### 4. Recommended Skills to Create

Based on the documentation, consider creating these skills:

**A) `.claude/skills/testing-voice-relay/`**
- **Source**: TESTING_SUMMARY.txt, BACKEND_TEST_REPORT.md
- **Description**: "Execute comprehensive testing for VOICE Relay including backend API tests, TypeScript validation, and build verification. Use when testing, verifying, or debugging functionality."
- **Content**: How to run tests, interpret results, add new tests
- **Scripts**: `scripts/run-all-tests.sh`

**B) `.claude/skills/deploying-voice-relay-ios/`**
- **Source**: IOS_QUICK_START.md, IOS_SETUP.md, iOS_SETUP_GUIDE.md
- **Description**: "Set up and deploy VOICE Relay iOS application including Xcode configuration, CocoaPods installation, and simulator testing. Use when building iOS or troubleshooting iOS build issues."
- **Content**: Step-by-step iOS deployment, common issues, prerequisites
- **Scripts**: Automated setup script if applicable

**C) `.claude/skills/voice-relay-e2ee/`**
- **Source**: Encryption documentation if exists
- **Description**: "Implement and verify E2EE (RSA-2048 + AES-256-GCM) for VOICE Relay. Use when working on encryption, decryption, or security features."
- **Content**: How encryption works, testing procedures, key management

**D) `.claude/skills/voice-relay-backend-integration/`**
- **Source**: BACKEND_INTEGRATION_STATUS.md, INTEGRATION_GUIDE.md
- **Description**: "Integrate with VOICE Relay FastAPI backend including authentication, encryption, and message handling. Use when working on API communication or debugging backend issues."
- **Content**: Backend endpoints, authentication flow, testing procedures

### 5. Execution Plan

**Step 1**: Launch parallel agents (one per file or groups of 3-5 files)
- Each agent reads assigned files
- Each agent classifies: DELETE, ARCHIVE, CONVERT TO SKILL, KEEP
- Each agent provides reasoning

**Step 2**: Consolidate recommendations
- Review all agent outputs
- Identify overlaps (multiple docs → single skill)
- Resolve conflicts
- Create final classification list

**Step 3**: Execute cleanup
- Create `.archive/` directory if needed
- Move archived files with preservation of git history
- Delete bloat files (git rm)
- Keep essential references

**Step 4**: Create Claude Skills
- Create `.claude/skills/` directory structure
- Write SKILL.md files with proper YAML frontmatter
- Move detailed content to reference files
- Create any automation scripts
- Test that skills are recognized (check with /skills command)

**Step 5**: Update Documentation Index
- Create concise `DOCUMENTATION.md` listing:
  - Active documentation (what's left)
  - Available skills (what to invoke)
  - Archived documentation (where to find historical context)

**Step 6**: Validate
- Ensure CLAUDE.md is untouched
- Verify skills are discoverable
- Confirm no crucial context was lost
- Check repo is cleaner and more navigable

---

## Deliverables

1. **Classification Report**: Markdown table with all files and their disposition
2. **Skills Created**: List of new skills in `.claude/skills/`
3. **Archive**: `.archive/` directory with historical docs
4. **Cleanup Summary**: What was deleted and why
5. **Updated Index**: `DOCUMENTATION.md` with new structure

---

## Success Criteria

- ✅ Repository is significantly cleaner (50%+ reduction in root-level .md files)
- ✅ No crucial context lost (converted to skills or archived)
- ✅ Skills are properly structured and auto-invocable
- ✅ CLAUDE.md remains untouched
- ✅ North Star principle upheld (no bloat)
- ✅ Future contributors can find information easily

---

## Example Output Format

**Classification Report** (`DOCUMENTATION_CLEANUP_REPORT.md`):

```markdown
# Documentation Cleanup Report

## Summary
- Total files reviewed: 28
- Deleted: 8 (redundant/bloat)
- Archived: 12 (historical value)
- Converted to skills: 5 (procedural knowledge)
- Kept as-is: 3 (essential reference)

## Detailed Classification

| File | Action | Reason | Destination |
|------|--------|--------|-------------|
| HANDOFF_SUMMARY.md | Archive | Historical - handoff complete | .archive/ |
| IOS_QUICK_START.md | Convert to Skill | Procedural iOS setup | .claude/skills/deploying-voice-relay-ios/ |
| TESTING_SUMMARY.txt | Convert to Skill | Testing procedures | .claude/skills/testing-voice-relay/ |
| BACKEND_TEST_REPORT.md | Delete | Redundant - covered in skill | - |
| ... | ... | ... | ... |

## Skills Created

1. **testing-voice-relay**: Comprehensive testing procedures
2. **deploying-voice-relay-ios**: iOS setup and deployment
3. **voice-relay-backend-integration**: Backend API integration
4. **voice-relay-e2ee**: Encryption/decryption procedures

## Verification

- [x] CLAUDE.md untouched
- [x] All skills tested and discoverable
- [x] No broken links in remaining docs
- [x] Archive preserves git history
```

---

## Notes

- Use the Task tool with parallel agents for file reviews
- Be aggressive about identifying bloat, but conservative about deleting crucial context
- Skills should be concise - move details to reference files
- Test skills after creation to ensure they auto-invoke properly
- Commit incrementally: classification → archiving → skill creation → cleanup

Start by launching parallel agents to review the documentation files.
