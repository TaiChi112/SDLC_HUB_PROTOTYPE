# Blueprint Hub - Deployment Architecture

This document shows deployment configurations for development, staging, and production environments.

---

## 1. Development Environment (Local)

```mermaid
graph TB
    subgraph "Developer Machine"
        subgraph "Frontend (Port 3000)"
            NEXT_DEV[Next.js Dev Server<br/>Hot reload enabled]
            REACT_DEV[React DevTools]
        end

        subgraph "Backend (Port 8000)"
            FASTAPI_DEV[FastAPI uvicorn<br/>--reload flag]
            PYTHON_DEBUG[Python debugger]
        end

        subgraph "Database (Port 5432)"
            PG_LOCAL[PostgreSQL 14<br/>Local instance]
        end

        subgraph "Tools"
            PRISMA_STUDIO[Prisma Studio<br/>Port 5555]
            REDIS_LOCAL[Redis<br/>Port 6379<br/>Optional]
        end
    end

    NEXT_DEV <-->|HTTP| FASTAPI_DEV
    NEXT_DEV -->|Prisma Client| PG_LOCAL
    FASTAPI_DEV -->|SQL queries| PG_LOCAL
    NEXT_DEV -.->|View DB| PRISMA_STUDIO
    PRISMA_STUDIO -->|Read only| PG_LOCAL

    classDef frontend fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef backend fill:#10b981,stroke:#059669,color:#fff
    classDef data fill:#f59e0b,stroke:#d97706,color:#fff
    classDef tools fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class NEXT_DEV,REACT_DEV frontend
    class FASTAPI_DEV,PYTHON_DEBUG backend
    class PG_LOCAL,REDIS_LOCAL data
    class PRISMA_STUDIO tools
```

**Setup Commands**:
```bash
# Terminal 1: Frontend
cd frontend && bun run dev

# Terminal 2: Backend
cd backend && uv run python app.py

# Terminal 3: Database UI (optional)
cd frontend && bunx prisma studio
```

---

## 2. Production Environment (Recommended)

```mermaid
graph TB
    subgraph "CDN Layer"
        CLOUDFLARE[Cloudflare CDN<br/>Static assets, caching]
    end

    subgraph "Frontend - Vercel"
        VERCEL_EDGE[Vercel Edge Network]
        NEXT_PROD[Next.js Production<br/>SSR + Static]
        VERCEL_FUNCTIONS[Serverless Functions<br/>API routes]
    end

    subgraph "Backend - Railway/Fly.io"
        API_INSTANCES[FastAPI Instances<br/>Auto-scaling 2-10]
        WORKER[Background Workers<br/>Celery/ARQ]
    end

    subgraph "Database - Supabase/Neon"
        PG_PRIMARY[(PostgreSQL Primary<br/>Write operations)]
        PG_REPLICA[(PostgreSQL Replica<br/>Read operations)]
        PGBOUNCER[PgBouncer<br/>Connection pooling]
    end

    subgraph "Cache & Queue"
        REDIS_CLUSTER[Redis Cluster<br/>Upstash/Railway]
        QUEUE[Task Queue<br/>Bull/BullMQ]
    end

    subgraph "External Services"
        OPENAI_API[OpenAI API<br/>GPT-4]
        OAUTH_PROVIDERS[OAuth<br/>Google, GitHub]
        MONITORING[Monitoring<br/>Sentry, DataDog]
    end

    USERS[Users/Browsers] -->|HTTPS| CLOUDFLARE
    CLOUDFLARE --> VERCEL_EDGE
    VERCEL_EDGE --> NEXT_PROD
    NEXT_PROD --> VERCEL_FUNCTIONS
    VERCEL_FUNCTIONS -->|API calls| API_INSTANCES
    
    API_INSTANCES --> PGBOUNCER
    PGBOUNCER --> PG_PRIMARY
    PGBOUNCER --> PG_REPLICA
    
    API_INSTANCES --> REDIS_CLUSTER
    API_INSTANCES --> QUEUE
    QUEUE --> WORKER
    WORKER --> PG_PRIMARY
    
    API_INSTANCES --> OPENAI_API
    NEXT_PROD --> OAUTH_PROVIDERS
    
    API_INSTANCES -.Logs/Errors.-> MONITORING
    NEXT_PROD -.Metrics.-> MONITORING

    classDef user fill:#64748b,stroke:#475569,color:#fff
    classDef cdn fill:#06b6d4,stroke:#0891b2,color:#fff
    classDef frontend fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef backend fill:#10b981,stroke:#059669,color:#fff
    classDef data fill:#f59e0b,stroke:#d97706,color:#fff
    classDef cache fill:#ec4899,stroke:#db2777,color:#fff
    classDef external fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class USERS user
    class CLOUDFLARE cdn
    class VERCEL_EDGE,NEXT_PROD,VERCEL_FUNCTIONS frontend
    class API_INSTANCES,WORKER backend
    class PG_PRIMARY,PG_REPLICA,PGBOUNCER data
    class REDIS_CLUSTER,QUEUE cache
    class OPENAI_API,OAUTH_PROVIDERS,MONITORING external
```

