# Reviewing Commits - Learning Log

**Purpose**: Track every commit review decision to learn patterns and improve the skill over time.

**Created**: 2025-11-16
**Last Updated**: 2025-11-16

---

## How to Use This Log

After every commit review, add an entry with:

1. **Date and Commit Hash**: When and what commit
2. **Changes**: Brief description of what changed
3. **Decision**: ✅ Approved / ⚠️ Warned / ❌ Blocked
4. **Reasoning**: Why this decision was made
5. **Outcome**: What actually happened
6. **Learning**: What to remember for next time

**Template**:
```markdown
## YYYY-MM-DD - Commit [short-hash or description]

**Changes**: [Brief description of files/features changed]
**Decision**: ✅/⚠️/❌ [Approved/Warned/Blocked]
**Reasoning**: [Why this decision was made based on North Star checks]
**Outcome**: [What happened - was commit modified? Improved? Rejected?]
**Learning**: [Key takeaway for future reviews]
**Patterns**: [Reference to bloat-patterns.md if applicable]
```

---

## Decision Log

### Example Entries

The following examples show how to log decisions. Real entries begin after this section.

---

## 2025-11-16 - Skill Creation Commit

**Changes**: Created `.claude/skills/reviewing-commits/` with all skill files
**Decision**: ✅ Approved
**Reasoning**:
- Directly serves North Star by preventing future bloat
- Increases AI agency through automated commit review
- No documentation bloat (skill-based, not static docs)
- Learning mechanism enables continuous improvement

**Outcome**: Skill successfully created and committed
**Learning**: Skills that improve the development process itself are high-value
**Patterns**: N/A (this creates the pattern detection system)

---

## Pattern Analysis

This section is updated periodically (weekly/monthly) to identify trends.

### Most Common Bloat Types
- To be filled after accumulating decisions

### Most Effective Interventions
- To be filled after accumulating decisions

### False Positives
- To be filled if skill incorrectly blocks good commits

### Missed Bloat
- To be filled if bloat gets through that should have been caught

---

## Skill Evolution History

Track when and why the skill itself was updated.

### v1.0.0 - 2025-11-16
**Changes**: Initial skill creation
**Reason**: Create intelligent pre-commit review to enforce North Star principles
**Improvements**:
- 7 validation checks (North Star, bloat, dependencies, code, tests, skills, agency)
- 17 known bloat patterns cataloged
- Learning mechanism established
- Automated and manual detection rules

**Next Review**: 2025-12-16 (monthly update)

---

## Monthly Reviews

### Template for Monthly Review

```markdown
## Monthly Review - YYYY-MM

**Commits Reviewed**: X
**Decisions**: ✅ X approved, ⚠️ Y warned, ❌ Z blocked

**Top Bloat Patterns**:
1. [Pattern name] - X occurrences
2. [Pattern name] - Y occurrences
3. [Pattern name] - Z occurrences

**Skill Effectiveness**:
- Bloat prevented: [Description]
- False positives: [Count and examples]
- Missed bloat: [Count and examples]

**Recommendations**:
- [Suggested skill improvements]
- [New patterns to add]
- [Rules to refine]

**Action Items**:
- [ ] Update bloat-patterns.md with new patterns
- [ ] Refine detection rules for [specific pattern]
- [ ] Add automated detection for [pattern]
- [ ] Update SKILL.md version
```

---

## Statistical Summary

Updated monthly.

### All-Time Statistics

**Total Reviews**: 0
**Decisions**:
- ✅ Approved: 0
- ⚠️ Warned: 0
- ❌ Blocked: 0

**Bloat Prevention**:
- Documentation files prevented: 0
- Dependencies blocked: 0
- Complex code simplified: 0
- Low-value tests removed: 0

**North Star Impact**:
- Commits making VOICE Relay faster: 0
- Commits making VOICE Relay simpler: 0
- Commits making VOICE Relay more secure: 0

