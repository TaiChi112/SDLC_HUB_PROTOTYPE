# Developer Onboarding Checklist

**Estimated Time**: 2-3 hours for complete onboarding  
**Updated**: March 2, 2026

---

## 🎯 Welcome to Blueprint Hub!

This checklist will help you understand our codebase, architecture, and development workflow in the fastest way possible. Each section links to visual documentation to speed up learning.

---

## 📋 Phase 1: Environment Setup (30 minutes)

- [ ] **Clone repository**
  ```bash
  git clone https://github.com/TaiChi112/BluePrint-Plateform-Prototype.git
  cd special_project_v1
  ```

- [ ] **Read [DEVELOPMENT_PLANS.md](./DEVELOPMENT_PLANS.md)** (5 min)
  - Overview of current initiatives
  - Technology choices explained

- [ ] **Review [Deployment Diagrams](./docs/diagrams/deployment.md)** (10 min)
  - **Development Environment** section - your workflow
  - Follow local setup instructions (dev vs production differences)
  - Contains Docker/environment configs reference

- [ ] **Install dependencies and start local server**
  - Frontend setup: `cd frontend && bun install && bun run dev`
  - Backend setup: `cd backend && uv venv && uv sync && task dev`
  - Database: Follow PostgreSQL setup in [BACKEND_SETUP.md](./docs/BACKEND_SETUP.md)

- [ ] **Verify system access**
  - Frontend: http://localhost:3001
  - Backend API: http://localhost:8000
  - Database: PostgreSQL running locally

---

## 🏗️ Phase 2: Architecture Understanding (45 minutes)

- [ ] **Study [Architecture Diagrams](./docs/diagrams/architecture.md)** (15 min)
  - **Architecture Overview** - Component relationships
  - **Component Details** section - frontend/backend/data layers
  - **Technology Stack** table - versions and tools we use
  - Understand layer separation (frontend → backend → database)

- [ ] **Read [README.md](./README.md)** in project root (10 min)
  - Project overview and motivation
  - Links to all core documentation

- [ ] **Review [System Architecture](./docs/README.md)** in docs (10 min)
  - Documentation structure
  - How to find things quickly

- [ ] **Code tour: Layer exploration** (10 min)
  - Frontend: `frontend/app/` - Next.js routes
  - Backend: `backend/api.py` - FastAPI endpoints
  - Database: `frontend/prisma/schema.prisma` - Data model

---

## 🔄 Phase 3: Data Flows & API Understanding (30 minutes)

- [ ] **Study [Data Flow Diagrams](./docs/diagrams/data-flow.md)** (25 min)
  - **1. Specification Generation Flow** - Main user workflow
  - **2. User Authentication Flow** - OAuth with Google/GitHub
  - **3. Blueprint Save/Update Flow** - CRUD operations
  - **4. Multi-turn Conversation Flow** - Context-aware follow-ups
  - **5. Database Operations Flow** - Prisma patterns
  - **Data Model (ERD)** - User → Blueprint → Section relationships
  
  **Key insights:**
  - Input validation happens at the API layer
  - LLM context includes previous blueprints
  - Database uses Prisma ORM for type safety

- [ ] **Review API Endpoints** (5 min)
  - Auth endpoints: See `Authentication Flow` diagram
  - Generation endpoint: See `Specification Generation Flow` diagram
  - CRUD endpoints: See `Blueprint Save/Update Flow` diagram

---

## 🎤 Phase 4: Codebase Navigation (30 minutes)

- [ ] **Frontend code structure walkthrough** (10 min)
  ```
  frontend/
    app/
      page.tsx          - Home page
      api/              - API routes
      generator-test/   - Main generator UI
    components/         - Reusable React components
    lib/               - Utilities (prisma, helpers)
    types/             - TypeScript interfaces
  ```
  - Use [Architecture Diagram](./docs/diagrams/architecture.md) to understand component boundaries

- [ ] **Backend code structure walkthrough** (10 min)
  ```
  backend/
    api.py           - FastAPI routes
    llm_service.py   - OpenAI integration
    spec_generator.py - Business logic
    database/        - Database utilities
  ```
  - Use [Data Flow Diagrams](./docs/diagrams/data-flow.md) to trace request paths

