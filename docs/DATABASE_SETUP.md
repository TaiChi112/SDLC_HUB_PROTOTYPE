# 🗄️ Database Setup & Prisma Configuration

## Overview

This project uses **PostgreSQL** as the primary database with **Prisma** as the ORM for the Next.js frontend.

## Prerequisites

- **PostgreSQL** 14+ ([Install](https://www.postgresql.org/download/))
- **Node.js** 18+ and **Bun** (for frontend)

## Local Development Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE blueprint_hub_dev;

# Create user with password
CREATE USER blueprint_dev WITH PASSWORD 'your-secure-password-here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE blueprint_hub_dev TO blueprint_dev;

# Connect to the database
\c blueprint_hub_dev

# Grant schema privileges
GRANT ALL ON SCHEMA public TO blueprint_dev;

# Exit
\q
```

### 2. Configure Environment

```bash
# Frontend folder
cd frontend

# Create .env.local
cp .env.local.example .env.local

# Edit .env.local with your database URL
# DATABASE_URL="postgresql://blueprint_dev:your-password@localhost:5432/blueprint_hub_dev"
```

### 3. Generate Prisma Client & Apply Migrations

```bash
cd frontend

# Install dependencies
bun install

# Generate Prisma Client
bunx prisma generate

# Apply existing migrations
bunx prisma migrate deploy

# Or create migrations from schema changes
bunx prisma migrate dev --name "initial_schema"
```

### 4. Seed Initial Data (Optional)

```bash
# Run seed script (if configured in package.json)
bunx prisma db seed
```

## Schema Overview

See [frontend/prisma/schema.prisma](../frontend/prisma/schema.prisma) for the full schema.

### Key Models

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  
  blueprints Blueprint[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Blueprint {
  id          String   @id @default(cuid())
  title       String
  description String?
  version     String   @default("0.1.0")
  
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  
  sections    Section[]
  isPublished Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Section {
  id          String   @id @default(cuid())
  name        String
  content     String
  type        String   @default("text")  // text, list, diagram
  
  blueprintId String
  blueprint   Blueprint @relation(fields: [blueprintId], references: [id], onDelete: Cascade)
  
  order       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Common Prisma Commands

```bash
cd frontend

# View database in visual UI
bunx prisma studio

# Push schema changes to database (without generating migrations)
bunx prisma db push

# Create a new migration with a name
bunx prisma migrate dev --name "add_user_table"

# Apply pending migrations
bunx prisma migrate deploy

# Reset database to initial state (development only!)
bunx prisma migrate reset

# Generate Prisma Client after schema changes
bunx prisma generate

# Validate schema
bunx prisma validate
```

## Migrations

Migrations are stored in `frontend/prisma/migrations/`:

```
migrations/
├── migration_lock.toml      # Prevents concurrent migrations
├── 20260101000000_initial/
│   └── migration.sql
├── 20260102000000_add_blueprints/
│   └── migration.sql
```

### Creating a Migration

```bash
cd frontend

# After updating schema.prisma, create a migration
bunx prisma migrate dev --name "descriptive_migration_name"

# Follow the prompts to:
# 1. Review the migration SQL
# 2. Apply to development database
# 3. Generate Prisma Client
```

### Migration Best Practices

✅ **Do:**
- Name migrations descriptively: `add_user_avatar`, `rename_status_to_state`
- Keep migrations atomic (one logical change)
- Test migrations on development database first
- Commit migrations to git

❌ **Don't:**
- Use `prisma migrate reset` on shared/production databases
- Skip migrations in production
- Manually edit migration files
- Make breaking changes without migration strategy

## Production Deployment

### Environment Setup

```bash
# .env.local (production)
DATABASE_URL="postgresql://prod_user:STRONG_PASSWORD@prod-host:5432/blueprint_hub_prod"
NODE_ENV="production"
```

### Pre-Deployment Checklist

- [ ] Database backup created
- [ ] Connection pooled (if using external database)
- [ ] Schema validated: `bunx prisma validate`
- [ ] All migrations tested locally
- [ ] Environment variables configured

### Deployment Steps

```bash
# 1. Generate Prisma Client
bunx prisma generate

# 2. Apply pending migrations
bunx prisma migrate deploy

# 3. Start application
npm start
```

## Backup & Recovery

### Create Database Backup

```bash
# Using pg_dump
pg_dump -U blueprint_dev -h localhost blueprint_hub_dev > backup.sql

# With compression
pg_dump -U blueprint_dev -h localhost blueprint_hub_dev | gzip > backup.sql.gz
```

### Restore from Backup

```bash
# Drop current database
dropdb -U blueprint_dev blueprint_hub_dev

# Create new database
createdb -U blueprint_dev blueprint_hub_dev

# Restore from backup
psql -U blueprint_dev blueprint_hub_dev < backup.sql
```

## Troubleshooting

### Issue: "Cannot find a valid `DATABASE_URL` environment variable"

**Solution:**
```bash
# Check .env.local exists and contains DATABASE_URL
cat .env.local

# Rebuild client if needed
bunx prisma generate
```

---

### Issue: "Migration history does not match the current state"

**Solution (Development Only):**
```bash
# Reset database to clean state
cd frontend
bunx prisma migrate reset --force

# This will:
# 1. Drop the database
# 2. Recreate it
# 3. Apply all migrations
# 4. Run seed script
```

---

### Issue: "Database connection timeout"

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Verify connection string
psql -U blueprint_dev -h localhost -d blueprint_hub_dev

# Check firewall rules (if remote database)
```

---

## Connection Pooling

For production, use a connection pooler like **PgBouncer** or **Prisma Accelerate**:

```prisma
// schema.prisma with connection pooling
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl        = env("DATABASE_DIRECT_URL")  // Direct connection for migrations
}
```

```bash
# .env.local
DATABASE_URL="postgresql://pooler_user@pooler-host:6432/blueprint_hub_prod?schema=public"
DATABASE_DIRECT_URL="postgresql://prod_user@db-host:5432/blueprint_hub_prod?schema=public"
```

## Related Documentation

- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Backend API setup
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development workflow
- [TypeScript_conventions.md](TypeScript_conventions.md) - Data models and queries

---

**Last Updated**: March 2026  
**Maintainer**: Development Team
