# 🐳 Docker Deployment Guide

## 📖 ภาพรวม

Guide นี้อธิบายวิธี deploy Calendar Agent ด้วย Docker & docker-compose ให้คุณ

ระบบสามารถ run ได้ 3 แบบ:
- **Development**: Flask Web UI + Mock Calendar (ง่ายที่สุด)
- **Production**: All services + PostgreSQL + Nginx reverse proxy
- **Advanced**: MCP Server + Database

---

## ✅ Prerequisites

```bash
# ตรวจสอบ Docker ติดตั้งแล้ว
docker --version      # ต้อง >= 20.10
docker-compose --version  # ต้อง >= 1.29

# ถ้ายังไม่มี ดาวน์โหลด Docker Desktop จาก https://www.docker.com/products/docker-desktop
```

---

## 🚀 Quick Start (Development)

### ขั้นตอน 1: Prepare

```bash
# 1. Clone repository
git clone <your-repo>
cd special_project_v1/python

# 2. Copy .env file
cp .env.example .env

# 3. (Optional) อัปเดต .env กับค่า custom ของคุณ
# CALENDAR_MODE=mock  # ใช้ mock calendar (ไม่ต้อง Google credentials)
```

### ขั้นตอน 2: Build & Run

```bash
# ติดตั้ง & รัน containers
docker-compose up --build

# หรือรัน background
docker-compose up -d --build
```

### ขั้นตอน 3: Access

```
🌐 Web UI: http://localhost:5000
📊 API Health: http://localhost:5000/api/health

ดูที่ browser แล้วลองสร้าง event!
```

### ขั้นตอน 4: Stop

```bash
docker-compose down

# ถ้าอยากลบ data ด้วย
docker-compose down -v
```

---

## 🔧 Docker Compose Profiles

### Profile 1: Default (Development)

```bash
# รัน Flask Web UI + Mock Calendar
docker-compose up
```

**Including:**
- ✅ Python app (Flask Web UI)
- ❌ Database
- ❌ MCP Server

**Good for:**
- Development
- Testing
- Demo purposes

**Ports:**
- `5000` → Flask Web UI

---

### Profile 2: with-db (Testing with Database)

```bash
# รัน Flask + PostgreSQL + pgAdmin
docker-compose --profile with-db up
```

**Including:**
- ✅ Python app (Flask Web UI)
- ✅ PostgreSQL database
- ✅ pgAdmin (database management)

**Good for:**
- Integration testing
- Multi-user testing
- Pre-production

**Ports:**
- `5000` → Flask Web UI
- `5432` → PostgreSQL
- `5050` → pgAdmin (user: admin@example.com)

**Connect to pgAdmin:**
```
URL: http://localhost:5050
Email: admin@example.com
Password: admin  (หรือค่า PGADMIN_PASSWORD ใน .env)

Add Server:
- Hostname: postgres
- Username: postgres  (หรือค่า DB_USER)
- Password: postgres  (หรือค่า DB_PASSWORD)
```

---

### Profile 3: with-mcp (Production with MCP Server)

```bash
# รัน Flask + PostgreSQL + MCP Server
docker-compose --profile with-mcp up
```

**Including:**
- ✅ Python app (Flask Web UI)
- ✅ PostgreSQL database
- ✅ MCP Server (Node.js)

**Good for:**
- Full Protocol support
- Advanced calendar operations
- Production-ready

**Ports:**
- `5000` → Flask Web UI
- `3000` → MCP Server
- `5432` → PostgreSQL

---

### Profile 4: production (Full Stack)

```bash
# รัน ทุกอย่าง + Nginx reverse proxy
docker-compose --profile production up
```

**Including:**
- ✅ Python app (Flask)
- ✅ PostgreSQL database
- ✅ MCP Server
- ✅ pgAdmin
- ✅ Nginx reverse proxy

**Good for:**
- Production deployment
- Load balancing
- SSL/TLS termination

**Ports:**
- `80` → Nginx (HTTP)
- `443` → Nginx (HTTPS)
- `5000` → Flask (internal)
- `3000` → MCP (internal)
- `5050` → pgAdmin

---

## 📝 Environment Configuration

### .env File

```bash
# 1. Copy from example
cp .env.example .env

# 2. Edit .env กับค่า custom
nano .env
```

### Key Variables

```bash
# Calendar Mode
CALENDAR_MODE=mock          # mock | api | mcp

# Flask
FLASK_ENV=development       # development | production
PORT=5000
SECRET_KEY=your-secret-key

# Database (for with-db profile)
DB_USER=postgres
DB_PASSWORD=secure-password
DB_NAME=calendar_agent

# Google Calendar (for api|mcp mode)
CREDENTIALS_PATH=/app/credentials.json
TOKEN_PATH=/app/token.json
```

### Example: Production Setup

```bash
CALENDAR_MODE=mcp
FLASK_ENV=production
PORT=5000
SECRET_KEY=$(openssl rand -base64 32)
DB_USER=prod_user
DB_PASSWORD=$(openssl rand -base64 24)
PGADMIN_PASSWORD=$(openssl rand -base64 16)
```

---

## 🔐 Google Calendar Setup (API Mode)

ถ้าอยากใช้ Google Calendar จริง:

```bash
# 1. Copy credentials.json ลงใน python/ folder
cp ~/Downloads/credentials.json ./credentials.json

# 2. Update .env
CALENDAR_MODE=api

# 3. Rebuild & run
docker-compose up --build
```

