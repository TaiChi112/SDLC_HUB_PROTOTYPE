# 🚀 Blueprint Hub - Feature Roadmap & Analysis

**Last Updated**: March 2026  
**Project Status**: Prototype V1 with Core Features

---

## 📊 Project Overview

**The Blueprint Hub** is a centralized platform for Software Requirements & Architecture artifacts, bridging the gap between "Idea" and "Implementation".

### Core Philosophy
- **Decoupling**: Separate Design Docs from Source Code for language-agnostic learning
- **Standardization**: Enforce SDLC Phase 1 structure (Inception/Requirements)
- **Community-Driven**: Open contribution system for continuous improvement

---

## 🏗 Current Architecture

### Technology Stack
| Layer              | Tech                                             | Status             |
| ------------------ | ------------------------------------------------ | ------------------ |
| **Frontend**       | Next.js 14 + React 19 + TypeScript + Tailwind v4 | ✅ Running          |
| **Authentication** | NextAuth.js (Google/GitHub OAuth)                | ✅ Implemented      |
| **Database**       | PostgreSQL + Prisma ORM                          | ✅ Ready            |
| **AI Backend**     | Python FastAPI + Gemini                          | ⚠️ Separate Service |

### Deployment
- **Frontend**: localhost:3001 (dev)
- **Backend**: localhost:8000 (Python FastAPI)
- **Database**: PostgreSQL (local Docker)

---

## ✅ Implemented Features

### 1. **User Authentication**
- [x] Google OAuth sign-in
- [x] GitHub OAuth sign-in
- [x] User profile with avatar & metadata
- [x] Session-based auth via NextAuth

### 2. **Specification Generator**
- [x] AI-powered spec generation (via Python Gemini API)
- [x] Publish/Draft toggle
- [x] Search & filter saved specs
- [x] Sort by date (latest/oldest)
- [x] Delete specs with confirmation
- [x] Toast notifications for feedback
- [x] Save drafts to PostgreSQL

### 3. **Blueprint Browsing**
- [x] Homepage: Browse community blueprints
- [x] Search functionality
- [x] Project cards with summaries
- [x] Detail view with artifacts

### 4. **User Profile**
- [x] Profile page with user info
- [x] Contribution history display
- [x] My Blueprints section
- [x] Activity heatmap
- [x] Light/dark theme consistency

### 5. **Data Persistence**
- [x] User account management
- [x] Spec storage with metadata
- [x] Contribution tracking
- [x] Published/draft state

---

## 🔍 Current Gaps & Analysis

### **Gap 1: No Spec Editing**
**Problem**: Users can generate or load specs, but cannot edit them inline  
**Impact**: Limited workflow flexibility  
**Complexity**: Medium  

### **Gap 2: Versioning UI Missing**
**Problem**: Database schema supports versions (V0.1 → V1.0 → etc), but no UI to manage them  
**Impact**: Can't compare versions or track evolution  
**Complexity**: Medium  

### **Gap 3: No Contribution System**
**Problem**: Schema has `Contribution` table & "Suggestion Mode" planned, but not implemented  
**Impact**: Can't leverage community feedback  
**Complexity**: High  

### **Gap 4: No Document Export**
**Problem**: Specs stored in DB but can't export as professional documents (PDF/SRS)  
**Impact**: Limited usability for stakeholders  
**Complexity**: Medium  

### **Gap 5: No Requirement Traceability**
**Problem**: FRs/NFRs not linked to tests, code, or implementation  
**Impact**: Can't verify specification completeness  
**Complexity**: High  

### **Gap 6: Limited Generator Integration**
**Problem**: Python API is isolated; no real-time validation or quality feedback  
**Impact**: Generated specs may have quality issues undetected  
**Complexity**: High  

---

## 🎯 Recommended Roadmap

### **Phase 1: Quick Wins** 🟢 (1-2 hours each)
*Low effort, immediate value*

- [ ] **1.1 Spec Editor Modal**
  - Add inline editor for title, description, sections
  - Save changes back to database
  - Live preview of changes
  - **Files**: `components/SpecEditorModal.tsx`, `app/api/user-specs/[id]/route.ts` (PATCH)

- [ ] **1.2 Version Dropdown**
  - Dropdown to select spec version (V0.1, V1.0, etc)
  - Show version history
  - Switch between versions
  - **Files**: `app/generator-test/page.tsx`, `components/VersionSelector.tsx`

- [ ] **1.3 Export to JSON/Markdown**
  - Button: "Download Spec"
  - Format: JSON or Markdown
  - Includes all sections + metadata
  - **Files**: `app/api/user-specs/[id]/export/route.ts`

- [ ] **1.4 Copy as Markdown**
  - Copy formatted spec to clipboard
  - Ready to paste in wikis/docs
  - **Files**: `components/CopyButton.tsx`

