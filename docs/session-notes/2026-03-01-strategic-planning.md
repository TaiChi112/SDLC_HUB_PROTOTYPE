# Session Notes: Strategic Planning & MCP Integration Discussion

**Date**: March 1, 2026  
**Session Type**: Planning & Architecture Discussion  
**Participants**: Development Team

---

## 📋 Session Overview

This session covered strategic planning for Blueprint Hub, focusing on:
1. **MCP Integration** (Excalidraw for visual architecture design)
2. **Multi-turn LLM Prompting** (conversational spec generation)
3. **Feature Analysis & Recommendations**
4. **Monorepo Migration** (completed successfully)
5. **Knowledge Management** (preserving conversations)

---

## 🎯 Key Decisions Made

### 1. Excalidraw MCP Integration Strategy

**User's Original Request**:
> "ฉันมีแผนที่จะเอา Excalidraw MCP เข้ามาใช้สำหรับ render แสดงผล visualization process ของ software standard docs SDLC โดยไม่ลงรายละเอียด เน้นเห็นภาพรวมการไหลเข้าออกของ process ที่ LLM generate จากไอเดียเรา"

**Decision**:
✅ **Proceed with Excalidraw MCP integration** as Phase 2 feature

**Architecture**:
```
User Input (Project Idea)
    ↓
LLM Generates SDLC Docs
    ↓
Parse & Extract Process Flow
    ↓
Generate Excalidraw JSON
    ↓
Store in Database (artifact.content)
    ↓
Render Visual Diagram on Frontend
```

**Technical Implementation**:
- Excalidraw stores diagrams as **JSON** (PostgreSQL compatible)
- Add `contentFormat: 'excalidraw'` to artifact types
- Frontend toggles: "Mermaid View" vs "Excalidraw View"
- Backend MCP client connects to Excalidraw MCP server

**Benefits**:
- 📊 Visual overview of SDLC process flow
- 🎨 Non-technical users can understand architecture
- 💾 JSON storage = easy database persistence
- 🔄 Can convert between Mermaid ↔ Excalidraw

**Next Steps**:
- [ ] Research Excalidraw MCP server API (March 15)
- [ ] Create proof-of-concept: LLM → Excalidraw JSON (March 20)
- [ ] Build Excalidraw viewer component (March 25)
- [ ] Integrate with artifact system (April 1)

---

### 2. Multi-turn LLM Prompting for Complete SDLC Docs

**User's Original Question**:
> "ถ้าเรามี standard docs SDLC template แล้วให้ LLM generate docs SDLC แม้จะยังได้ข้อมูลไม่ครบ เราจะทำอย่างไรให้เราสามารถสั่ง LLM generate standard docs SDLC ส่วนที่เหลือได้ และแม้แต่อยากให้ LLM ช่วยคิดเพิ่ม functional requirement และส่วนอื่นๆ"

**Solution: Conversational Refinement + Gap Detection**

#### Approach: Multi-turn Conversation Flow

```
Turn 1 (Initial Generation):
User: "Create e-commerce checkout spec"
LLM: [Generates initial spec]
     Detects gaps: Missing NFRs, Constraints

Turn 2 (Gap Suggestion):
LLM: "I've created a draft (65% complete). 
      Missing sections:
      • Non-Functional Requirements
      • Technical Constraints
      • Assumptions
      
      Would you like me to suggest these?"

User: "Yes, add NFRs"

Turn 3 (AI Suggests NFRs):
LLM: "Based on e-commerce context, I suggest:
      • Response time < 2 seconds
      • 99.9% uptime SLA
      • PCI-DSS compliance
      • Support 10,000 concurrent users
      
      Should I add these to your spec?"

User: "Yes, add all"

Turn 4 (Updated Spec):
LLM: [Updates blueprint with NFRs]
     "Spec now 85% complete. 
      Would you like me to suggest Constraints?"
```

#### Implementation Strategy

