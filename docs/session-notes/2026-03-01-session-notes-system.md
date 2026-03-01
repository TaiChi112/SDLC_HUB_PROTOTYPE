# Session Notes: Understanding Session Notes System & Copilot Data Storage

**Date**: March 1, 2026  
**Session Type**: Q&A / Knowledge Transfer  
**Participants**: Development Team

---

## 📋 Session Overview

This session clarified how GitHub Copilot stores conversation data and explained the session notes system we implemented to preserve important discussions permanently.

---

## 🎯 Key Questions Answered

### 1. Where is Copilot conversation data stored?

**Answer**: **Local storage, temporary**

| Storage Aspect | Details |
|---------------|---------|
| **Location** | `%APPDATA%\Code\User\globalStorage\github.copilot-chat\` (Windows) |
| **Persistence** | Session-based - cleared on VS Code restart or cache clear |
| **Cloud Backup** | ❌ None - conversations are NOT synced to GitHub cloud |
| **Privacy** | ✅ Prompts sent to GitHub/OpenAI for processing but not stored permanently |

**Implication**: 
- Conversations can be lost when clearing VS Code cache
- No way to retrieve old conversations after they're cleared
- Must manually preserve important discussions

### 2. How do we preserve important conversations?

**Solution**: **Session Notes System**

We created a structured system in `docs/session-notes/`:

```
docs/
├── session-notes/
│   ├── README.md                           ← Index + Template
│   ├── 2026-03-01-strategic-planning.md    ← Previous session
│   └── 2026-03-01-session-notes-system.md  ← This session
│
├── COPILOT_DATA_MANAGEMENT.md              ← Explains data storage
├── DEVELOPMENT_PLANS.md                     ← Strategic plans
└── FEATURE_ROADMAP.md                       ← Product roadmap
```

**Benefits**:
- 📚 **Easy Navigation**: Like a book's table of contents - click file to read
- 🔍 **Searchable**: Can grep/search across all session notes
- 📅 **Dated**: Know when each discussion happened
- 🔗 **Linkable**: Reference specific sessions in other docs

### 3. Which Copilot mode can create files?

**Answer**: **Only Agent mode**

| Mode | Can Create/Edit Files? | Can Answer Questions? | Use Case |
|------|----------------------|---------------------|-----------|
| **Ask** ❓ | ❌ No | ✅ Yes | Quick questions, explanations |
| **Plan** 📋 | ❌ No (planning only) | ✅ Yes | Multi-step planning, strategy |
| **Agent** 🤖 | ✅ **YES** | ✅ Yes | File operations, implementation |

**Important**: 
- To save session notes → **must use Agent mode**
- Ask/Plan modes can answer questions but cannot write files

### 4. Do we create a new file each time or append to existing?

**Answer**: **New file per session**

**Naming Convention**: `YYYY-MM-DD-topic-name.md`

Examples:
- `2026-03-01-strategic-planning.md` (first session today)
- `2026-03-01-session-notes-system.md` (second session today)
- `2026-03-15-mcp-integration-poc.md` (future session)

**Why separate files?**
- ✅ Easier to find specific discussions
- ✅ Clearer organization (one topic per file)
- ✅ Can link to specific sessions in other docs
- ✅ Acts like "table of contents" - click and read

### 5. What if I prompt "save this conversation" in Ask mode?

**Answer**: 
- ❌ Ask mode **cannot** save files
- ✅ Copilot will **explain** you need to switch to Agent mode
- ✅ Then you can prompt again in Agent mode to save

---

## 💡 Workflow Examples

### Example 1: Typical Workflow

```
1. Start conversation in Ask mode
   User: "How does MCP integration work?"
   Copilot: [Explains MCP...]
   
2. Discussion becomes important → Switch to Agent mode
   User: "บันทึกการคุยนี้เกี่ยวกับ MCP integration"
   
3. Agent creates session note
   ✅ Creates: docs/session-notes/2026-03-15-mcp-discussion.md
   ✅ Updates: docs/session-notes/README.md (index)
   ✅ Responds: "Saved to docs/session-notes/..."
```

### Example 2: Quick Question (No Save Needed)

```
Ask mode:
User: "What port does frontend run on?"
Copilot: "3000"

→ No need to save (simple factual answer)
```

### Example 3: Strategic Planning (Should Save)

```
Agent mode:
User: "Let's design the authentication flow"
Copilot: [Discusses OAuth, JWT, sessions...]