**วิธีขอ credentials.json:**
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง project ใหม่
3. Enable Google Calendar API
4. สร้าง OAuth credential (Desktop app)
5. Download JSON file
6. Copy ลงใน `python/credentials.json`

ดูขั้นตอนละเอียดใน [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📊 Data Persistence

### Volumes

```yaml
python-app:
  volumes:
    - ./data:/app/data           # Application data
    - ./diagrams:/app/diagrams    # Saved diagrams
    - ./logs:/app/logs            # Application logs
    - postgres_data:/app/db       # Database (external volume)
```

### Backup Database

```bash
# Export PostgreSQL backup
docker-compose exec postgres \
  pg_dump -U postgres calendar_agent > backup.sql

# Restore from backup
docker-compose exec -T postgres \
  psql -U postgres calendar_agent < backup.sql
```

### Clear Data

```bash
# Delete all containers & volumes
docker-compose down -v

# Delete only database
docker volume rm python_postgres_data
```

---

## 🐛 Troubleshooting

### Error: "Port 5000 already in use"

```bash
# วิธี 1: ปิด application อื่น
lsof -i :5000
kill -9 <PID>

# วิธี 2: เปลี่ยน port ใน .env
PORT=5001
docker-compose up
```

### Error: "Cannot connect to database"

```bash
# Check postgres health
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Check connection
docker-compose exec postgres \
  psql -U postgres -c "SELECT 1"
```

### Error: "MCP Server connection failed"

```bash
# Check MCP server logs
docker-compose --profile with-mcp logs mcp-server

# Verify Node.js installed
docker exec calendar-agent-mcp node --version

# Reinstall dependencies
docker-compose --profile with-mcp exec mcp-server npm install
```

### Containers won't start

```bash
# Clean build
docker-compose down
docker system prune -a --volumes
docker-compose up --build

# Check detailed logs
docker-compose logs -f
```

---

## 🔍 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f python-app
docker-compose logs -f postgres
docker-compose logs -f mcp-server

# Last N lines
docker-compose logs --tail=50 python-app
```

### Container Status

```bash
# List running containers
docker-compose ps

# CPU/Memory usage
docker stats

# Check logs with timestamps
docker-compose logs --timestamps
```

### Health Check

```bash
# Manual health check
curl http://localhost:5000/api/health

# Check in container
docker-compose exec python-app curl http://localhost:5000/api/health
```

---

## 🚀 Production Deployment

### Recommended Setup

```bash
# 1. Use production profile
docker-compose --profile production up -d

# 2. Setup SSL certificates (for Nginx)
# Copy certificates to ./certs/ folder
cp cert.pem ./certs/
cp key.pem ./certs/

# 3. Configure Nginx (nginx.conf)
# Update server blocks for production domain

# 4. Monitor services
docker-compose logs -f

# 5. Setup automatic backups
# Use cron job or manual backups
0 0 * * * /path/to/backup-script.sh
```

### Volume Mounts (Production)

```yaml
volumes:
  - /data/calendar-agent/data:/app/data
  - /data/calendar-agent/logs:/app/logs
  - /data/calendar-agent/diagrams:/app/diagrams
  - postgres_data:/var/lib/postgresql/data
  - /etc/ssl/certs/:/app/certs/:ro
```

### Resource Limits (Production)

```yaml
services:
  python-app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
  postgres:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
```

### Backup Strategy

```bash
#!/bin/bash
# backup-script.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/calendar-agent"

# Database backup
docker-compose exec -T postgres \
  pg_dump -U postgres calendar_agent | \
  gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Data backup
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" ./data ./diagrams

# Keep last 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: $DATE"
```

---

## 🔄 Updates & Maintenance

### Pull Latest Code

```bash
# Stop services
docker-compose down

# Update code
git pull

# Rebuild images
docker-compose up --build -d

# Migrate database (if needed)
docker-compose exec python-app \
  python -m prisma migrate deploy
```

### Database Migration

```bash
# Check migration status
docker-compose exec python-app \
  prisma migrate status

# Create new migration
docker-compose exec python-app \
  prisma migrate dev --name add_column

# Reset database (development only!)
docker-compose exec python-app \
  prisma migrate reset
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove stopped containers
docker container prune
```

---

## 📚 Reference

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start services |
| `docker-compose down` | Stop services |
| `docker-compose logs -f` | View logs |
| `docker-compose ps` | List containers |
| `docker-compose exec <service> <cmd>` | Execute command in container |
| `docker-compose build` | Build images |
| `docker-compose restart <service>` | Restart service |

---

## ❓ FAQ

<details>
<summary><strong>Q: ใช้ Mock mode ได้หรือเปลี่ยนเป็น API mode ทีหลังได้ไหม?</strong></summary>

ได้! แค่:
```bash
# 1. Update .env
CALENDAR_MODE=api

# 2. Add credentials.json
cp credentials.json ./

# 3. Rebuild
docker-compose up --build
```
</details>

<details>
<summary><strong>Q: ต้องการเปลี่ยน port แต่ยังใช้ docker-compose ได้ไหม?</strong></summary>

ได้! Update .env:
```bash
PORT=8080
```
แล้ว `docker-compose up` ใหม่
</details>

<details>
<summary><strong>Q: ต้องการ restore database backup ยังไง?</strong></summary>

```bash
docker-compose exec -T postgres \
  psql -U postgres calendar_agent < backup.sql
```
</details>

---

## 📞 Support

ถ้าเจอปัญหา:

1. ✅ Check logs: `docker-compose logs -f`
2. ✅ Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. ✅ Check [README.md](README.md) for more options

---

**Happy deploying! 🚀**
