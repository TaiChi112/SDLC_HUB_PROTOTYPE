# Blueprint Hub - Data Flow Diagrams

This document shows how data flows through the system for key user operations.

---

## 1. Specification Generation Flow

Shows the complete flow from user prompt → LLM generation → saving to database.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Backend API
    participant LLM as LLM Service
    participant OpenAI as OpenAI API
    participant DB as PostgreSQL

    User->>UI: Enter prompt & click Generate
    UI->>API: POST /api/generate<br/>{blueprint_id, prompt}
    
    API->>DB: Fetch blueprint context
    DB-->>API: Blueprint data
    
    API->>LLM: Generate with context
    LLM->>OpenAI: GPT-4 API call<br/>(prompt + template)
    OpenAI-->>LLM: Generated sections
    
    LLM->>API: Structured spec data
    API->>DB: Save generated sections
    DB-->>API: Confirmation
    
    API-->>UI: Generated spec JSON
    UI->>User: Display in editor<br/>with sections
    
    Note over User,DB: Total time: 3-8 seconds
```

---

## 2. User Authentication Flow

OAuth authentication using NextAuth.js with Google/GitHub.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant NextAuth as NextAuth.js
    participant OAuth as OAuth Provider<br/>(Google/GitHub)
    participant DB as PostgreSQL

    User->>UI: Click "Sign in with Google"
    UI->>NextAuth: signIn("google")
    NextAuth->>OAuth: Redirect to OAuth consent
    User->>OAuth: Approve permissions
    OAuth-->>NextAuth: Auth code + tokens
    
    NextAuth->>DB: Check if user exists
    alt User exists
        DB-->>NextAuth: User record
    else New user
        NextAuth->>DB: Create user<br/>(email, name, avatar)
        DB-->>NextAuth: New user record
    end
    
    NextAuth->>NextAuth: Create session
    NextAuth-->>UI: Redirect with session cookie
    UI->>User: Show authenticated UI
    
    Note over User,DB: Session valid for 30 days
```

---

## 3. Blueprint Save/Update Flow

Creating or editing a blueprint with sections.

```mermaid
flowchart TD
    START([User edits blueprint])
    CHECK{Changes detected?}
    DEBOUNCE[Debounce 2 seconds]
    VALIDATE{Validation OK?}
    API[POST /api/blueprints/:id]
    PRISMA[Prisma ORM]
    DB[(PostgreSQL)]
    SUCCESS[Update UI: Saved ✓]
    ERROR[Show error toast]
    
    START --> CHECK
    CHECK -->|Yes| DEBOUNCE
    CHECK -->|No| START
    DEBOUNCE --> VALIDATE
    VALIDATE -->|Pass| API
    VALIDATE -->|Fail| ERROR
    API --> PRISMA
    PRISMA --> DB
    DB --> SUCCESS
    ERROR --> START
    SUCCESS --> START

    classDef userAction fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef process fill:#10b981,stroke:#059669,color:#fff
    classDef storage fill:#f59e0b,stroke:#d97706,color:#fff
    classDef result fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class START userAction
    class CHECK,DEBOUNCE,VALIDATE,API,PRISMA process
    class DB storage
    class SUCCESS,ERROR result
```

---

## 4. Multi-turn Conversation Flow

Conversational spec generation with follow-up questions.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API
    participant LLM as LLM Service
    participant DB as Conversation Store

    User->>UI: Initial prompt:<br/>"Create e-commerce checkout"
    UI->>API: POST /api/generate/multi-turn<br/>{prompt, conversation: []}
    
    API->>LLM: Analyze prompt
    LLM->>LLM: Detect missing info
    LLM-->>API: Question: "Payment methods?"
    API->>DB: Store conversation state
    API-->>UI: {status: "waiting", question: "..."}
    
    UI->>User: Show AI question
    User->>UI: Answer: "Stripe + PayPal"
    UI->>API: POST /api/generate/multi-turn<br/>{answer, conversation_id}
    
    API->>DB: Fetch conversation
    API->>LLM: Continue with answer
    LLM->>LLM: More questions?
    
    alt Needs more info
        LLM-->>API: Another question
        API-->>UI: Show question
    else Ready to generate
        LLM->>LLM: Generate full spec
        LLM-->>API: Complete spec
        API->>DB: Save blueprint
        API-->>UI: {status: "complete", spec: {...}}
        UI->>User: Show generated spec
    end
    
    Note over User,DB: Avg 2-4 turns to complete spec
```

---

## 5. Publish & View Flow

Publishing a blueprint for public/team viewing.

```mermaid
flowchart LR
    subgraph "Author Actions"
        EDIT[Edit blueprint]
        REVIEW[Review content]
        PUBLISH[Click Publish]
    end

    subgraph "Backend"
        API[API: PATCH /blueprints/:id]
        DB[(Database)]
    end

    subgraph "Public View"
        HOMEPAGE[Homepage feed]
        DETAIL[Blueprint detail page]
        SEARCH[Search results]
    end

    EDIT --> REVIEW
    REVIEW --> PUBLISH
    PUBLISH --> API
    API --> DB
    DB -->|isPublished: true| HOMEPAGE
    DB --> DETAIL
    DB --> SEARCH

    classDef author fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef backend fill:#10b981,stroke:#059669,color:#fff
    classDef public fill:#f59e0b,stroke:#d97706,color:#fff

    class EDIT,REVIEW,PUBLISH author
    class API,DB backend
    class HOMEPAGE,DETAIL,SEARCH public
```

---

## 6. Database Operations Flow

How Prisma ORM handles database operations.

```mermaid
flowchart TD
    API[API Request]
    PRISMA[Prisma Client]
    SCHEMA[Prisma Schema]
    MIGRATE[Migrations]
    PG[(PostgreSQL)]
    CACHE{Query cached?}
    RESULT[Return result]

    API --> PRISMA
    PRISMA --> CACHE
    CACHE -->|Yes| RESULT
    CACHE -->|No| PG
    PG --> RESULT
    
    SCHEMA -.defines.-> PRISMA
    MIGRATE -.updates.-> PG

    classDef code fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef db fill:#f59e0b,stroke:#d97706,color:#fff

    class API,PRISMA,SCHEMA,MIGRATE code
    class PG db
```

---

## Data Model Summary

```mermaid
erDiagram
    USER ||--o{ BLUEPRINT : creates
    BLUEPRINT ||--o{ SECTION : contains
    USER {
        string id PK
        string email
        string name
        string avatar
        datetime createdAt
    }
    BLUEPRINT {
        string id PK
        string authorId FK
        string title
        string description
        string version
        boolean isPublished
        datetime createdAt
        datetime updatedAt
    }
    SECTION {
        string id PK
        string blueprintId FK
        string name
        string content
        string type
        int order
        datetime createdAt
    }
```

---

**Purpose**: These diagrams explain data flows for developers and stakeholders to understand system behavior.

**Last Updated**: March 2, 2026