User: "บันทึกการคุยนี้เกี่ยวกับ authentication design"

✅ Agent saves to: docs/session-notes/2026-03-XX-auth-design.md
```

---

## 🛠️ Technical Implementation

### File Structure

Each session note follows this template:

```markdown
# Session Notes: [Topic]

**Date**: YYYY-MM-DD
**Session Type**: [Planning / Q&A / Technical Discussion]
**Participants**: [Team members]

## Session Overview
Brief summary

## Key Questions Answered
1. Question → Answer
2. Question → Answer

## Key Decisions Made
- Decision 1
- Decision 2

## Action Items
- [ ] Task 1
- [ ] Task 2

## Related Documents
- [Link to related docs]
```

### Index Management

`docs/session-notes/README.md` maintains a table:

```markdown
| Date | Topic | Key Decisions |
|------|-------|---------------|
| 2026-03-01 | Strategic Planning | MCP integration, Multi-turn LLM |
| 2026-03-01 | Session Notes System | Explained data storage, workflow |
```

---

## 📊 Knowledge Management Flow

```
┌─────────────────────────────────────────┐
│  1. Discussion with GitHub Copilot      │
│     (Ask/Plan/Agent mode)               │
└────────────────┬────────────────────────┘
                 │
                 ├─ Important? → YES
                 │
┌────────────────┴────────────────────────┐
│  2. Switch to Agent mode                │
│     Prompt: "บันทึกการคุยนี้..."         │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│  3. Agent creates session note          │
│     docs/session-notes/YYYY-MM-DD.md    │
└────────────────┬────────────────────────┘
                 │
                 ├─ Strategic? → Update DEVELOPMENT_PLANS.md
                 ├─ Feature? → Update FEATURE_ROADMAP.md
                 └─ Reference in README.md
```

---

## 🎯 Best Practices

### When to Create a Session Note

✅ **Do save** when:
- Making architectural decisions
- Designing new features
- Solving complex problems
- Planning multi-phase projects
- Discussing strategic direction

❌ **Don't save** when:
- Simple factual questions ("What's the API endpoint?")
- Quick syntax help
- One-off commands
- Already documented elsewhere

### Naming Conventions

Format: `YYYY-MM-DD-topic-name.md`

**Good names**:
- `2026-03-01-strategic-planning.md`
- `2026-03-15-mcp-integration-poc.md`
- `2026-04-01-database-migration.md`

**Bad names**:
- `session1.md` (not descriptive)
- `notes.md` (too generic)
- `meeting-notes-today.md` (no date in filename)

### Linking Related Docs

Always link to related documentation:

```markdown
## Related Documents
- [DEVELOPMENT_PLANS.md](../DEVELOPMENT_PLANS.md)
- [FEATURE_ROADMAP.md](../FEATURE_ROADMAP.md)
- [Previous session](2026-03-01-strategic-planning.md)
```

---

## 📝 Action Items

| Task | Owner | Status |
|------|-------|--------|
| Update session notes when important discussions happen | Dev Team | 🔄 Ongoing |
| Review session notes monthly | Dev Team | 🔜 Next: April 1 |
| Link session notes in DEVELOPMENT_PLANS when strategic | Docs | 🔄 As needed |

---

## 🔗 Related Documents

- **[COPILOT_DATA_MANAGEMENT.md](../COPILOT_DATA_MANAGEMENT.md)** - Full explanation of data storage
- **[session-notes/README.md](README.md)** - Index of all sessions & template
- **[2026-03-01-strategic-planning.md](2026-03-01-strategic-planning.md)** - Previous session (MCP & LLM planning)

---

## 📌 Key Takeaways

1. ✅ **Copilot conversations are local & temporary** - stored in VS Code cache
2. ✅ **Session notes system** preserves important discussions permanently
3. ✅ **Agent mode only** can create/edit files
4. ✅ **One file per session** - acts like table of contents
5. ✅ **Use YYYY-MM-DD-topic.md** naming convention

---

## 💡 User's Feedback

> "เหมือนเราอ่านหนังสือ แล้วสามารถ click file นั้นเพื่ออ่านเลย เปรียบเหมือน table content ที่ click แล้ว link ไปให้อ่าน"

✅ **This is exactly what we achieved!**

---

**Session Recorded By**: GitHub Copilot Agent  
**Last Updated**: March 1, 2026
