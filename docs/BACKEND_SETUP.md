# Backend Setup Guide - Python FastAPI

‡∏ö‡∏ó‡∏ä‡πà‡∏ß‡∏¢‡∏™‡∏≠‡∏ô‡∏Å‡∏≤‡∏£‡∏ï‡∏±‡πâ‡∏á‡∏Ñ‡πà‡∏≤ Backend (Python FastAPI) ‡∏™‡∏≥‡∏´‡∏£‡∏±‡∏ö Blueprint Hub

## Ì≥ã Prerequisites

- **Python 3.12+**
- **uv** package manager ([Install uv](https://docs.astral.sh/uv/getting-started/installation/))
- **PostgreSQL** (development database)
- **Basic understanding of:**
  - Python & FastAPI
  - Environment variables
  - Command-line tools

Verify your setup:

```bash
python --version         # Should be 3.12 or higher
uv --version            # Should show uv version
psql --version          # PostgreSQL client
```

---

## Ì∫Ä 1) Initial Setup

### Navigate to Backend Directory

```bash
cd backend
```

### Install Python Dependencies

This project uses **`uv`** for Python package management (NOT pip):

```bash
# Install all dependencies listed in pyproject.toml
uv install
```

What `uv install` does:
- Reads `pyproject.toml` for dependencies
- Resolves versions using `uv.lock`
- Creates a virtual environment in `.venv/`
- Installs all packages

### Verify Installation

```bash
# Check that dependencies are installed
uv pip list | grep -E "fastapi|sqlalchemy|psycopg"
```

Should output FastAPI, SQLAlchemy, and psycopg2 packages.

---

## Ì¥ë 2) Environment Variables

### Create `.env.local`

```bash
cp .env.example .env.local
```

### Edit `.env.local`

Open `.env.local` and set:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/blueprint_hub"

# OpenAI API (for AI prompt features)
OPENAI_API_KEY="sk-..."

# FastAPI Settings
ENVIRONMENT="development"
DEBUG=true

# Optional: CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8000"
```

**Important**: Never commit `.env.local` - it contains secrets. Use `.env.example` as a template.

### Generate PostgreSQL URL

If you have PostgreSQL running locally:

```bash
# On macOS/Linux:
DATABASE_URL="postgresql://$(whoami):password@localhost:5432/blueprint_hub"

# On Windows (WSL or native):
DATABASE_URL="postgresql://postgres:password@localhost:5432/blueprint_hub"
```

---

## Ì∑ÑÔ∏è 3) Database Setup

### Start PostgreSQL

**macOS (Homebrew):**
```bash
brew services start postgresql
```

**Windows (WSL):**
```bash
sudo service postgresql start
```

**or Docker:**
```bash
docker-compose up -d postgres
```

### Create Database

```bash
# Using psql command-line
psql -U postgres -c "CREATE DATABASE blueprint_hub;"

# Or through the app initialization:
uv run python db.py  # Runs init/seed logic
```

### Verify Connection

```bash
# Test the connection string
psql $DATABASE_URL -c "SELECT 1;"
```

Should output: `1` if successful.

---

## Ì≥¶ 4) Understanding the Backend Structure

### Key Files

| File | Purpose |
|------|---------|
| `api.py` | FastAPI server - routes, endpoints |
| `db.py` | Database models, SQLAlchemy setup |
| `auto_spec.py` | AI spec generation utilities |
| `check_models.py` | Database model validation |
| `pyproject.toml` | Python dependencies, project metadata |
| `uv.lock` | Dependency versions lock file (version-controlled) |

### Core Dependencies (from `pyproject.toml`)

```toml
dependencies = [
    "fastapi>=0.109.0",      # Web framework
    "uvicorn>=0.27.0",       # ASGI server
    "sqlalchemy>=2.0.0",     # ORM
    "psycopg2-binary>=2.9",  # PostgreSQL driver
    "openai>=1.0.0",         # OpenAI API client
    "python-dotenv>=1.0.0",  # Environment variable loading
    "pydantic>=2.0.0",       # Data validation
]
```

---

## ÌøÉ 5) Running the Development Server

### Start the FastAPI Server

```bash
# Start with hot-reload enabled
uv run uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

What this does:
- Starts FastAPI on `http://localhost:8000`
- Enables auto-reload on file changes
- Listens on all network interfaces (`0.0.0.0`)

**Output should show:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [1234]
```

### Verify Server is Running

```bash
# In another terminal:
curl http://localhost:8000/docs
```

Should return the Swagger UI. You can also visit:
- **API Documentation**: http://localhost:8000/docs (Swagger)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)

---

## Ì¥¨ 6) Common Development Tasks

### Running Database Migrations

```bash
# Using SQLAlchemy migrations (if configured)
uv run alembic upgrade head
```

### Using Interactive Python Shell

```bash
# Open interactive Python REPL with uv
uv run python

# Inside Python:
from db import engine, SessionLocal
session = SessionLocal()
# Now you can query the database
```

### Testing Database Connection

```bash
uv run python -c "from db import engine; print(engine.engine)"
```

### Checking Models

```bash
# Validates database models
uv run python check_models.py
```

### Generating AI Specs

```bash
# Test AI spec generation
uv run python auto_spec.py
```

---

## Ì∞≥ 7) Docker Setup (Optional)

### Using docker-compose

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Check it's running
docker-compose ps
```

### Inside the docker-compose.yml

The provided `docker-compose.yml` sets up:

```yaml
postgres:
  image: postgres:15
  environment:
    POSTGRES_DB: blueprint_hub
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: password
  ports:
    - "5432:5432"
```

Connect with:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/blueprint_hub"
```

---

## Ì¥ó 8) Backend ‚Üî Frontend Integration

### Frontend Calls Backend

The Next.js frontend at `http://localhost:3000` makes API calls to:
```
http://localhost:8000/api/...
```

### CORS Configuration

The backend includes CORS headers to allow requests from `localhost:3000`:

```python
# In api.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Ì≥° 9) API Endpoints

### Standard Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/` | Health check |
| `GET` | `/docs` | Swagger UI |
| `POST` | `/api/artifacts` | Generate artifact |
| `GET` | `/api/artifacts/{id}` | Get artifact |
| `POST` | `/api/specs/generate` | Generate AI spec |

### Health Check

```bash
curl http://localhost:8000/
```

### Generate Artifact (Example)

```bash
curl -X POST http://localhost:8000/api/artifacts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Architecture",
    "type": "mermaid",
    "content": "graph TD; A-->B;"
  }'
```

---

## Ì∞õ Troubleshooting

### Issue: `uv: command not found`

**Solution**: Install uv globally

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Issue: `No module named 'fastapi'`

**Solution**: Run `uv install` from the `backend/` directory

```bash
cd backend
uv install
```

### Issue: `psycopg2: can't adapt type 'bytes'`

**Solution**: Make sure PostgreSQL is compatible. Use `psycopg2-binary`:

```bash
uv pip install --upgrade psycopg2-binary
```

### Issue: `DATABASE_URL mismatch error`

**Solution**: Verify your connection string:

```bash
# Test the URL
psql $DATABASE_URL -c "SELECT 1;"

# If it fails, check:
# - PostgreSQL is running
# - Username/password correct
# - Database exists
```

### Issue: FastAPI won't start (`ADDRESS ALREADY IN USE`)

**Solution**: Port 8000 is in use. Either:

```bash
# Kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uv run uvicorn api:app --reload --port 8001
```

---

## Ì≤° Tips & Best Practices

### 1. Use `uv` Instead of `pip`

Always use `uv` for this project:

```bash
# ‚úÖ Correct
uv pip install some_package
uv install

# ‚ùå Incorrect (don't use)
pip install some_package
python -m pip install
```

### 2. Keep Dependencies in `pyproject.toml`

When adding a new dependency:

```bash
uv add package_name
# This updates both pyproject.toml AND uv.lock
```

### 3. Recreate Virtual Environment if Issues

If you have dependency conflicts:

```bash
rm -rf .venv
uv install
```

### 4. Use `.env.local` for Secrets

Never commit secrets:

```
# ‚úÖ Correct - .gitignore includes
.env.local

# ‚ùå Wrong - don't commit
.env (with real keys)
```

### 5. Monitor Logs During Development

Always check the server output:

```bash
# Keep this terminal open while developing
uv run uvicorn api:app --reload --log-level debug
```

---

## Ì≥ö Additional Resources

- **[FastAPI Official Docs](https://fastapi.tiangolo.com)**
- **[SQLAlchemy Docs](https://docs.sqlalchemy.org)**
- **[uv Package Manager](https://docs.astral.sh/uv)**
- **[PostgreSQL Documentation](https://www.postgresql.org/docs)**
- **[OpenAI API Reference](https://platform.openai.com/api-reference)**

---

## ‚úÖ Checklist: All Set Up?

- [ ] `uv --version` shows version
- [ ] `python --version` is 3.12+
- [ ] PostgreSQL running (`psql --version` works)
- [ ] `cd backend && uv install` successful
- [ ] `.env.local` created with DATABASE_URL
- [ ] `psql $DATABASE_URL -c "SELECT 1"` returns 1
- [ ] `uv run uvicorn api:app --reload` starts without errors
- [ ] `curl http://localhost:8000/docs` shows Swagger UI
- [ ] Frontend and backend both running (separate terminals)

**If all check, you're ready to develop! Ì∫Ä**

---

**Last Updated**: March 2025 | **Package Manager**: uv | **Python Version**: 3.12+
