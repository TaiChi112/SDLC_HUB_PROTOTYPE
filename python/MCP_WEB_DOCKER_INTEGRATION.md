# 🔗 MCP Server + Web UI + Docker Integration Guide

## 📖 ภาพรวมของระบบที่สมบูรณ์

```
┌─────────────────────────────────────────────────────────────────┐
│                    Calendar Agent System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐        ┌──────────────────┐                │
│  │  Web UI         │        │    CLI (main.py) │                │
│  │  (Flask app.py) │        │                  │                │
│  │  Port 5000      │        │  Interactive     │                │
│  └────────┬────────┘        │  Mode            │                │
│           │                 └────────┬─────────┘                │
│           │                          │                          │
│           └──────────────┬───────────┘                          │
│                          │                                      │
│                ┌─────────▼─────────┐                           │
│                │  Calendar Agent   │                           │
│                │  (main.py)        │                           │
│                └────────┬──────────┘                           │
│                         │                                      │
│        ┌────────────────┼─────────────────┐                   │
│        │                │                 │                   │
│        ▼                ▼                 ▼                   │
│   ┌─────────┐     ┌──────────┐     ┌──────────┐              │
│   │  Mock   │     │ Google   │     │   MCP    │              │
│   │ Calendar│     │ Calendar │     │  Server  │              │
│   │         │     │  (API)   │     │          │              │
│   └─────────┘     └──────────┘     └────┬─────┘              │
│                                          │                    │
│                                    ┌─────▼──────┐             │
│                                    │  Node.js   │             │
│                                    │ server.js  │             │
│                                    │  (tools)   │             │
│                                    └────────────┘             │
│                                                                │
└─────────────────────────────────────────────────────────────────┘

Deployment Options:
├─ Development: Web UI + Mock Calendar
├─ Testing: Web UI + Mock/API + Database  
└─ Production: Web UI + MCP + Database + Nginx
```

---

## 🚀 Setup สำหรับแต่ละ Mode

### Mode 1: Mock Calendar (Development - ง่ายที่สุด)

```bash
# 1. Install dependencies
pip install flask flask-cors python-dotenv

# 2. Run Flask Web UI
python app.py

# 3. Access
open http://localhost:5000

# 4. Run CLI (interactive)
python main.py
```

**Pros:**
- ✅ ไม่ต้อง credentials
- ✅ เร็ว (in-memory)
- ✅ Perfect for testing

**Cons:**
- ❌ ไม่เชื่อมต่อ Google Calendar จริง
- ❌ Data หายเมื่อ restart

---

### Mode 2: Google Calendar API (Production-Ready)

#### Step 1: Get Google Credentials

```bash
# 1. DL credentials.json from Google Cloud Console
# https://developers.google.com/calendar/api/quickstart/python

# 2. Place in project folder
cp ~/Downloads/credentials.json .

# 3. Update .env
echo "CALENDAR_MODE=api" >> .env
```

#### Step 2: Run with API Mode

```bash
# แบบ CLI
CALENDAR_MODE=api python main.py

# แบบ Web UI
CALENDAR_MODE=api python app.py
```

**Browser authorization screen จะ pop up เมื่อรัน**

---

### Mode 3: MCP Server (Full Protocol)

#### Step 1: Setup Node.js MCP Server

```bash
# 1. Install Node dependencies
cd mcp-server
npm install

# 2. Update environment
echo "CREDENTIALS_PATH=../credentials.json" > .env
echo "TOKEN_PATH=../token.json" >> .env

# 3. Start MCP server (ต่างหากเพื่อเป็น background service)
node server.js

# Server logs:
# ✅ Calendar initialized successfully
# ✅ MCP Calendar Server started successfully
# 📡 Listening on stdio transport
```

#### Step 2: Run Calendar Agent with MCP Client

**ในอีก terminal:**

```bash
# Update .env
echo "CALENDAR_MODE=mcp" >> .env

# Run CLI with MCP
python main.py

# Run Web UI with MCP
python app.py
```

**Expected output:**
```
🤖 [Agent] ได้รับคำสั่ง: จัดการตารางเรียน 1 เทอม
   [MCP Tool] 🔍 กำลังค้นหา Event...
```

---

## 🐳 Docker Deployment

### Quick Start

```bash
# 1. Copy environment
cp .env.example .env

# 2. Build & run (default: mock mode)
docker-compose up --build

# 3. Access Web UI
open http://localhost:5000
```

### Different Profiles

```bash
# Development (Flask + Mock)
docker-compose up

# With Database
docker-compose --profile with-db up

# With MCP Server
docker-compose --profile with-mcp up

# Full production stack
docker-compose --profile production up
```

### Check logs

```bash
docker-compose logs -f python-app
docker-compose logs -f mcp-server
docker-compose logs -f postgres
```

---

## 📝 Configuration Reference

### .env Variables

```bash
# Application
FLASK_ENV=production       # development | production
PORT=5000
SECRET_KEY=your-secret    # Change in production!

# Calendar Mode
CALENDAR_MODE=mock        # mock | api | mcp

# MCP Server
CREDENTIALS_PATH=./credentials.json
TOKEN_PATH=./token.json

# Database
DATABASE_URL=sqlite:///calendar_agent.db
# Or PostgreSQL:
# DATABASE_URL=postgresql://user:pass@localhost/calendar_agent

# Timezone
TIMEZONE=Asia/Bangkok
```

---

## 🧪 Testing the Integration

### Test 1: CLI with Mock Calendar