- [ ] **Database schema review** (5 min)
  - File: `frontend/prisma/schema.prisma`
  - Visual reference: [Data Model (ERD)](./docs/diagrams/data-flow.md#data-model-summary)
  - 3 main tables: User, Blueprint, Section

- [ ] **First commit verification** (5 min)
  - Make small test change: Edit `frontend/app/page.tsx`
  - Run linting: `cd frontend && bun run lint`
  - Run build: `cd frontend && bun run build`
  - Verify tests: `bun run test` (if applicable)

---

## 👥 Phase 5: User Understanding (15 minutes)

- [ ] **Study [User Journey Diagrams](./docs/diagrams/user-journey.md)** (15 min)
  - **New User Onboarding** - Understand "Aha moment" (30 seconds in)
  - **Product Manager Workflow** - How PMs use the tool
  - **Developer Spec Consumption** - How developers read specs
  - **Pain Points Mindmap** - Current UX challenges
  
  **Why it matters:**
  - Features you code serve specific user personas
  - Understanding user needs helps you make better UI/UX decisions
  - Pain points highlight areas ripe for improvement

---

## 🚀 Phase 6: Development Workflow (15 minutes)

- [ ] **Read [CONTRIBUTING.md](./CONTRIBUTING.md)** (10 min)
  - Git workflow and branch naming
  - PR review process
  - Code standards and conventions

- [ ] **Review [TypeScript Code Conventions](./docs/CODE_CONVENTIONS_TYPESCRIPT.md)** (5 min)
  - Naming conventions
  - Component patterns
  - Type safety requirements

---

## 🔍 Phase 7: First Feature Assignment (Ongoing)

- [ ] **Choose first task** (with mentor)
  - Start with `good first issue` label on GitHub
  - Review issue description
  - Link relevant diagram(s) from this checklist

- [ ] **Before coding**
  - Study [Data Flow Diagram](./docs/diagrams/data-flow.md) for your feature
  - Understand where your code fits in [Architecture](./docs/diagrams/architecture.md)
  - Check [User Journey](./docs/diagrams/user-journey.md) for UX context

- [ ] **During coding**
  - Keep relevant diagram open in second monitor/window
  - Reference [Code Conventions](./docs/CODE_CONVENTIONS_TYPESCRIPT.md)
  - Ask questions early (in #dev-help channel)

- [ ] **Before submitting PR**
  - Run lint: `cd frontend && bun run lint`
  - Run build: `cd frontend && bun run build`
  - Self-review using [Architecture diagram](./docs/diagrams/architecture.md)
  - Check [Contributing guide](./CONTRIBUTING.md) checklist

---

## 📚 Advanced Topics (As Needed)

### Understanding MCP Integrations (Future Features)
- [ ] Review [MCP Integration Diagrams](./docs/diagrams/mcp-integration.md)
- [ ] Read [MCP Integration Analysis Session Note](./docs/session-notes/2026-03-02-mcp-integration-analysis.md)
- [ ] Understand Q2-Q3 2026 roadmap for Database, Prompts, Excalidraw MCPs

### Infrastructure & Deployment
- [ ] Review [Deployment Architecture Diagrams](./docs/diagrams/deployment.md)
- [ ] Understand CI/CD pipeline (GitHub Actions)
- [ ] Know where staging and production are hosted

### Database & Performance
- [ ] Study [Database Operations Flow](./docs/diagrams/data-flow.md#6-database-operations-flow)
- [ ] Learn Prisma patterns used in codebase
- [ ] Understand query optimization basics

---

## 🎓 Quick Reference

### When you need to...

| Need | Reference | Time |
|------|-----------|------|
| Understand how a feature works | [Data Flow Diagrams](./docs/diagrams/data-flow.md) | 5-10 min |
| Find where code should go | [Architecture Diagrams](./docs/diagrams/architecture.md) | 5 min |
| Understand user needs | [User Journey Maps](./docs/diagrams/user-journey.md) | 10 min |
| Debug an issue | [Data Flow Diagrams](./docs/diagrams/data-flow.md) + [Architecture](./docs/diagrams/architecture.md) | 15 min |
| Set up local environment | [Deployment Diagrams](./docs/diagrams/deployment.md) | 10 min |
| Write code following standards | [Code Conventions](./docs/CODE_CONVENTIONS_TYPESCRIPT.md) | 5 min |
| Understand technical debt | [Architecture](./docs/diagrams/architecture.md) + [Development Plans](./DEVELOPMENT_PLANS.md) | 20 min |

---

## 💬 Getting Help

- **General questions**: Ask in #dev-help channel
- **Architecture questions**: Review [Architecture Diagrams](./docs/diagrams/architecture.md) first, then ask
- **Feature questions**: Check [User Journeys](./docs/diagrams/user-journey.md), then ask
- **Setup help**: Check [Deployment Diagrams](./docs/diagrams/deployment.md), then ask
- **Code review standards**: Reference [Contributing Guide](./CONTRIBUTING.md)

---

## ✅ Checklist for Mentors

When onboarding a new developer:

- [ ] Go through Phase 1 together (setup help)
- [ ] Pair on Phase 2 (architecture Q&A)
- [ ] Answer Phase 3 questions (data flows)
- [ ] Code review their Phase 4 walkthrough
- [ ] Assign small task from Phase 7
- [ ] Review first PR together

**Expected time**: 2-3 hours total + ongoing during first week

---

## 📊 Success Criteria

After completing this checklist, you should be able to:

✅ Run the application locally  
✅ Explain the system architecture (3 layers: frontend, backend, database)  
✅ Trace a user request through the codebase  
✅ Point to relevant diagrams for any feature question  
✅ Understand key data flows (generation, auth, save, multi-turn)  
✅ Know where to find code (which folder, which file)  
✅ Write code following our conventions  
✅ Understand user needs for the features you build  
✅ Contribute your first PR with confidence  

---

## 🎉 What's Next?

After completing this checklist:

1. **Choose your first task** from `good first issue` labels
2. **Pair with a mentor** on complex features
3. **Reference diagrams** constantly while coding
4. **Ask questions early** - we love explaining context
5. **Contribute documentation** improvements you find helpful

---

**Welcome to the team! 🚀**

Questions? Check the relevant diagram first, then ask in #dev-help!

---

**Last Updated**: March 2, 2026  
**Maintained by**: Development Team