### Skill Accuracy

**True Positives**: 0 (correctly identified bloat)
**False Positives**: 0 (incorrectly blocked good commits)
**True Negatives**: 0 (correctly approved good commits)
**False Negatives**: 0 (missed bloat that should have been caught)

**Precision**: N/A (will calculate after 10+ reviews)
**Recall**: N/A (will calculate after 10+ reviews)

---

## Learning Insights

### Key Learnings (To Be Updated)

This section captures high-level insights from the decision log.

**Example**:
- "Session summaries are ALWAYS bloat - auto-block without exception"
- "Procedural documentation converts well to skills with 90% success rate"
- "Dependencies >1MB require extra scrutiny - 80% are unnecessary"

(This section will be filled as patterns emerge from actual reviews)

---

## Quick Reference for Common Scenarios

Based on logged decisions, quick answers to recurring questions.

### "Should I add this .md file?"

**Decision Tree**:
1. Is it procedural (how-to)? → ❌ Make it a skill
2. Is it a summary/session report? → ❌ Archive or delete
3. Does it duplicate existing docs? → ❌ Consolidate
4. Is it necessary reference? → ⚠️ OK if <2 docs in commit

**Based on**: [Will reference specific commits once logged]

### "Should I add this npm package?"

**Decision Tree**:
1. Is it in approved list? → ✅ OK
2. Can I implement it myself in <50 lines? → ❌ Implement yourself
3. Is it >1MB? → ⚠️ Justify or find alternative
4. Is it absolutely essential? → ⚠️ Justify against North Star

**Based on**: [Will reference specific commits once logged]

### "Is this abstraction necessary?"

**Decision Tree**:
1. Is it used in 3+ places? → ✅ Good abstraction
2. Is it used in 1-2 places? → ❌ Inline it
3. Is it not used yet? → ❌ YAGNI - remove

**Based on**: [Will reference specific commits once logged]

---

## Appendix: Log Format Specification

For consistency, all log entries should follow this format:

```markdown
## YYYY-MM-DD - Commit [short-hash or brief description]

**Changes**: [1-2 sentence description]
**Files**: [Optional: list of key files if relevant]
**Decision**: ✅ Approved / ⚠️ Warned / ❌ Blocked
**Reasoning**:
- [Bullet point 1 - North Star alignment check]
- [Bullet point 2 - Bloat check results]
- [Bullet point 3 - Other relevant factors]

**Outcome**: [What happened after the review]
**Learning**: [1-2 sentences on what to remember]
**Patterns**: [Reference to bloat-patterns.md sections, or "N/A"]
**Follow-up**: [Optional: any action items]
```

### Decision Codes

- ✅ **Approved**: Commit fully aligns with North Star, no issues
- ⚠️ **Warned**: Commit has concerns but ultimately allowed (with modifications)
- ❌ **Blocked**: Commit rejected, requires significant changes

### Reasoning Categories

Tag your reasoning with these categories when applicable:
- `[NORTH-STAR-FASTER]` - Performance impact
- `[NORTH-STAR-SIMPLER]` - Complexity impact
- `[NORTH-STAR-SECURE]` - Security impact
- `[BLOAT-DOCS]` - Documentation bloat
- `[BLOAT-DEPS]` - Dependency bloat
- `[BLOAT-CODE]` - Code complexity bloat
- `[BLOAT-TESTS]` - Test bloat
- `[SKILLS-USAGE]` - Skills vs docs
- `[AGENCY-INCREASE]` - Impact on AI autonomy

---

## Notes

- **Be Honest**: Log all decisions, including mistakes
- **Be Specific**: Reference actual files and line counts
- **Be Reflective**: What would you do differently?
- **Be Actionable**: Convert learnings into skill improvements

The quality of this log determines the quality of the skill's evolution.

---

## Recent Entries

(Entries will be added below in reverse chronological order - newest first)

---

<!-- New entries go here -->