### **Phase 2: Core Features** 🟡 (3-4 hours each)
*Medium effort, high value for core workflow*

- [ ] **2.1 Contribution/Review System**
  - Volunteer can leave suggestions on specs
  - Author approves/rejects changes
  - Comment threads per section
  - Merge suggestions into new version
  - **Database**: Use existing `Contribution` table
  - **Files**: `components/ContributionPanel.tsx`, `app/api/contributions/route.ts`

- [ ] **2.2 Version Diff View**
  - Side-by-side comparison of two versions
  - Highlight added/removed/changed lines
  - Show who changed what
  - **Files**: `components/DiffView.tsx`, `app/api/user-specs/[id]/diff/route.ts`

- [ ] **2.3 Requirement Checklist**
  - Checkbox for each FR/NFR
  - Mark as "addressed by design"
  - Show coverage %
  - Track implementation readiness
  - **Files**: `components/RequirementChecklist.tsx`, `app/api/user-specs/[id]/checklist/route.ts`

- [ ] **2.4 Spec Templates**
  - Pre-filled templates for common project types
  - E-commerce, SaaS, Mobile App, etc
  - Quick-start for new specs
  - **Files**: `constants/specTemplates.ts`, `components/TemplateSelector.tsx`

### **Phase 3: Strategic Features** 🔴 (Multi-session)
*Higher complexity, aligns with vision*

- [ ] **3.1 Traceability Matrix**
  - Table: Requirements ↔ Tests ↔ Code
  - Link FR to test cases
  - Show implementation status
  - Export as XLSX
  - **Database**: New `Traceability` model
  - **Files**: `components/TraceabilityMatrix.tsx`, `app/api/traceability/route.ts`

- [ ] **3.2 AI Quality Engine**
  - Detect ambiguous requirements
  - Suggest missing sections
  - Check for conflicts (FR vs NFR)
  - Real-time feedback on spec quality
  - **Integration**: Call Python API for NLP analysis
  - **Files**: `app/api/specs/validate/route.ts`, `components/QualityFeedback.tsx`

- [ ] **3.3 Real-time Collaboration** *(if scaling)*
  - Multiple users editing same spec
  - Presence indicators
  - Conflict resolution
  - **Tech**: WebSockets or Server-Sent Events
  - **Files**: `lib/collaboration.ts`

- [ ] **3.4 Code Snippet Integration**
  - Embed code examples in specs
  - Link to GitHub repos/commits
  - Show architecture diagrams
  - **Files**: `components/CodeSnippet.tsx`, `components/DiagramRenderer.tsx`

---

## 📅 Suggested Priority Order

### **Immediate (This Week)** ⚡
1. Spec Editor Modal (unlocks editing workflow)
2. Version Dropdown (foundation for comparisons)
3. Export to JSON (quick value)

### **Short Term (Next 2 Weeks)** 📌
4. Version Diff View (support version management)
5. Contribution System (community feedback loop)
6. Requirement Checklist (track progress)

### **Medium Term (Next Month)** 📊
7. Spec Templates (speed up creation)
8. Traceability Matrix (connect to testing)
9. AI Quality Engine (automate reviews)

### **Long Term (Backlog)** 🎯
10. Real-time Collaboration
11. Code Integration
12. Advanced Analytics

---

## 🔧 Implementation Strategy

### For Each Feature:
1. **Define Data Model** - What DB changes needed?
2. **Design API** - What endpoints/mutations?
3. **Build UI** - React components
4. **Add Tests** - Validate functionality
5. **Document** - Update README + API docs

### Development Flow:
```
Feature Branch → UI Component → API Route → Database Migration → Testing → Merge
```

### Testing Checklist:
- [ ] TypeScript compilation passes
- [ ] All API endpoints 200 OK
- [ ] UI responsive on mobile (375px)
- [ ] Auth & permissions working
- [ ] Toast notifications appear
- [ ] No console errors

---

## 📚 Related Documentation

- [README.md](../README.md) - Setup & development
- [TODO.md](../TODO.md) - Original project vision
- [Prisma Schema](../prisma/schema.prisma) - Database structure

---

## 💡 Quick Reference: Which Feature First?

| Need                        | Start With              |
| --------------------------- | ----------------------- |
| "Users want to edit specs"  | Spec Editor Modal       |
| "Want version history"      | Version Dropdown + Diff |
| "Need download capability"  | Export to JSON          |
| "Want team feedback"        | Contribution System     |
| "Need progress tracking"    | Requirement Checklist   |
| "Tired of repetitive specs" | Spec Templates          |
| "Quality concerns on specs" | AI Quality Engine       |

---

**Last Updated**: March 1, 2026  
**Next Review**: After Phase 1 completion
