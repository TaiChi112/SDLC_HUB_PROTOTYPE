# 📊 Blueprint Hub - Operations Guide & Runbook

**Version:** 1.0 (Q3 2026 Production)  
**Date:** March 2, 2026  
**Target:** Production Operations (DevOps + On-Call Engineers)

---

## 1. Overview

### 1.1 Purpose
Comprehensive operational runbook governing day-to-day production management of Blueprint Hub platform including monitoring, incident response, backup/restore procedures, scaling strategies, and troubleshooting workflows.

### 1.2 Scope
- **In:** Production environment monitoring, incident protocols, backup strategies, scaling procedures, operational troubleshooting
- **Out:** Development environment ops, pre-production staging, architectural redesigns
- **Audience:** DevOps engineers, On-Call operators, SRE team, platform reliability

### 1.3 Key Responsibilities
- **DevOps Lead:** Overall operations strategy, infrastructure decisions, team coordination
- **On-Call Engineer:** Immediate incident response, monitoring alerts, escalation
- **SRE Lead:** Reliability metrics, capacity planning, automation improvements
- **Backend Lead:** Application-level debugging, performance optimization

### 1.4 Success Criteria
- ✅ 99.5%+ uptime (max 3.6 hours downtime/month)
- ✅ <5 min Mean Time to Detect (MTTD)
- ✅ <15 min Mean Time to Resolution (MTTR)
- ✅ 100% data backup success rate (daily)
- ✅ Zero unplanned data loss events

---

## 2. Architecture Overview

### 2.1 Production Environment
```
┌─────────────────────────────────────────────┐
│  Vercel Edge Network (Frontend CDN)         │
│  ↓                                          │
├─────────────────────────────────────────────┤
│  Vercel (Next.js Frontend - Auto-scaling)   │
│  └─→ Environment: Production                │
└─────────────────────────────┬───────────────┘
                              ↓
                    [Load Balancer]
                              ↓
┌─────────────────────────────────────────────┐
│  Railway (FastAPI Backend - 2 instances)    │
│  ├─ Instance 1 (Primary)                    │
│  └─ Instance 2 (Failover)                   │
│  └─→ No. Replicas: Auto-scale (min:2, max:5)|
└─────────────────────────────┬───────────────┘
                              ↓
┌─────────────────────────────────────────────┐
│  Supabase (PostgreSQL Managed)              │
│  ├─ Region: us-east-1                       │
│  ├─ Replicas: Automated (Multi-AZ)          │
│  ├─ Backups: Daily full + WAL streaming     │
│  └─ Connection pooling: PgBouncer (100 conn)|
└─────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────┐
│  Monitoring & Observability                 │
│  ├─ Metrics: Prometheus + Grafana           │
│  ├─ Logs: ELK Stack (Elasticsearch)         │
│  ├─ APM: New Relic / DataDog (planned)      │
│  └─ Alerts: PagerDuty + Slack               │
└─────────────────────────────────────────────┘
```

### 2.2 Data Storage Architecture
- **Application DB:** Supabase PostgreSQL (Primary)
- **Cache Layer:** Redis (planned Q3)
- **Backup Storage:** AWS S3 (daily snapshots)
- **WAL Shipping:** Continuous archival to S3

### 2.3 Reliability Features
- **Failover:** Automatic backend instance failover (<30sec)
- **DNS Failover:** Vercel + Railway auto-DNS recovery
- **Connection Pooling:** PgBouncer limits connection storm
- **Rate Limiting:** API rate limiting (100 req/min per user)
- **Circuit Breaker:** LLM API failures don't crash system

---

## 3. Monitoring & Observability

### 3.1 Key Metrics & SLOs

**Frontend (Vercel):**
| Metric | Slo | Alert Threshold | Check Frequency |
|--------|-----|-----------------|-----------------|
| Page Load Time (P95) | <2 sec | >3 sec | Real-time |
| Error Rate | <0.5% | >1% | 1 min |
| CDN Cache Hit Rate | >85% | <80% | 5 min |
| Uptime | 99.9% | <99.5% | Continuous |