**1. Gap Detection Algorithm**:
```typescript
function detectGaps(blueprint: Blueprint): GapAnalysis {
  const gaps = [];
  
  if (!blueprint.stakeholders?.length) {
    gaps.push({
      section: 'stakeholders',
      severity: 'high',
      suggestion: 'AI can infer from project type'
    });
  }
  
  if (!blueprint.nfrs?.length) {
    gaps.push({
      section: 'nfrs',
      severity: 'critical',
      suggestion: 'Performance, security, scalability'
    });
  }
  
  return { gaps, completeness: calculateCompleteness(blueprint) };
}
```

**2. Context-Aware Prompting**:
```
System Prompt:
"You are refining an existing SDLC specification.

Current Spec:
- Title: {title}
- Problem: {problem}
- Existing FRs: {existingFRs}

Missing Sections: {gapsList}

Task: Based on the project context, suggest:
1. Non-Functional Requirements
2. Technical Constraints
3. Business Assumptions

Format as structured JSON."
```

**Decision**:
✅ **Implement conversational refinement with smart gap detection**

**Next Steps**:
- [ ] Build gap detection algorithm (March 10)
- [ ] Create conversation UI component (March 15)
- [ ] Implement context-aware prompts (March 20)
- [ ] Add "Smart Complete" button to UI (March 25)

---

### 3. Feature Enhancement: "Smart Complete" Button

**New Feature**:
Add a **"AI Complete Missing Sections"** button to blueprint detail page

**UI Mockup**:
```
┌─ Blueprint Detail ───────────────────────┐
│ Project: E-commerce Checkout             │
│ Status: Draft (65% complete) ⚠️           │
│                                          │
│ Missing:                                 │
│ • Non-Functional Requirements            │
│ • Technical Constraints                  │
│ • Assumptions                            │
│                                          │
│ [🤖 AI: Complete Missing Sections]       │
└──────────────────────────────────────────┘
```

**Implementation**:
```typescript
async function handleSmartComplete() {
  // 1. Detect gaps
  const gaps = analyzeBlueprint(blueprint);
  
  // 2. Call AI API
  const suggestions = await fetch('/api/ai/complete-blueprint', {
    method: 'POST',
    body: JSON.stringify({ blueprint, gaps })
  });
  
  // 3. Show modal with suggestions
  showSuggestionModal(suggestions);
  
  // 4. User approves → merge
  if (userApproved) {
    updateBlueprint({ ...blueprint, ...suggestions });
  }
}
```

**Decision**:
✅ **Implement as Q2 2026 feature**

---

### 4. GitHub Copilot Data Management

**User's Concern**:
> "ฉันไม่รู้ว่า github copilot agent สามารถกลับไปดึงข้อมูลที่ response ให้ฉันได้ไหม... อยากรู้ว่าข้อมูลที่เราคุยกันนี้ ถูกเก็บไว้ที่ไหนบ้าง Local หรือ Cloud"

**Answer**:
⚠️ **GitHub Copilot conversations are stored LOCALLY and TEMPORARILY**

Storage Details:
- **Location**: `%APPDATA%\Code\User\globalStorage\github.copilot-chat\` (Windows)
- **Persistence**: Session-based (cleared on VS Code restart or cache clear)
- **Cloud Backup**: None (not synced to GitHub cloud)

**Solution Implemented**:
✅ Created **`docs/session-notes/`** folder for permanent conversation archival

**Workflow**:
```
GitHub Copilot Chat (temporary)
    ↓
Important discussion? → YES
    ↓
Create session note: docs/session-notes/YYYY-MM-DD-topic.md
    ↓
Strategic decision? → Update DEVELOPMENT_PLANS.md
    ↓
