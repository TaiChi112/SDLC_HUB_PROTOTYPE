# Blueprint Hub - MCP Integration & Future Architecture

This document shows planned MCP (Model Context Protocol) integrations and their architecture.

---

## 1. Current Architecture vs. MCP-Enhanced Architecture

### Before MCP (Current State)

```mermaid
graph TB
    USER[User]
    FRONTEND[Frontend]
    BACKEND[Backend API]
    LLM[LLM Service]
    OPENAI[OpenAI API]
    DB[(Database)]

    USER --> FRONTEND
    FRONTEND --> BACKEND
    BACKEND --> LLM
    LLM --> OPENAI
    BACKEND --> DB

    classDef current fill:#64748b,stroke:#475569,color:#fff
    class USER,FRONTEND,BACKEND,LLM,OPENAI,DB current
```

### After MCP (Future State - Q2-Q3 2026)

```mermaid
graph TB
    USER[User]
    FRONTEND[Frontend]
    BACKEND[Backend API]
    
    subgraph "MCP Integration Layer"
        MCP_CLIENT[MCP Client]
        DB_MCP[Database MCP]
        PROMPT_MCP[Prompt Template MCP]
        EXCALIDRAW_MCP[Excalidraw MCP]
        GITHUB_MCP[GitHub MCP]
        SEARCH_MCP[Web Search MCP]
    end
    
    LLM[LLM Service]
    OPENAI[OpenAI API]
    DB[(PostgreSQL)]
    GITHUB[GitHub API]
    SEARCH_API[Search API]

    USER --> FRONTEND
    FRONTEND --> BACKEND
    BACKEND --> MCP_CLIENT
    
    MCP_CLIENT --> DB_MCP
    MCP_CLIENT --> PROMPT_MCP
    MCP_CLIENT --> EXCALIDRAW_MCP
    MCP_CLIENT --> GITHUB_MCP
    MCP_CLIENT --> SEARCH_MCP
    
    DB_MCP --> DB
    PROMPT_MCP --> LLM
    GITHUB_MCP --> GITHUB
    SEARCH_MCP --> SEARCH_API
    
    LLM --> OPENAI
    BACKEND --> DB

    classDef user fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef core fill:#10b981,stroke:#059669,color:#fff
    classDef mcp fill:#f59e0b,stroke:#d97706,color:#fff
    classDef external fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class USER user
    class FRONTEND,BACKEND,LLM core
    class MCP_CLIENT,DB_MCP,PROMPT_MCP,EXCALIDRAW_MCP,GITHUB_MCP,SEARCH_MCP mcp
    class OPENAI,DB,GITHUB,SEARCH_API external
```

---

## 2. MCP Integration Roadmap

```mermaid
gantt
    title Blueprint Hub MCP Integration Timeline
    dateFormat YYYY-MM-DD
    section Phase 1 - Foundation
    Database MCP                :active, p1_db, 2026-03-10, 10d
    Prompt Template MCP         :active, p1_prompt, 2026-03-10, 10d
    Testing & QA                :p1_test, after p1_db, 5d
    section Phase 2 - Visual Tools
    Excalidraw MCP POC          :p2_exc_poc, 2026-04-01, 7d
    Excalidraw Full Integration :p2_exc_full, after p2_exc_poc, 14d
    Frontend Visual Editor      :p2_ui, after p2_exc_poc, 14d
    section Phase 3 - Collaboration
    GitHub MCP                  :p3_github, 2026-05-01, 14d
    Issue/PR Sync               :p3_sync, after p3_github, 7d
    section Phase 4 - Enhancement
    Web Search MCP              :p4_search, 2026-06-01, 7d
    Slack Integration           :p4_slack, 2026-06-15, 7d
    section Ongoing
    Monitoring & Analytics      :crit, ongoing, 2026-07-01, 30d
```

---

## 3. Database MCP Architecture (Phase 1)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant MCP_Client as MCP Client
    participant DB_MCP as Database MCP
    participant PostgreSQL

    User->>Frontend: Enter prompt:<br/>"Create spec for payment system"
    Frontend->>Backend: POST /api/generate<br/>{prompt, blueprint_id}
    
    Backend->>MCP_Client: Request context
    MCP_Client->>DB_MCP: query_blueprints()<br/>similar to "payment"
    DB_MCP->>PostgreSQL: SELECT * FROM blueprints<br/>WHERE title ILIKE '%payment%'
    PostgreSQL-->>DB_MCP: Related blueprints
    DB_MCP-->>MCP_Client: Context data
    
    MCP_Client->>Backend: Enhanced context
    Backend->>Backend: Build prompt with context
    Backend->>OpenAI: Generate with rich context
    OpenAI-->>Backend: Better quality spec
    Backend-->>Frontend: Generated spec
    Frontend->>User: Display spec
    
    Note over User,PostgreSQL: Context-aware generation<br/>Quality improvement: +40%
