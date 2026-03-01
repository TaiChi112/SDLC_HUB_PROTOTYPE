# GitHub Copilot Data Storage & Conversation Management

**Last Updated**: March 1, 2026  
**Purpose**: Explain where Copilot stores conversation data and how to preserve important discussions

---

## 🤔 คำถามที่พบบ่อย: ข้อมูลที่คุยกับ GitHub Copilot ถูกเก็บไว้ที่ไหน?

### 📍 Data Storage Locations

| Type | Location | Persistence | Access |
|------|----------|-------------|--------|
| **Conversation History** | VS Code local cache | Temporary (session-based) | Local only |
| **Chat Threads** | Local workspace | Until cleared | Local only |
| **Telemetry Data** | GitHub Cloud (opt-in) | Encrypted, anonymized | GitHub only |
| **Code Suggestions** | Ephemeral (not stored) | No persistence | Real-time only |

---

## 🔐 Privacy & Data Handling

### What Gets Sent to GitHub?

When you use GitHub Copilot:

1. **Your Prompts** → Sent to GitHub/OpenAI for processing
2. **Surrounding Code Context** → Sent for better answers
3. **File Names** → May be sent for context
4. **Telemetry** → Anonymous usage statistics (if enabled)

### What Stays Local?

1. **Your Source Code** → Never permanently stored on GitHub servers
2. **Conversation History** → Stored locally in VS Code cache
3. **Session State** → Temporary, cleared when VS Code restarts

### Important Notes

⚠️ **Conversation History is NOT permanent**:
- Stored in: `%APPDATA%\Code\User\globalStorage\github.copilot-chat\` (Windows)
- Cleared when: 
  - You clear VS Code cache
  - You reinstall VS Code
  - Storage reaches size limit

✅ **How to Preserve Important Discussions**:
- **Copy to markdown files** (like this session-notes folder)
- **Export conversations manually** (not automated yet)
- **Document decisions in docs/** (permanent)

---

## 💾 How This Project Manages Knowledge

### Our Solution: Session Notes System

We created **`docs/session-notes/`** folder to preserve important conversations:

```
docs/
├── session-notes/
│   ├── 2026-03-01-strategic-planning.md     ← Today's discussion
│   ├── 2026-03-05-mcp-integration-poc.md    ← Future sessions
│   └── README.md                             ← Index of all sessions
├── FEATURE_ROADMAP.md                        ← Long-term plans
├── DEVELOPMENT_PLANS.md                      ← Strategic initiatives
└── COPILOT_DATA_MANAGEMENT.md                ← This file
```

### When to Create a Session Note

Create a new session note when:
- ✅ Making important architectural decisions
- ✅ Discussing new feature designs
- ✅ Solving complex technical problems
- ✅ Planning multi-phase initiatives
- ✅ Reviewing performance or analytics

---

## 🔄 GitHub Copilot MCP Integration

### Can GitHub Copilot Use MCP?

**Status as of March 2026**: 
- ⚠️ **Not officially supported yet**
- GitHub Copilot does NOT natively support MCP servers

### Alternatives

#### Option 1: Custom Backend with MCP (Recommended)
```
User Interface (Next.js)
    ↓
Backend API (Python FastAPI) ← Our implementation
    ↓
MCP Client (connects to MCP servers)
    ↓
Excalidraw MCP Server, GitHub MCP Server, etc.
```

**This is what we'll implement** for Excalidraw integration.

#### Option 2: Wait for GitHub Copilot Native MCP Support
**Timeline**: Unknown (possibly H2 2026 or later)

---

## 📝 Best Practices for Preserving Knowledge

### 1. Document Immediately
Don't wait - document decisions while they're fresh

### 2. Use Consistent Naming
Session notes: `YYYY-MM-DD-topic-name.md`

### 3. Link Related Documents
Always reference other docs in your session notes

### 4. Update README as Index
Keep `docs/session-notes/README.md` updated with all sessions

### 5. Periodic Review
Monthly: Review session notes → merge key points into FEATURE_ROADMAP

---

## 📊 Knowledge Management Flow

```
┌─────────────────────────────────────────┐
│  1. Discussion with GitHub Copilot      │
│     (Stored locally, temporary)         │
└────────────────┬────────────────────────┘
                 │
                 ├─ Important? → YES
                 │
┌────────────────┴────────────────────────┐
│  2. Create Session Note                 │
│     docs/session-notes/YYYY-MM-DD.md    │
└────────────────┬────────────────────────┘
                 │
                 ├─ Strategic decision?
                 │
┌────────────────┴────────────────────────┐
│  3. Update DEVELOPMENT_PLANS.md         │
│     (Long-term strategic document)      │
└────────────────┬────────────────────────┘
                 │
                 ├─ Feature spec?
                 │
┌────────────────┴────────────────────────┐
│  4. Update FEATURE_ROADMAP.md           │
│     (Product roadmap)                   │
└─────────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Screenshot Important Diagrams**: If Copilot generates helpful diagrams, save to `docs/images/`

2. **Use Git Commits as Documentation**: Write descriptive commit messages

3. **Tag Conversations**: When asking Copilot, mention context for better results

4. **Export Before Big Changes**: Before major refactors, save conversation history

---

## 🔗 References

- [GitHub Copilot Privacy Statement](https://docs.github.com/en/copilot/overview-of-github-copilot/privacy-statement)
- [VS Code Settings Sync](https://code.visualstudio.com/docs/editor/settings-sync)
- [Model Context Protocol (MCP) Spec](https://modelcontextprotocol.io)

---

**Summary**: 
- ⚠️ GitHub Copilot conversations are **local** and **temporary**
- ✅ We solve this with **session notes** in `docs/session-notes/`
- 🚀 Future: Consider automation for documentation extraction

---

**Created**: March 1, 2026  
**Maintained By**: The Blueprint Hub Team