---

## 3. Infrastructure as Code (Deployment)

### Vercel Deployment (Frontend)

```yaml
# vercel.json
{
  "buildCommand": "cd frontend && bun run build",
  "outputDirectory": "frontend/.next",
  "devCommand": "cd frontend && bun run dev",
  "framework": "nextjs",
  "regions": ["sfo1", "iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "OPENAI_API_KEY": "@openai_key"
  }
}
```

### Railway Deployment (Backend)

```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "uv sync"

[deploy]
startCommand = "uv run uvicorn api:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[healthchecks]]
path = "/health"
interval = 30
timeout = 10
```

### Docker Compose (Alternative)

```yaml
# docker-compose.yml
version: '3.9'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - backend
      - postgres

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=blueprint_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=blueprint_hub
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  pg_data:
  redis_data:
```

---

## 4. CI/CD Pipeline

```mermaid
flowchart LR
    subgraph "Developer"
        CODE[Write Code]
        COMMIT[Git Commit]
        PUSH[Git Push]
    end

    subgraph "GitHub Actions"
        TRIGGER[Workflow Triggered]
        LINT[Lint & Type Check]
        TEST[Run Tests]
        BUILD[Build Artifacts]
        SECURITY[Security Scan]
    end

    subgraph "Deployment"
        STAGE{Branch?}
        DEPLOY_STAGING[Deploy to Staging]
        DEPLOY_PROD[Deploy to Production]
        HEALTH[Health Check]
    end

    subgraph "Monitoring"
        METRICS[Collect Metrics]
        ALERTS[Alert on Errors]
        ROLLBACK{Errors?}
    end

    CODE --> COMMIT
    COMMIT --> PUSH
    PUSH --> TRIGGER
    TRIGGER --> LINT
    LINT --> TEST
    TEST --> BUILD
    BUILD --> SECURITY
    SECURITY --> STAGE
    
    STAGE -->|develop| DEPLOY_STAGING
    STAGE -->|main| DEPLOY_PROD
    
    DEPLOY_STAGING --> HEALTH
    DEPLOY_PROD --> HEALTH
    HEALTH --> METRICS
    METRICS --> ALERTS
    ALERTS --> ROLLBACK
    
    ROLLBACK -->|Yes| DEPLOY_PROD
    ROLLBACK -->|No| END([Done])

    classDef dev fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef ci fill:#10b981,stroke:#059669,color:#fff
    classDef deploy fill:#f59e0b,stroke:#d97706,color:#fff
    classDef monitor fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class CODE,COMMIT,PUSH dev
    class TRIGGER,LINT,TEST,BUILD,SECURITY ci
    class STAGE,DEPLOY_STAGING,DEPLOY_PROD,HEALTH deploy
    class METRICS,ALERTS,ROLLBACK monitor
```

---

## 5. Scaling Strategy

### Horizontal Scaling

```mermaid
graph TB
    LB[Load Balancer<br/>Nginx/Cloudflare]
    
    subgraph "API Instances"
        API1[FastAPI Instance 1]
        API2[FastAPI Instance 2]
        API3[FastAPI Instance 3]
        API_N[FastAPI Instance N]
    end
    
    subgraph "Database Cluster"
        PRIMARY[(Primary DB<br/>Write)]
        REPLICA1[(Replica 1<br/>Read)]
        REPLICA2[(Replica 2<br/>Read)]
    end
    
    CACHE[Redis Cluster]

    LB --> API1
    LB --> API2
    LB --> API3
    LB --> API_N
    
    API1 --> PRIMARY
    API2 --> PRIMARY
    API3 --> REPLICA1
    API_N --> REPLICA2
    
    API1 --> CACHE
    API2 --> CACHE
    API3 --> CACHE
    API_N --> CACHE

    classDef lb fill:#06b6d4,stroke:#0891b2,color:#fff
    classDef api fill:#10b981,stroke:#059669,color:#fff
    classDef db fill:#f59e0b,stroke:#d97706,color:#fff
    classDef cache fill:#ec4899,stroke:#db2777,color:#fff

    class LB lb
    class API1,API2,API3,API_N api
    class PRIMARY,REPLICA1,REPLICA2 db
    class CACHE cache
```

### Auto-scaling Rules

| Metric | Threshold | Action |
|--------|-----------|--------|
| **CPU Usage** | >70% for 5min | Scale up +1 instance |
| **Memory Usage** | >80% | Scale up +1 instance |
| **Request Queue** | >100 pending | Scale up +2 instances |
| **Error Rate** | >5% | Alert + investigate |
| **Response Time** | >2s p95 | Scale up or optimize |
| **Night Hours** | 12am-6am | Scale down to minimum |

---

## 6. Database Backup & Recovery