**Backend (Railway):**
| Metric | SLO | Alert Threshold | Check Frequency |
|--------|-----|-----------------|-----------------|
| API Response Time (P95) | <200ms | >300ms | Real-time |
| Error Rate | <0.2% | >0.5% | 1 min |
| CPU Usage | <70% | >85% | 30 sec |
| Memory Usage | <75% | >85% | 30 sec |
| Request Queue Depth | <10 | >50 | 30 sec |

**Database (Supabase):**
| Metric | SLO | Alert Threshold | Check Frequency |
|--------|-----|-----------------|-----------------|
| Query Response Time (P95) | <100ms | >200ms | Real-time |
| Connection Count | <80 | >95 | 1 min |
| Slow Query Rate | <1% | >5% | 5 min |
| Backup Status | 100% success | Any failure | 10 min |
| Replication Lag | <1 sec | >5 sec | Real-time |

### 3.2 Monitoring Stack Setup

**Prometheus (Metrics Collection)**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend1:9090', 'backend2:9090']
    
  - job_name: 'database'
    static_configs:
      - targets: ['supabase-metrics:9187']
    
  - job_name: 'vercel'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['vercel-api.local']
```

**Grafana Dashboards**
1. **System Health Dashboard**
   - CPU, Memory, Disk usage across all services
   - Request rates and latencies
   - Error rates per service

2. **Database Performance Dashboard**
   - Query response times
   - Connection pool utilization
   - Replication lag
   - Backup status

3. **Application Metrics Dashboard**
   - User sessions active
   - Spec generation success rate
   - LLM API response times
   - Feature usage patterns

4. **Alert Status Dashboard**
   - Active alerts with severity
   - Alert history (last 24 hours)
   - Average MTTD/MTTR metrics

### 3.3 Log Aggregation (ELK Stack)

**Log Sources:**
- Frontend: Vercel request logs + error logs
- Backend: FastAPI application logs + access logs
- Database: PostgreSQL logs + slow query logs
- System: Infrastructure logs (Railway, Supabase)

**Log Retention:**
- Error logs: 30 days (searchable)
- Info logs: 14 days (searchable)
- Debug logs: 7 days (archived)
- Audit logs: 90 days (compliance)

**Key Searches:**
```
# Authentication failures (last 24h)
index=blueprint-prod level=ERROR auth_failed=true

# Slow queries (>1 second)
index=blueprint-prod service=database duration_ms>1000

# LLM API timeouts
index=blueprint-prod service=backend "LLM timeout"

