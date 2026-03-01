# Blueprint Hub - System Architecture Diagram

High-level system architecture showing all major components and their relationships.

## Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Device]
    end

    subgraph "Frontend - Next.js 16"
        NEXTJS[Next.js App Router]
        REACT[React 19 Components]
        UI[UI Layer]
        AUTH[NextAuth.js]
        PRISMA_CLIENT[Prisma Client]
    end

    subgraph "Backend - Python FastAPI"
        API[FastAPI Server]
        LLM[LLM Service]
        GEN[Spec Generator]
        CONV[Multi-turn Conversation]
        BLUEPRINT_SVC[Blueprint Service]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        CACHE[(Redis Cache)]
    end

    subgraph "External Services"
        OPENAI[OpenAI API]
        OAUTH[OAuth Providers<br/>Google, GitHub]
        MCP[MCP Servers<br/>Future Integration]
    end

    WEB --> NEXTJS
    MOBILE --> NEXTJS
    NEXTJS --> REACT
    REACT --> UI
    NEXTJS --> AUTH
    NEXTJS --> PRISMA_CLIENT
    
    PRISMA_CLIENT --> DB
    AUTH --> OAUTH
    
    UI --> API
    API --> LLM
    API --> BLUEPRINT_SVC
    API --> CONV
    LLM --> GEN
    GEN --> OPENAI
    
    BLUEPRINT_SVC --> DB
    LLM --> DB
    API --> CACHE
    
    API -.Future.-> MCP

    classDef frontend fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef backend fill:#10b981,stroke:#059669,color:#fff
    classDef data fill:#f59e0b,stroke:#d97706,color:#fff
    classDef external fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class NEXTJS,REACT,UI,AUTH,PRISMA_CLIENT frontend
    class API,LLM,GEN,CONV,BLUEPRINT_SVC backend
    class DB,CACHE data
    class OPENAI,OAUTH,MCP external
```

## Component Details

### Frontend Layer
- **Next.js App Router**: Server-side rendering, routing, API routes
- **React Components**: Reusable UI elements (Navbar, Cards, Modals)
- **NextAuth.js**: OAuth authentication (Google, GitHub)
- **Prisma Client**: Type-safe database access

### Backend Layer
- **FastAPI Server**: RESTful API endpoints
- **LLM Service**: OpenAI integration for spec generation
- **Spec Generator**: Transforms prompts → structured specifications
- **Multi-turn Conversation**: Context-aware follow-up generation
- **Blueprint Service**: CRUD operations for blueprints

### Data Layer
- **PostgreSQL**: Primary database (blueprints, users, sections)
- **Redis**: Session cache, rate limiting (future)

### External Services
- **OpenAI API**: GPT-4 for LLM generation
- **OAuth Providers**: Google + GitHub authentication
- **MCP Servers**: Future integrations (Excalidraw, GitHub, etc.)

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 16.x |
| **Frontend** | React | 19.x |
| **Frontend** | TypeScript | 5.x |
| **Backend** | Python | 3.11+ |
| **Backend** | FastAPI | 0.110+ |
| **Database** | PostgreSQL | 14+ |
| **ORM** | Prisma | 7.x |
| **Auth** | NextAuth.js | 5.x |
| **Cache** | Redis | 7.x (future) |

## Deployment

```mermaid
graph LR
    subgraph "Development"
        DEV_FE[Frontend<br/>localhost:3000]
        DEV_BE[Backend<br/>localhost:8000]
        DEV_DB[(PostgreSQL<br/>localhost:5432)]
    end

    subgraph "Production"
        VERCEL[Vercel<br/>Frontend CDN]
        RAILWAY[Railway<br/>Backend API]
        SUPABASE[(Supabase<br/>PostgreSQL)]
    end

    DEV_FE --> DEV_BE
    DEV_BE --> DEV_DB
    
    VERCEL --> RAILWAY
    RAILWAY --> SUPABASE

    classDef dev fill:#64748b,stroke:#475569,color:#fff
    classDef prod fill:#dc2626,stroke:#b91c1c,color:#fff

    class DEV_FE,DEV_BE,DEV_DB dev
    class VERCEL,RAILWAY,SUPABASE prod
```

---

**Purpose**: This diagram provides a high-level view of Blueprint Hub's architecture for developers, stakeholders, and documentation.

**Last Updated**: March 2, 2026
