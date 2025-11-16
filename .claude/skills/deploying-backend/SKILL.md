---
name: deploying-backend
description: Deploying VOICE Relay FastAPI backend to free-tier cloud platforms including Replit, Railway, Fly.io with PostgreSQL database setup on Neon or Supabase. Use when deploying backend, configuring production environment, troubleshooting deployment issues, or setting up databases.
version: 1.0.0
allowed-tools: ["Bash", "Read", "Write", "Edit", "Grep"]
dependencies: []
---

# Deploying VOICE Relay Backend

Deploy VOICE Relay backend for **$0/month** on free-tier platforms.

## Free Tier Stack Options

| Component | Service | Cost | Limit |
|-----------|---------|------|-------|
| **Backend Compute** | Replit | FREE | 0.5 vCPU, 512MB RAM |
| **Database** | Neon PostgreSQL | FREE | 500MB, 3 connections |
| **Domain** | Included | FREE | Built-in subdomain |
| **SSL/HTTPS** | Automatic | FREE | Included |

## Quick Deployment (Replit - 5 Minutes)

### Simplest Option: Replit

#### Step 1: Create Replit Account
1. Go to https://replit.com
2. Sign up with GitHub
3. Click "Create Repl"
4. Select "Python" template
5. Name: "voice-relay-backend"

#### Step 2: Upload Code
```bash
# In Replit terminal
git clone https://github.com/YOUR_USERNAME/voice-relay.git
cd voice-relay/backend
```

#### Step 3: Set Environment Variables
Create `.env` file:
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

#### Step 4: Install Dependencies
```bash
pip install -r requirements-prod.txt
```

#### Step 5: Run Server
```bash
python -m uvicorn main_production:app --host 0.0.0.0 --port 8000
```

#### Step 6: Get Your URL
Replit provides: `https://voice-relay-backend.YOUR_USERNAME.repl.co`

#### Step 7: Update Mobile App
```typescript
// app/src/services/api.ts
const API_BASE_URL = __DEV__
  ? 'http://localhost:9000'
  : 'https://voice-relay-backend.YOUR_USERNAME.repl.co';
```

**✅ Done! Backend is live for free.**

## Option 2: Railway

Railway provides $5/month free tier.

### Setup Railway

#### Step 1: Create Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect your voice-relay repo

#### Step 2: Add PostgreSQL
1. In Railway dashboard: "Add Service"
2. Select "PostgreSQL"
3. DATABASE_URL auto-generated

#### Step 3: Environment Variables
```
ENVIRONMENT=production
DATABASE_URL=(auto-generated)
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
PYTHON_VERSION=3.11
```

#### Step 4: Deploy
1. Push code to GitHub
2. Railway auto-deploys
3. Get URL from Railway dashboard

**Cost**: $0/month (using $5 free credit)

## Option 3: Fly.io

Fly.io gives 3 shared-cpu VMs free.

### Setup Fly.io

#### Step 1: Install CLI
```bash
curl -L https://fly.io/install.sh | sh
```

#### Step 2: Create Account
```bash
fly auth signup
# or: fly auth login
```

#### Step 3: Launch App
```bash
cd backend
fly launch

# Choose:
# - App name: voice-relay-backend
# - Region: closest to you
# - Database: No (use external)
```

#### Step 4: Set Secrets
```bash
fly secrets set \
  ENVIRONMENT=production \
  GITHUB_CLIENT_ID=your_id \
  GITHUB_CLIENT_SECRET=your_secret \
  DATABASE_URL=postgresql://...
```

#### Step 5: Deploy
```bash
fly deploy

# Get URL:
fly info
# URL: https://voice-relay-backend.fly.dev
```

**Cost**: $0/month (free tier)

## Free Database Options

### Option A: Neon (Recommended)

```bash
# 1. Go to https://neon.tech
# 2. Sign up
# 3. Create new database
# 4. Copy connection string
# 5. Use as DATABASE_URL
```

**Free Tier**: 500MB storage, 3 simultaneous connections

### Option B: Supabase

```bash
# 1. Go to https://supabase.com
# 2. Sign up with GitHub
# 3. Create new project
# 4. Copy connection string
```

**Free Tier**: 500MB storage, 2 concurrent connections, unlimited API calls

### Option C: Railway PostgreSQL

```bash
# Already included if using Railway
# DATABASE_URL auto-generated
```

**Free Tier**: Included in $5/month credit