# Database connection pool exhaustion
index=blueprint-prod event="pool_exhausted"
```

### 3.4 Alert Configuration

**Critical Alerts (PagerDuty):**
- Backend instance down (MTTD: <1 min)
- Database unavailable (MTTD: <1 min)
- Data replication lag >10 sec (MTTD: <2 min)
- Disk usage >90% (MTTD: <5 min)

**High Alerts (Slack):**
- API response time (P95) >300ms (MTTD: <5 min)
- Error rate >0.5% (MTTD: <5 min)
- CPU usage >85% (MTTD: <5 min)
- Backup failure (MTTD: <10 min)

**Medium Alerts (Email):**
- Page load time >3 sec (MTTD: <15 min)
- Warning log spikes
- Unusual pattern detection

---

## 4. Incident Response Protocol

### 4.1 Incident Classification

**Severity Levels:**
- 🔴 **SEV-1 (Critical):** Total service outage, data loss imminent, all users affected
  - MTTD: <2 min | MTTR SLO: <15 min
  - Escalation: CTO + VP Engineering + All DevOps

- 🟠 **SEV-2 (High):** Partial service degradation, significant user impact (>10%)
  - MTTD: <5 min | MTTR SLO: <30 min
  - Escalation: DevOps Lead + Engineering Manager

- 🟡 **SEV-3 (Medium):** Minor degradation, few users affected (<10%)
  - MTTD: <15 min | MTTR SLO: <1 hour
  - Escalation: On-Call Engineer

- 🟢 **SEV-4 (Low):** Cosmetic/edge case issues, no user impact
  - MTTD: <1 hour | MTTR SLO: Next business day
  - Escalation: Issue tracking system

### 4.2 Incident Response Checklist

**IMMEDIATE ACTIONS (0-5 min):**
- [ ] On-Call Engineer acknowledges alert
- [ ] Verify incident severity (customer impact assessment)
- [ ] Create incident ticket (ticket ID for tracking)
- [ ] Declare SEV level (SEV-1/2/3/4)
- [ ] If SEV-1: Initiate war room (Slack #incident-response channel)
- [ ] Post status update in Slack (what we know so far)
- [ ] Start timeline documentation (Google Doc / incident tool)
- [ ] Check if on-call escalation needed

**INVESTIGATION PHASE (5-20 min):**
1. **Symptom Investigation**
   - Check monitoring dashboards (Grafana)
   - Review error logs (ELK Stack)
   - Verify customer reports match telemetry
   - Identify service component (Frontend/Backend/DB)

2. **Root Cause Analysis**
   - Check recent deployments (Vercel / Railway)
   - Look for config changes
   - Verify external dependency status (OpenAI API, etc.)
   - Check resource saturation (CPU, Memory, Connections)
   - Review database connection pool status

3. **Decision TreeInfrastructure Issue:**
   ```
   Infrastructure Down? →  
   ├─ Vercel down? → Check Vercel status page + escalate to Support
   ├─ Railway down? → Check Railway status page + failover instance
   └─ Supabase down? → Use backup instance / restore from backup
   ```

   **Application Issue:**
   ```
   Application Error? →
   ├─ Recent deployment? → Rollback (if <30 min)
   ├─ Memory leak? → Restart instances + investigate code
   └─ Third-party API? → Implement fallback + notify team
   ```

   **Database Issue:**
   ```
   Database Issue? →
   ├─ Connection pool exhausted? → Restart connection pooler + investigate
   ├─ Replication lag? → Check backup instance + slow queries
   ├─ Disk full? → Cleanup old logs/backups
   └─ Corruption? → Restore from backup + check integrity
   ```

### 4.3 Resolution & Recovery

**For Backend/Database Issues:**
1. **Immediate Mitigation (Fail-Fast):**
   ```bash
   # Restart affected Railway instance
   railway restart production-backend-1
   
   # Check database connection pool
   psql -h [DB_HOST] -c "SELECT count(*) FROM pg_stat_activity;"
   
   # If pool exhausted, restart pooler
   railway restart production-pgbouncer
   ```

2. **Rollback (If Recent Deployment):**
   ```bash
   # Check recent deployments (last 1 hour)
   railway logs --service backend --since 1h
   
   # If suspicious deploy within last 30 min, rollback
   vercel rollback  # Frontend
   railway rollback --service backend  # Backend
   ```

3. **Failover (If Primary Down):**
   ```bash
   # For backend, Railway auto-fails to Instance 2
   # For database, connect to read replica
   # Force DNS to secondary IP if needed
   ```

### 4.4 Post-Incident Procedures

**While Recovering (Recovery Verification - 0-10 min after recovery):**
- [ ] Verify all services healthy (dashboards showing green)
- [ ] Run smoke test suite (critical workflows)
- [ ] Check no data loss (validate backups)
- [ ] Monitor for 5-10 min for stability (no repeat failures)
- [ ] Confirm user reports resolving
- [ ] Post all-clear message in Slack

**After Resolution (Stabilization - 1-2 hours after MTTR):**
- [ ] Collect incident logs + metrics files
- [ ] Schedule post-mortem (within 48 hours for SEV-1/2)
- [ ] Document root cause
- [ ] List action items (preventive measures)
- [ ] Update runbook if procedure gaps discovered

**Post-Mortem (Within 48 hours):**
- Timeline of events (minute-by-minute)
- Root cause analysis (why it happened)
- What went well / what didn't
- Action items (prevent recurrence)
- Assignment + due dates
- Share findings with team

### 4.5 On-Call Escalation Matrix

| Situation | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| **SEV-1 (Critical)** | On-Cal Engineer (15 min) | DevOps Lead | CTO |
| **SEV-2 (High)** | On-Call Engineer (30 min) | DevOps Lead (if >30 min) | - |
| **SEV-3 (Medium)** | On-Call Engineer (1 hour) | - | - |
| **SEV-4 (Low)** | On-Call Engineer (next business day) | - | - |

---

## 5. Backup & Disaster Recovery

### 5.1 Backup Strategy

**Database Backups:**
- **Frequency:** Daily full backup (2 AM UTC) + continuous WAL archival
- **Retention:** 30 days full backups, 90 days WAL
- **Storage:** AWS S3 (us-east-1 region)
- **Backup Job:** Automated via Supabase backup service
- **Verification:** Automated backup validation (restore test weekly)

**Application Backups:**
- **Frontend:** Vercel deployment history (last 10 versions kept)
- **Backend:** Railway deployment history (auto-retained)
- **Configuration:** Backup all environment variables (encrypted, S3)

**Backup Verification Checklist:**
```
Weekly Backup Test (Every Monday 3 AM UTC):
- [ ] Restore full backup to staging database
- [ ] Run integrity check (row counts, FK constraints)
- [ ] Test application connectivity to restored DB
- [ ] Verify no missing tables/columns
- [ ] Document restore time for RPO/RTO planning
- [ ] Email report to DevOps team
```

### 5.2 Recovery Time Objectives (RTO/RPO)

| Component | RTO (Recovery Time) | RPO (Data Loss) |
|-----------|-------------------|-----------------|
| **Frontend (Vercel)** | <5 min (rollback) | <1 min (redeploy) |
| **Backend (Railway)** | <15 min (restart+scale) | <1 hour (code loss) |
| **Database (Supabase)** | <30 min (restore backup) | <15 min (WAL available) |
| **All Services** | <1 hour (full disaster recovery) | <24 hours (daily backup) |

### 5.3 Disaster Recovery Procedures

**Scenario 1: Database Corruption**
```bash
Step 1: Verify corruption
  SELECT pg_sleep(30);  # Check if locks clear
  