```

**Benefits**:
- ✅ LLM has access to historical data
- ✅ Can reference similar specs
- ✅ Better consistency across blueprints
- ✅ Reduced hallucinations

---

## 4. Excalidraw MCP Architecture (Phase 2)

```mermaid
flowchart TB
    subgraph "User Interface"
        VISUAL[Visual Editor<br/>Excalidraw UI]
        TEXT[Text Editor<br/>Mermaid Syntax]
    end

    subgraph "MCP Bridge"
        EXCAL_MCP[Excalidraw MCP]
        CONVERTER[Format Converter<br/>JSON ↔ Mermaid]
    end

    subgraph "Storage"
        CANVAS[Canvas JSON<br/>Excalidraw format]
        DIAGRAM[Diagram Data<br/>Mermaid format]
        DB[(Database)]
    end

    VISUAL <--> EXCAL_MCP
    TEXT <--> CONVERTER
    EXCAL_MCP <--> CONVERTER
    
    EXCAL_MCP --> CANVAS
    CONVERTER --> DIAGRAM
    CANVAS --> DB
    DIAGRAM --> DB

    classDef ui fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef mcp fill:#f59e0b,stroke:#d97706,color:#fff
    classDef storage fill:#10b981,stroke:#059669,color:#fff

    class VISUAL,TEXT ui
    class EXCAL_MCP,CONVERTER mcp
    class CANVAS,DIAGRAM,DB storage
```

**Use Cases**:
1. **Non-technical users** draw diagrams visually
2. **Auto-convert** to Mermaid for version control
3. **Bidirectional sync** (edit in either mode)
4. **Export** to PNG/SVG for presentations

---

## 5. GitHub MCP Architecture (Phase 3)

```mermaid
graph LR
    subgraph "Blueprint Hub"
        SPEC[Blueprint Spec]
        SECTIONS[Sections]
        REQUIREMENTS[Requirements]
    end

    subgraph "GitHub MCP"
        SYNC[Sync Service]
        MAPPER[Issue Mapper]
        LINKER[PR Linker]
    end

    subgraph "GitHub"
        ISSUES[Issues]
        PRS[Pull Requests]
        REPO[Repository]
    end

    SPEC --> SYNC
    SECTIONS --> MAPPER
    REQUIREMENTS --> LINKER
    
    SYNC --> ISSUES
    MAPPER --> ISSUES
    LINKER --> PRS
    
    ISSUES --> REPO
    PRS --> REPO

    classDef hub fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef mcp fill:#f59e0b,stroke:#d97706,color:#fff
    classDef github fill:#24292e,stroke:#000,color:#fff

    class SPEC,SECTIONS,REQUIREMENTS hub
    class SYNC,MAPPER,LINKER mcp
    class ISSUES,PRS,REPO github
```

**Traceability Flow**:
```
Requirement Section → GitHub Issue → Pull Request → Code Commit → Deployment
```

**Benefits**:
- ✅ Full traceability from spec to code
- ✅ Auto-create issues from requirements
- ✅ Link PRs back to specs
- ✅ Status sync (spec updates when issue closed)

---

## 6. Prompt Template MCP (Phase 1)

Domain-specific prompt templates for better spec generation.

```mermaid
flowchart TD
    USER_INPUT[User Input:<br/>"E-commerce checkout"]
    
    DETECT{Detect Domain}
    
    ECOM[E-commerce Template]
    SAAS[SaaS Template]
    MOBILE[Mobile App Template]
    GENERIC[Generic Template]
    
    PROMPT_BUILD[Build Enhanced Prompt]
    LLM[LLM Generation]
    SPEC[Generated Spec]

    USER_INPUT --> DETECT
    DETECT --> ECOM
    DETECT --> SAAS
    DETECT --> MOBILE
    DETECT --> GENERIC
    
    ECOM --> PROMPT_BUILD
    SAAS --> PROMPT_BUILD
    MOBILE --> PROMPT_BUILD
    GENERIC --> PROMPT_BUILD
    
    PROMPT_BUILD --> LLM
    LLM --> SPEC

    classDef input fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef template fill:#f59e0b,stroke:#d97706,color:#fff
    classDef process fill:#10b981,stroke:#059669,color:#fff
    classDef output fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class USER_INPUT input
    class ECOM,SAAS,MOBILE,GENERIC template
    class DETECT,PROMPT_BUILD,LLM process
    class SPEC output
