# Session Note: Completion Handshake + Auto-Save Policy
**Date**: 2026-03-01  
**Type**: Agent  
**Owner**: Anothai

## 1) Context / Problem
- User wants a reliable closing behavior after every completed task.
- User wants persistent, actionable handoff: follow-up question, next actions, and ready-to-run prompts.
- User wants auto-save guidance for important discussions and strict session index updates.

## 2) Decision Made
- Enforce completion handshake in instructions for every finished task.
- Add explicit save-note-only behavior: one-line response with saved path.
- Require session index update whenever a note is created or updated.
- Add macro prompts (10 total) grouped by Ask / Plan / Agent for repeatable daily workflow.

## 3) Alternatives Considered + Tradeoffs
- Option A: Keep instructions short and rely on agent judgment only.
  - Pros: Less policy overhead, simpler file.
  - Cons: Inconsistent outputs, weak handoff quality, missed save/index updates.
- Option B: Add explicit closing policy + prompt macros (chosen).
  - Pros: Consistent behavior, better execution continuity, faster user command reuse.
  - Cons: Longer instruction file, more constraints to maintain.

## 4) Action Items (Next Steps)
- [ ] Monitor for 3-5 sessions and trim any macro prompts that are rarely used.
- [ ] Add one minimal save-note command variant for ultra-fast logging.
- [ ] Optionally add a short checklist in README for contributors to follow the same policy.

## 5) Affected Files / Routes
- .github/copilot-instructions.md
- docs/session-notes/README.md
- docs/session-notes/2026-03-01-completion-handshake-auto-save-policy.md

## 6) Open Questions
- Should auto-save become mandatory (hard rule) or remain suggestive (soft rule)?
- Should save-note-only one-line format include markdown link or plain path only?

## 7) Reference Links
- PR/Commit:
- Related docs:
  - ../README.md
  - ../COPILOT_DATA_MANAGEMENT.md
  - ./README.md