Step 2: If persists, stop applications
  railway stop production-backend
  
Step 3: Restore from last good backup
  # Supabase: Select backup date → 1-click restore
  # Time: 10-20 minutes
  
Step 4: Verify integrity
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM blueprints;
  
Step 5: Restart applications
  railway start production-backend
  
Step 6: Monitor for 30 min
  watch -n5 'psql -c "SELECT * FROM pg_stat_replication;"'
```

**Scenario 2: Regional Outage (whole region down)**
```bash
Step 1: Detect via multiple monitoring sources
Step 2: Activate business continuity plan
Step 3: Fail over to backup region
  - Supabase: Switch to secondary region (multi-AZ)
  - Railway: Deploy to secondary region
  - Vercel: Already multi-region by default
Step 4: Point DNS to backup region
Step 5: Restore from backup if needed
Step 6: Validate functionality
Estimated Time: 30-45 minutes
```

**Scenario 3: Ransomware/Data Deletion**
```bash
Step 1: Isolate databases (stop replication, deny connections)
Step 2: Restore from immutable backup (S3 snapshot)
Step 3: Verify backup integrity (no malware signatures)
Step 4: Full environment reset
Step 5: Security audit + patch
Estimated Time: 2-4 hours
```

---

## 6. Scaling Procedures

### 6.1 Capacity Planning

**Current Limits (Q3 2026 Launch):**
- Concurrent Users: 1,000+
- Requests per Second: 100 RPS
- Database Connections: 100 (PgBouncer pooled)
- Storage: 100 GB initial

**Monitoring for Scale Points:**
- Backend CPU >80% for 5 min → Scale up
- Memory >85% for 5 min → Investigate + scale
- Database connections >80 → Analyze + increase pool
- API latency (P95) >300ms → Check query performance

### 6.2 Horizontal Scaling (Backend)

**Railway Auto-Scaling Configuration:**
```yaml
# railway.yml
services:
  backend:
    instances:
      min: 2          # Always 2 instances
      max: 5          # Max 5 instances
      scale_up_threshold: 75    # CPU/Memory >75%
      scale_down_threshold: 30  # CPU/Memory <30%
      cooldown: 300   # 5 min between scale events
```

**Manual Scaling Steps:**
```bash
# Check current instances
railway services --list

# Scale to N instances
railway update backend --replicas 3

# Monitor scaling progress
railway logs --service backend --follow
watch -n5 'railway metrics backend'