```bash
python main.py

# Expected:
# 📅 Calendar Agent System
# 🤖 [Agent] ได้รับคำสั่ง...
# ⚠️ [Agent Alert] พบเวลาชนกันครับ...
# 👉 เลือกตัวเลือก (1-4): 1
# ✅ บันทึกเรียบร้อย 3 events
```

### Test 2: Web UI with Mock Calendar

```bash
python app.py
```

1. Open http://localhost:5000
2. Fill in event details:
   - Title: "Test Event"
   - Start: Today
   - Duration: 60 min
   - Weeks: 4
3. Click "Create Event"
4. See conflicts in modal
5. Select resolution option

### Test 3: MCP Server Integration

**Terminal 1 - Start MCP Server:**
```bash
cd mcp-server
node server.js

# Should output:
# ✅ Calendar initialized successfully
# ✅ MCP Calendar Server started successfully
```

**Terminal 2 - Run Python Agent:**
```bash
python main.py  # Uses MCP mode automatically if .env set

# Should show:
# [MCP] 🚀 Starting MCP Server...
# [MCP] ✅ เชื่อมต่อ MCP Server สำเร็จ
```

### Test 4: Web UI + Database

```bash
docker-compose --profile with-db up
```

1. Access http://localhost:5000
2. Create events via Web UI
3. Access pgAdmin: http://localhost:5050
   - Email: admin@example.com
   - Password: admin

### Test 5: End-to-End with Docker

```bash
docker-compose --profile with-mcp up

# Access:
# - Web UI: http://localhost:5000
# - API Health: http://localhost:5000/api/health
# - MCP Server: Port 3000 (internal)
# - Database: postgresql://localhost:5432
```

---

## 🔍 Debugging

### Check MCP Server Status

```bash
# Is server running?
curl http://localhost:3000/health 2>/dev/null || echo "Not running"

# Check logs
docker-compose logs mcp-server

# Restart
docker-compose restart mcp-server
```

### Check Database Connection

```bash
# PostgreSQL
docker-compose exec postgres psql -U postgres -d calendar_agent -c "\dt"

# SQLite (if using default)
sqlite3 calendar_agent.db ".tables"
```

### Check Flask Web UI

```bash
# Health check
curl http://localhost:5000/api/health

# Check logs
docker-compose logs -f python-app
```

### Connection Issues

```bash
# Restart all services
docker-compose down
docker-compose up --build

# Clear docker cache
docker system prune -a
docker-compose build --no-cache
```

---

## 📊 Architecture Decision

### Why MCP?

| Feature | Mock | API | MCP |
|---------|------|-----|-----|
| **Speed** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡ |
| **Real Data** | ❌ | ✅ | ✅ |
| **Scalability** | 🔴 | 🟡 | 🟢 |
| **Complexity** | 🔴 | 🟡 | 🟢 |
| **Dev Speed** | 🟢 | 🟡 | 🔴 |

**Recommendation:**
- **Development**: Use Mock mode
- **Testing**: Use Mock or API mode
- **Production**: Use MCP mode with Docker

---

## 🔒 Security Considerations

### Development

```bash
# Safe to use insecure defaults
SECRET_KEY=dev
FLASK_ENV=development
DEBUG=true
```

### Production

```bash
# Generate secure secret
SECRET_KEY=$(openssl rand -base64 32)

# Use environment-specific config
FLASK_ENV=production
DEBUG=false

# SSL Certificate
SSL_CERT=/etc/ssl/certs/cert.pem
SSL_KEY=/etc/ssl/private/key.pem

# Database credentials should be in secure vault
# Never commit .env with real credentials!
```

---

## 📞 Support & Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT in .env |
| Can't connect to MCP | Check Node server is running |
| Database connection failed | Check PostgreSQL is running |
| Google auth error | Update credentials.json |
| Docker build fails | Try `docker-compose build --no-cache` |

### Get Logs

```bash
# All
docker-compose logs

# Specific service
docker-compose logs python-app
docker-compose logs mcp-server
docker-compose logs postgres

# Real-time
docker-compose logs -f

# Last N lines
docker-compose logs --tail=100
```

---

## ✅ Verification Checklist

After setup, verify all components:

- [ ] **Flask Web UI**
  - [ ] Access http://localhost:5000
  - [ ] Health check: `/api/health` returns `{"status": "healthy"}`
  
- [ ] **CLI with Interactive Mode**
  - [ ] Run `python main.py`
  - [ ] Prompts for input
  - [ ] Creates events

- [ ] **MCP Server** (if using)
  - [ ] Server starts: `node mcp-server/server.js`
  - [ ] Logs show initialization
  - [ ] Can list tools: `GET /tools`

- [ ] **Database** (if using)
  - [ ] PostgreSQL running
  - [ ] Can connect via pgAdmin
  - [ ] Tables created

- [ ] **Docker Deployment**
  - [ ] `docker-compose up` starts without errors
  - [ ] All services healthy: `docker-compose ps`
  - [ ] Web UI accessible on port 5000

---

## 🎓 Learning Path

1. **Start with Mock**: `python app.py` (Web UI)
2. **Try CLI**: `python main.py` (Interactive)
3. **Add Database**: `docker-compose --profile with-db up`
4. **Enable MCP**: `docker-compose --profile with-mcp up`
5. **Production**: `docker-compose --profile production up`

---

**You're all set! 🚀**

Next steps:
- Customize scoring algorithm in `main.py`
- Update styling in `templates/index.html`
- Add database models for persistence
- Setup CI/CD pipeline
- Deploy to production

Happy scheduling! 📅