```

**Template Categories**:
- **E-commerce**: Payment, cart, inventory, shipping
- **SaaS**: Subscription, billing, user management, analytics
- **Mobile**: Offline-first, push notifications, app store compliance
- **Fintech**: Security, compliance, audit trails
- **Healthcare**: HIPAA, data privacy, patient records
- **IoT**: Device management, real-time data, edge computing

---

## 7. Web Search MCP (Phase 4)

LLM can research latest technologies during generation.

```mermaid
sequenceDiagram
    actor User
    participant LLM
    participant Search_MCP as Search MCP
    participant Google as Search API
    participant Scraper

    User->>LLM: "Create spec for<br/>modern payment system"
    LLM->>LLM: Detect need for<br/>latest trends
    LLM->>Search_MCP: Search: "2026 payment trends"
    Search_MCP->>Google: API request
    Google-->>Search_MCP: Search results
    Search_MCP->>Scraper: Extract content
    Scraper-->>Search_MCP: Structured data
    Search_MCP-->>LLM: Research findings:<br/>- AI fraud detection<br/>- Web3 wallets<br/>- Instant payments
    LLM->>LLM: Incorporate findings
    LLM-->>User: Spec with latest trends
```

---

## 8. MCP Security & Permissions

```mermaid
flowchart TD
    REQUEST[MCP Request]
    AUTH{Authenticated?}
    RATE{Rate limit OK?}
    PERM{Has permission?}
    SCOPE{Scope allowed?}
    
    EXECUTE[Execute MCP call]
    LOG[Log request]
    CACHE[Cache result]
    RETURN[Return data]
    
    ERROR_AUTH[Error: Unauthorized]
    ERROR_RATE[Error: Rate limited]
    ERROR_PERM[Error: Forbidden]
    ERROR_SCOPE[Error: Invalid scope]

    REQUEST --> AUTH
    AUTH -->|No| ERROR_AUTH
    AUTH -->|Yes| RATE
    RATE -->|No| ERROR_RATE
    RATE -->|Yes| PERM
    PERM -->|No| ERROR_PERM
    PERM -->|Yes| SCOPE
    SCOPE -->|No| ERROR_SCOPE
    SCOPE -->|Yes| EXECUTE
    EXECUTE --> LOG
    LOG --> CACHE
    CACHE --> RETURN

    classDef check fill:#f59e0b,stroke:#d97706,color:#fff
    classDef success fill:#10b981,stroke:#059669,color:#fff
    classDef error fill:#dc2626,stroke:#b91c1c,color:#fff

    class AUTH,RATE,PERM,SCOPE check
    class EXECUTE,LOG,CACHE,RETURN success
    class ERROR_AUTH,ERROR_RATE,ERROR_PERM,ERROR_SCOPE error
```

---

## MCP Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Create `backend/mcp/` folder structure
- [ ] Implement MCP client base class
- [ ] Database MCP: Read operations only
- [ ] Prompt Template MCP: Load from JSON files
- [ ] Unit tests for each MCP
- [ ] Documentation in `docs/MCP_INTEGRATION.md`

### Phase 2: Visual Tools (Week 3-6)
- [ ] Excalidraw MCP server setup
- [ ] Format converter (JSON ↔ Mermaid)
- [ ] Frontend visual editor component
- [ ] Real-time sync implementation
- [ ] Storage optimization (compression)

### Phase 3: Collaboration (Week 7-10)
- [ ] GitHub MCP OAuth flow
- [ ] Issue creation from requirements
- [ ] PR linking to specs
- [ ] Status sync webhooks
- [ ] Traceability dashboard

### Phase 4: Enhancement (Week 11+)
- [ ] Web Search MCP with rate limiting
- [ ] Slack webhook integration
- [ ] Monitoring & analytics MCP
- [ ] Performance optimization

---

**Purpose**: This document provides the technical roadmap for MCP integrations, enabling Blueprint Hub to become a best-in-class requirements platform.

**Last Updated**: March 2, 2026  
**Next Review**: April 1, 2026 (after Phase 1 completion)