# Verify load balanced
curl -s https://api.blueprinthub.com/health | jq '.instance_id'  # Run 5x
```

### 6.3 Vertical Scaling (Database)

**Supabase Database Sizing:**
```
Current: Small (2GB RAM, 0.25 vCPU)
         Max 1,000 connections

Target: Medium (4GB RAM, 0.5 vCPU) at 70% capacity
        Max 2,000 connections

Scaling Strategy:
- Monitor connection pool
- Upgrade 1-2 weeks before hitting limit
- Supabase: 1-click upgrade (no downtime)
- Testing: Staging env first, production second
```

**Connection Pool Optimization:**
```
PgBouncer Config:
default_pool_size = 25     # Connections per server
min_pool_size = 5
max_pool_size = 100
reserve_pool_size = 5

Tuning:
- Monitor "Connection timeout" errors
- If high, increase max_pool_size
- Profile slow queries (enable pg_stat_statements)
- Add indexes for frequently slow queries
```

### 6.4 Content Delivery Scaling (CDN)

**Vercel Edge Network:**
- Automatically scales globally
- No manual action needed
- Cache-hit ratio target: >85%
- Monitor: Vercel dashboard → Analytics

**Cache Strategy:**
```
Static Assets (images, JS, CSS):
  - TTL: 1 year (immutable content hash)
  
API Responses (Blueprints list):
  - TTL: 5 min (revalidate often)
  
HTML Pages:
  - TTL: 30 sec (ISR - incremental static regeneration)
```

---

## 7. Troubleshooting Guide

### 7.1 Common Issues & Solutions

**Issue 1: High API Response Time (P95 >300ms)**

```
Root Causes:
1. Slow database queries
2. LLM API timeouts
3. Backend resource exhaustion
4. Connection pool exhaustion

Diagnosis:
  Step 1: Check backend CPU/Memory (Grafana dashboard)
  Step 2: Check database query times (ELK logs)
  Step 3: Check LLM API status (external service status)
  Step 4: Count active connections (psql -c "SELECT * FROM pg_stat_activity;")

Solutions:
  If backend CPU high:
    → Scale up instances (see Section 6)
  
  If queries slow:
    → Check EXPLAIN ANALYZE slow_query.sql
    → Add missing indexes: CREATE INDEX idx_name ON table(col);
    → Kill long-running query: SELECT pg_terminate_backend(pid);
  
  If LLM timeout:
    → Check openai.com API status
    → Increase timeout threshold (currently 30s)
    → Implement retry logic (3 attempts, exponential backoff)
  
  If connection pool exhausted:
    → Increase pool size (railway update)
    → Kill idle connections: SELECT * FROM pg_stat_activity WHERE state='idle';
    → Investigate connection leaks in code
```

**Issue 2: Database Replication Lag >10 seconds**

```
Symptoms: Data inconsistency between primary/replica

Root Causes:
1. Slow network link
2. Heavy write load
3. Replication catching up

Diagnosis:
  psql -h [REPLICA_HOST] -c "SELECT slot_name, restart_lsn, confirmed_flush_lsn FROM pg_replication_slots;"
  psql -h [PRIMARY_HOST] -c "SELECT pg_current_wal_lsn();"

Solutions:
  If lag <30 sec (transient):
    → It's normal, monitor for persistence
  
  If lag >30 sec (sustained):
    → Check network: ping -c 10 [REPLICA_HOST]
    → Check replica load: top -b -n 1 on replica
    → Increase replica resources (vertical scale)
  
  Emergency (lag >5 min):
    → Re-sync replica: pg_basebackup
    → Take 10-15 min downtime for safety
```

**Issue 3: Out of Disk Space**

```
Symptoms: Deployment fails, database stops accepting writes

Diagnosis:
  railway exec backend -- df -h
  railway exec database -- du -sh /data

Root Causes:
1. Old logs accumulating
2. Large attachments stored locally
3. Database growth

Solutions:
  Immediate:
    Step 1: Stop accepting writes temporarily
    Step 2: Cleanup old logs: find /logs -mtime +30 -delete
    Step 3: Archive old backups: aws s3 sync /backup s3://backup-archive/
    Step 4: Restart if needed
  
  Long-term:
    → Implement log rotation (30-day retention)
    → Move attachments to S3
    → Archive old data quarterly
    → Monitor disk growth trend