```mermaid
flowchart TD
    PRIMARY[(Production DB)]
    
    subgraph "Backup Strategy"
        CONTINUOUS[Continuous WAL Archive<br/>Every 5 minutes]
        DAILY[Full Daily Backup<br/>2:00 AM UTC]
        WEEKLY[Weekly Backup<br/>Sunday 2:00 AM]
    end
    
    subgraph "Storage"
        S3[AWS S3<br/>Encrypted storage]
        GLACIER[AWS Glacier<br/>Long-term archive]
    end
    
    subgraph "Recovery"
        PITR[Point-in-Time Recovery<br/>Last 30 days]
        RESTORE[Full Restore<br/>RTO: 15 minutes]
    end

    PRIMARY --> CONTINUOUS
    PRIMARY --> DAILY
    PRIMARY --> WEEKLY
    
    CONTINUOUS --> S3
    DAILY --> S3
    WEEKLY --> GLACIER
    
    S3 --> PITR
    S3 --> RESTORE
    GLACIER --> RESTORE

    classDef db fill:#f59e0b,stroke:#d97706,color:#fff
    classDef backup fill:#10b981,stroke:#059669,color:#fff
    classDef storage fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef recovery fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class PRIMARY db
    class CONTINUOUS,DAILY,WEEKLY backup
    class S3,GLACIER storage
    class PITR,RESTORE recovery
```

**Recovery Objectives**:
- **RTO** (Recovery Time Objective): 15 minutes
- **RPO** (Recovery Point Objective): 5 minutes (WAL archive)
- **Retention**: 30 days PITR, 365 days full backups

---

## 7. Monitoring & Observability

```mermaid
graph TB
    subgraph "Application"
        FRONTEND[Frontend]
        BACKEND[Backend]
        DB[(Database)]
    end

    subgraph "Metrics Collection"
        PROMETHEUS[Prometheus<br/>Time-series metrics]
        LOKI[Loki<br/>Log aggregation]
        TEMPO[Tempo<br/>Distributed tracing]
    end

    subgraph "Visualization"
        GRAFANA[Grafana Dashboards]
    end

    subgraph "Alerting"
        ALERT_MANAGER[Alert Manager]
        PAGERDUTY[PagerDuty]
        SLACK[Slack]
    end

    FRONTEND -->|Metrics| PROMETHEUS
    BACKEND -->|Metrics| PROMETHEUS
    DB -->|Metrics| PROMETHEUS
    
    FRONTEND -->|Logs| LOKI
    BACKEND -->|Logs| LOKI
    
    BACKEND -->|Traces| TEMPO
    
    PROMETHEUS --> GRAFANA
    LOKI --> GRAFANA
    TEMPO --> GRAFANA
    
    GRAFANA --> ALERT_MANAGER
    ALERT_MANAGER --> PAGERDUTY
    ALERT_MANAGER --> SLACK

    classDef app fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef collect fill:#10b981,stroke:#059669,color:#fff
    classDef viz fill:#f59e0b,stroke:#d97706,color:#fff
    classDef alert fill:#dc2626,stroke:#b91c1c,color:#fff

    class FRONTEND,BACKEND,DB app
    class PROMETHEUS,LOKI,TEMPO collect
    class GRAFANA viz
    class ALERT_MANAGER,PAGERDUTY,SLACK alert
```

---

## 8. Security Architecture

```mermaid
graph TB
    USERS[Users]
    
    subgraph "Security Layers"
        WAF[Web Application Firewall<br/>Cloudflare/AWS WAF]
        RATE_LIMITER[Rate Limiter<br/>Redis-based]
        AUTH[Authentication<br/>NextAuth + JWT]
        RBAC[Authorization<br/>Role-based access]
        ENCRYPTION[Encryption at Rest<br/>AES-256]
    end
    
    subgraph "Monitoring"
        IDS[Intrusion Detection<br/>Fail2ban]
        AUDIT[Audit Logs]
        SIEM[Security Information<br/>Event Management]
    end

    USERS --> WAF
    WAF --> RATE_LIMITER
    RATE_LIMITER --> AUTH
    AUTH --> RBAC
    RBAC --> ENCRYPTION
    
    WAF -.-> IDS
    AUTH -.-> AUDIT
    AUDIT -.-> SIEM

    classDef user fill:#64748b,stroke:#475569,color:#fff
    classDef security fill:#dc2626,stroke:#b91c1c,color:#fff
    classDef monitor fill:#f59e0b,stroke:#d97706,color:#fff

    class USERS user
    class WAF,RATE_LIMITER,AUTH,RBAC,ENCRYPTION security
    class IDS,AUDIT,SIEM monitor
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (frontend + backend)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] Monitoring dashboards set up
- [ ] Backup strategy tested

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Check health endpoints
- [ ] Verify database connections
- [ ] Test OAuth flows
- [ ] Load test (optional)
- [ ] Deploy to production
- [ ] Monitor metrics for 15 minutes

### Post-Deployment
- [ ] Verify all features working
- [ ] Check error rates
- [ ] Review logs for anomalies
- [ ] Update status page
- [ ] Notify team
- [ ] Document any issues

---

**Purpose**: This document provides deployment strategies for running Blueprint Hub reliably in production.

**Last Updated**: March 2, 2026