Feature spec? → Update FEATURE_ROADMAP.md
```

**Decision**:
✅ **Use session-notes/ for all future important discussions**
✅ **Created COPILOT_DATA_MANAGEMENT.md to explain this system**

---

## 📊 Feature Analysis Results

**Section Completeness** (based on typical AI-generated specs):

| Section | Typical Status | AI Enhancement Priority |
|---------|---------------|-------------------------|
| Project Info | ✅ Complete | Low |
| Problem Statement | ✅ Complete | Low |
| Scope | ⚠️ Partial | Medium |
| Stakeholders | ⚠️ Often incomplete | High |
| Functional Requirements | ✅ Usually complete | Medium |
| **Non-Functional Requirements** | ❌ **Often missing** | 🔥 **Critical** |
| **Constraints** | ❌ **Often missing** | 🔥 **Critical** |
| Assumptions | ⚠️ Partial | High |
| Acceptance Criteria | ⚠️ Partial | Medium |

**Recommendation**:
Focus AI enhancement on **NFRs** and **Constraints** (most commonly missing).

---

## 🔧 MCP Integration Possibilities

### Recommended MCP Servers for Blueprint Hub

| MCP Server | Use Case | Priority | Status |
|------------|----------|----------|--------|
| **Excalidraw** | Visual SDLC diagrams | 🔥 High | 🔜 Q2 2026 |
| **GitHub** | Link blueprints to repos | ⚡ Medium | 🔮 Q3 2026 |
| **Linear** | Link requirements to tasks | ⚡ Medium | 🔮 Future |
| **PostgreSQL** | Direct DB queries | 💡 Low | 🔮 Future |

**Decision**:
✅ **Start with Excalidraw MCP** (highest user value)

---

## 💡 New Ideas Discussed

### 1. "Blueprint Health Score"
- Auto-calculate completeness percentage (0-100%)
- Show missing critical sections
- Color-coded indicators: 🔴 <50%, 🟡 50-80%, 🟢 >80%

### 2. "AI Spec Reviewer"
- Analyze requirement quality
- Detect ambiguous language ("should", "might", "fast")
- Suggest clearer phrasing

### 3. "Versioning Diff View"
- Show changes between blueprint versions
- Highlight additions/removals/modifications
- Track change history

### 4. "Export to Professional SRS"
- Generate IEEE 830 compliant documents
- Export to PDF/Word/Markdown
- Include all diagrams and tables

---

## 📝 Action Items

| Task | Owner | Deadline | Status |
|------|-------|----------|--------|
| Research Excalidraw MCP API | Dev Team | March 15 | 🔄 In Progress |
| Design conversation UI mockups | UX | March 10 | 🔜 Not Started |
| Implement gap detection logic | Backend | March 20 | 🔜 Not Started |
| Create Smart Complete button | Frontend | March 25 | 🔜 Not Started |
| Write session-notes template | Docs | March 5 | ✅ Done |
| Update README with session-notes link | Docs | March 1 | ✅ Done |

---

## 🔗 Related Documents

- **[DEVELOPMENT_PLANS.md](../DEVELOPMENT_PLANS.md)** - Strategic initiatives and technical details
- **[FEATURE_ROADMAP.md](../FEATURE_ROADMAP.md)** - Product roadmap and feature backlog
- **[COPILOT_DATA_MANAGEMENT.md](../COPILOT_DATA_MANAGEMENT.md)** - How we preserve conversations
- **[BACKEND_SETUP.md](../BACKEND_SETUP.md)** - Python backend setup

---

## 📌 Key Takeaways

1. ✅ **Excalidraw MCP is a great fit** for visual SDLC process diagrams
2. ✅ **Multi-turn prompting + gap detection** solves incomplete spec problem
3. ✅ **Smart Complete button** significantly improves UX
4. ✅ **Session notes system** preserves important conversations permanently
5. ✅ **GitHub Copilot data is local & temporary** - must save manually

---

## 🚀 Next Session

**Topic**: MCP Integration Proof-of-Concept  
**Planned Date**: March 15, 2026  
**Goals**: 
- Demo Excalidraw MCP server setup
- Show LLM → Excalidraw JSON generation
- Test visual diagram rendering

---

**Session Recorded By**: GitHub Copilot Agent  
**Last Updated**: March 1, 2026