```

**Issue 4: High Error Rate (>1%)**

```
Symptoms: Monitoring alert for error rate spike

Diagnosis:
  ELK: index=blueprint-prod level=ERROR | stats count() by error_message
  Sample logs: Check last 100 errors

Root Causes:
1. Service upstream (LLM) failure
2. Invalid input (user error)
3. Recent code deployment
4. Resource exhaustion

Solutions:
  If timeout errors:
    → Increase timeout threshold
    → Check if LLM is slow
  
  If validation errors:
    → Log invalid input example
    → Create user alert/guide
  
  If deployment-related:
    → Check deployment logs
    → Rollback if >30 min old
  
  If resource shortage:
    → Scale up instances
    → Optimize code
```

### 7.2 Debugging Commands

**Check Service Health:**
```bash
# Frontend status
curl -I https://blueprinthub.com

# Backend health endpoint
curl https://api.blueprinthub.com/health | jq .

# Database connectivity
psql postgresql://user:pass@host/blueprint -c "SELECT version();"

# Redis connectivity (future)
redis-cli -h redis.railway.internal ping

# LLM API status
curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_KEY"
```

**Database Inspection:**
```bash
# Top processes
SELECT pid, usename, state, query FROM pg_stat_activity ORDER BY query_start;

# Slow queries (requires pg_stat_statements)
SELECT query, calls, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC;

# Index bloat
SELECT schemaname, tablename, round(100*(pg_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename,'main')) / pg_relation_size(schemaname||'.'||tablename), 2) AS bloat_pct
FROM pg_tables ORDER BY bloat_pct DESC;

# Replication status
SELECT slot_name, restart_lsn, confirmed_flush_lsn FROM pg_replication_slots;
```

**Log Tail (Follow Real-Time):**
```bash
# Backend logs
railway logs --service backend --follow

# Database logs
railway logs --service database --follow

# ELK query (last 20 errors)
curl -X GET "elasticsearch:9200/logs-*/_search?q=level:ERROR&size=20&sort=timestamp:desc"
```

---

## 8. Operational Procedures & Maintenance

### 8.1 Regular Maintenance Schedule

**Weekly (Every Monday 3 AM UTC):**
- [ ] Backup verification test (restore to staging, validate)
- [ ] Database maintenance routine (VACUUM ANALYZE)
- [ ] Review monitoring alerts (false positives?)
- [ ] Check for pending security updates
- [ ] Verify all health checks passing

**Monthly (First Monday of month):**
- [ ] Capacity planning review (trends, forecasts)
- [ ] Performance tuning review (slow queries, indexes)
- [ ] Security audit (access logs, failed auth attempts)
- [ ] Documentation update (runbook, operational changes)
- [ ] Team retrospective (incidents, improvements)

**Quarterly (Every 3 months):**
- [ ] Load testing (validate SLOs with 2x expected load)
- [ ] Disaster recovery drill (dry run failover)
- [ ] Dependency audit (library updates, security patches)
- [ ] Architecture review (scaling needs, tech changes)
- [ ] SLO breach analysis (if any)

### 8.2 Dependency Monitoring

**Critical Dependencies:**
| Service | Status Page | Escalation | Notes |
|---------|-------------|------------|-------|
| Vercel | https://www.vercel-status.com | Vercel Support | Global CDN, auto-failover |
| Railway | https://status.railway.app | Railway Support | Check frequently |
| Supabase | https://supabase.io/status | Supabase Support | Multi-region failover ready |
| OpenAI API | https://status.openai.com | OpenAI Support | Non-critical (fallback text) |
| GitHub MCP | GitHub Status | GitHub Support | Planned Q2 2026 |

**Monitoring External APIs:**
```
Uptime Monitoring (StatusCake/Pingdom):
- Vercel: /health endpoint every 30 sec
- Railway backend: /health endpoint every 1 min
- Supabase: pg connection test every 5 min
- OpenAI: /models endpoint every 5 min (optional)