## Recommended Combinations

### Best for Simplicity (5 min setup)
```
Backend:    Replit (free forever)
Database:   Neon PostgreSQL (free tier)
Domain:     Built-in Replit URL
SSL:        Automatic
Cost:       $0/month
```

### Best for Reliability (15 min setup)
```
Backend:    Fly.io (free tier)
Database:   Neon PostgreSQL (free tier)
Domain:     Fly.dev subdomain (free)
SSL:        Automatic
Cost:       $0/month
```

### Best for All-in-One (10 min setup)
```
Backend:    Railway (free $5/month)
Database:   Railway PostgreSQL (included)
Domain:     Railway subdomain (free)
SSL:        Automatic
Cost:       $0/month
```

## Environment Variables Checklist

Required for all platforms:
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@host:5432/db
GITHUB_CLIENT_ID=your_github_oauth_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret
```

Optional:
```bash
PORT=8000  # Auto-set on most platforms
PYTHON_VERSION=3.11  # For Railway
```

## Deployment Verification

After deploying, test endpoints:

### 1. Health Check
```bash
curl https://your-backend-url.com/health
# Expected: {"status": "healthy"}
```

### 2. Get Public Key
```bash
curl -X POST https://your-backend-url.com/auth/get-public-key \
  -H "Authorization: Bearer github|testuser|faketoken"
# Expected: {"app_public_key": "-----BEGIN PUBLIC KEY-----..."}
```

### 3. Agent Ask
```bash
curl -X POST https://your-backend-url.com/agent/ask \
  -H "Authorization: Bearer github|testuser|faketoken" \
  -H "Content-Type: application/json" \
  -d '{"encrypted_blob": "test", "encrypted_blob_size_bytes": 4}'
# Expected: {"status": "accepted", "message_id": "msg_..."}
```

## Monitoring Free Tier Usage

### Replit
```
Click "Resources" tab
See CPU, memory, storage usage
```

### Railway
```
Dashboard → Usage
See compute + database usage
Green = within free tier
```

### Fly.io
```bash
fly status
fly logs
```

## Common Deployment Issues

### Port Binding Error
**Problem**: "Address already in use"
**Solution**: Use `--host 0.0.0.0 --port $PORT`

### Database Connection Failed
**Problem**: "could not connect to server"
**Solution**: Check DATABASE_URL format:
```
postgresql://user:password@host:5432/database
```

### Static Files Not Found
**Problem**: 404 on /health
**Solution**: Verify main_production.py is deployed

### Timeout on Startup
**Problem**: "Application failed to respond"
**Solution**: Increase startup timeout or optimize cold start

## Scaling When You Get Users

Free tier can handle:
- **~100 concurrent users**
- **~1,000 daily active users**
- **~10,000 monthly prompts**

When exceeded:

| Milestone | Upgrade | New Cost |
|-----------|---------|----------|
| 1K users | Fly.io paid tier | $10-20/month |
| 10K users | Database upgrade | +$20/month |
| 100K users | CDN + scaling | +$50-100/month |

**Key**: Pay only as you grow. No upfront costs!

## Production Checklist

Before going live:
- [ ] Environment variables set correctly
- [ ] Database connection tested
- [ ] All endpoints returning 200/401 as expected
- [ ] HTTPS/SSL working
- [ ] Monitoring set up (basic)
- [ ] Error logging configured
- [ ] Backup strategy (database snapshots)

## When to Invoke This Skill

- Deploying backend for first time
- Switching between cloud platforms
- Setting up production environment
- Configuring database connection
- Troubleshooting deployment failures
- Scaling to handle more users
- Monitoring production usage
- Updating environment variables

## Quick Command Reference

```bash
# Replit
python -m uvicorn main_production:app --host 0.0.0.0 --port 8000

# Railway
# Auto-deploys on git push

# Fly.io
fly deploy
fly logs
fly status
fly secrets set KEY=VALUE

# Database Connection Test
psql $DATABASE_URL -c "SELECT 1;"
```

## Cost Summary

| Platform | Setup Time | Monthly Cost | Best For |
|----------|------------|--------------|----------|
| Replit | 5 min | $0 | Testing, quick start |
| Railway | 10 min | $0 | Balanced, all-in-one |
| Fly.io | 15 min | $0 | Reliability, scale |

**Bottom line**: Deploy free, pay only when you have real users. Risk-free launch! 🚀