Alerts if:
- 3 consecutive failures for Vercel/Railway (SEV-1)
- 2 consecutive failures for database (SEV-1)
- LLM timeout >60 sec (downgrade to text mode)
```

### 8.3 Security & Compliance

**Monthly Security Review:**
- [ ] Check access logs for suspicious activity
- [ ] Review failed login attempts (brute force?)
- [ ] Audit user permissions (least privilege)
- [ ] Verify secrets rotation (every 90 days)
- [ ] Database encryption status (TLS in-transit)

**Quarterly Security Audit:**
- [ ] Penetration testing (external contractor)
- [ ] Dependency vulnerability scan (npm audit, pip audit)
- [ ] Code review for security issues
- [ ] Compliance check (GDPR, SOC 2 if applicable)

---

## 9. On-Call Handover & Knowledge Transfer

### 9.1 On-Call Setup

**Before Starting On-Call (Preparation):**
1. Review this runbook (cover-to-cover)
2. Request access to all monitoring tools (Grafana, ELK)
3. Get Slack alerts configured (background notifications)
4. Test PagerDuty setup (do you receive alerts?)
5. Know escalation contacts (DevOps Lead, CTO numbers)
6. Review recent incidents (last 3 post-mortems)

**On-Call Duration:**
- Shift: 1 week (Monday 9 AM → Monday 9 AM)
- Coverage: 24/7 (expects response <15 min for SEV-1)
- Handover: 30-min overlap with previous on-call engineer

### 9.2 Escalation Contacts

```
On-Call Engineer: [Your Name] [Phone] [Slack]
DevOps Lead: [Name] [Phone] [Slack]
Engineering Manager: [Name] [Phone] [Slack]
CTO: [Name] [Phone] [Email]
CEO: [Name] [Phone] [Email]  # For critical PR

Escalation Path (SEV-1):
Minute 0: On-Call Engineer responds
Minute 5: Page DevOps Lead
Minute 15: Page Engineering Manager + CTO
Minute 30: Conference call with full team
```

### 9.3 Knowledge Base for On-Call

**Key Information Checklist:**
- [ ] How to access production dashboards?
- [ ] How to SSH into backend instance?
- [ ] How to connect to database?
- [ ] How to check logs (ELK query)?
- [ ] What's a "normal" error rate?
- [ ] What metrics to watch?
- [ ] How to do emergency rollback?
- [ ] Where are credentials stored (1Pass)?

---

## 10. References & Appendix

### 10.1 Related Documents
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Deployment procedures
- [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) - Testing quality assurance
- [docs/FEATURE_ROADMAP.md](docs/FEATURE_ROADMAP.md) - Feature timelines
- [SDLC.md](SDLC.md) - Overall SDLC documentation

### 10.2 Tool References
- **Grafana:** https://monitoring.blueprinthub.internal (dashboards)
- **ELK Stack:** https://logs.blueprinthub.internal (log search)
- **PagerDuty:** https://blueprinthub.pagerduty.com (incidents)
- **Slack:** #incident-response channel
- **Railway:** https://dashboard.railway.app (backend deployment)
- **Vercel:** https://vercel.com/dashboard (frontend deployment)
- **Supabase:** https://app.supabase.io (database)

### 10.3 Emergency Contact Tree

```
SEV-1 INCIDENT (Total Outage):

Minute 0: Acknowledge alert
  ↓
Minute 2: Declare SEV-1 + Start war room
  ↓
Minute 5: Page DevOps Lead
  ↓
Minute 15: Page CTO + Engineering Manager
  ↓
Minute 30: Conference call (all hands if needed)
  ↓
Minute 45: CEO notification (if unresolved)
```

### 10.4 Common Command Cheat Sheet

```bash
# Check service status
railway status

# Tail logs
railway logs --follow

# Restart service
railway restart [service]

# SSH into instance
railway shell [service]

# Deploy from this commit
railway deploy [commit-hash]

# Rollback to previous
railway rollback

# Database access
psql postgresql://user:pass@host:5432/blueprint

# Check connections
SELECT COUNT(*) FROM pg_stat_activity;

# Kill hung query
SELECT pg_terminate_backend([pid]);

# Database vacuum
VACUUM ANALYZE;
```

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Owner:** DevOps Lead  
**Review Cycle:** Every 2 weeks (operational updates), Quarterly (full review)  
**Next Review Date:** March 16, 2026
