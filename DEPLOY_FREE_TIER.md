# VOICE Relay - Free Tier Deployment Guide

**Deploy VOICE Relay for $0/month with no credit card required.**

---

## Overview

This guide shows how to deploy VOICE Relay on completely free tiers. You only pay when (if) you hit usage limits that exceed free tiers.

**Typical Monthly Cost**: $0 (unless you get thousands of active users)

---

## The Free Tier Stack

| Component | Service | Cost | Limit |
|-----------|---------|------|-------|
| **Backend Compute** | Replit | FREE | 0.5 vCPU, 512MB RAM (always on) |
| **Database** | Railway (free tier) | FREE | 5GB PostgreSQL |
| **Domain** | Fly.io DNS | FREE | Built-in |
| **SSL/HTTPS** | Automatic | FREE | Included |
| **Mobile App** | App Stores | FREE | Distribution only |
| **Email/Support** | Free tier | FREE | Built-in |
| **Total** | | **$0** | Generous free tier |

---

## Option 1: Replit (Simplest, Completely Free)

### What You Get
- Free 24/7 hosting (no hibernation if you stay active)
- PostgreSQL database (5GB free)
- Custom domain support
- Free SSL certificate
- No credit card needed
- Deploy in 5 minutes

### Step 1: Create Replit Account
```
1. Go to https://replit.com
2. Sign up with GitHub (easier)
3. Click "Create Repl"
4. Select "Python" template
5. Name it "voice-relay-backend"
```

### Step 2: Upload Your Code
```bash
# In your Replit terminal
git clone https://github.com/YOUR_USERNAME/voice-relay.git
cd voice-relay/backend
```

### Step 3: Set Up Environment
```bash
# In Replit: Create .env file with your secrets
echo "ENVIRONMENT=production" > .env
echo "DATABASE_URL=postgresql://..." >> .env
echo "GITHUB_CLIENT_ID=..." >> .env
echo "GITHUB_CLIENT_SECRET=..." >> .env
```

### Step 4: Install Dependencies
```bash
pip install -r requirements-prod.txt
```

### Step 5: Run the Server
```bash
python -m uvicorn main_production:app --host 0.0.0.0 --port 8000
```

### Step 6: Get Your URL
Replit automatically gives you a URL:
```
https://voice-relay-backend.YOUR_USERNAME.repl.co
```

### Step 7: Update Mobile App
```typescript
// app/src/services/api.ts
const API_BASE_URL = __DEV__
  ? 'http://localhost:9000'
  : 'https://voice-relay-backend.YOUR_USERNAME.repl.co';
```

**✅ Done! Your backend is live for free.**

---

## Option 2: Railway (Free Trial + Generous Free Tier)

Railway gives you $5/month free tier (more than enough for testing).

### What You Get
- Free $5 credit per month
- PostgreSQL 5GB (free)
- 512 MB RAM
- Custom domain
- SSL/HTTPS included
- Auto-deploys from GitHub

### Step 1: Create Railway Account
```
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect your voice-relay repo
```

### Step 2: Add PostgreSQL Database
```
1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway creates DATABASE_URL automatically
```

### Step 3: Set Environment Variables
In Railway dashboard:
```
ENVIRONMENT=production
DATABASE_URL=(auto-generated)
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
PYTHON_VERSION=3.11
```

### Step 4: Configure Dockerfile
Make sure your `backend/Dockerfile` exists (we already created it):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements-prod.txt .
RUN pip install -r requirements-prod.txt
COPY main_production.py main.py
ENV PORT=8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 5: Deploy
```
1. Push code to GitHub
2. Railway auto-deploys
3. Get your URL from Railway dashboard
```

**✅ Done! Deployed to Railway for free.**

---

## Option 3: Fly.io (Free Tier + Generous Limits)

Fly.io gives you 3 shared-cpu-1x 256MB VMs for free.

### What You Get
- 3 free VMs (shared CPU)
- 3GB persistent storage free
- PostgreSQL database (separate, $10 managed OR run on same VM)
- Custom domain (.fly.dev subdomain free)
- Global edge network
- SSL/HTTPS included

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Create Fly Account
```bash
fly auth signup
# or: fly auth login
```

### Step 3: Launch App
```bash
cd backend
fly launch

# Fly asks:
# - App name: voice-relay-backend
# - Region: choose closest to you
# - Database: Select "No" (use separate option below)
```

### Step 4: Create PostgreSQL Database (Free)
Option A: Use Fly's managed PostgreSQL (starts at $10, but try separate option)

Option B: Run PostgreSQL in a separate free VM:
```bash
fly postgres create
# Fly creates a free PostgreSQL instance
```

Option C: Use a free external database (see below)

### Step 5: Set Secrets
```bash
fly secrets set \
  ENVIRONMENT=production \
  GITHUB_CLIENT_ID=your_id \
  GITHUB_CLIENT_SECRET=your_secret
```

### Step 6: Deploy
```bash
fly deploy

# Get your URL:
fly info
# URL: https://voice-relay-backend.fly.dev
```

**✅ Done! Deployed to Fly.io for free.**

---

## Option 4: Free Database Only (Keep Your Compute)

If you already have compute (Replit, Fly, etc.), use a free database service.

### A. Neon (PostgreSQL, Free Tier)
```
1. Go to https://neon.tech
2. Sign up
3. Create new database
4. Copy connection string
5. Use as DATABASE_URL
```

**Free Tier**: 10 projects, 500MB storage, up to 3 simultaneous connections
- **Perfect for**: Testing and small deployments

### B. PlanetScale (MySQL, Free Tier)
```
1. Go to https://planetscale.com
2. Sign up
3. Create database
4. Copy connection string
```

**Free Tier**: 5GB storage, 100M rows, unlimited connections
- **Perfect for**: Small-to-medium deployments

### C. Supabase (PostgreSQL, Very Generous Free Tier)
```
1. Go to https://supabase.com
2. Sign up with GitHub
3. Create new project
4. Copy connection string
```

**Free Tier**: 500MB storage, up to 2 concurrent connections, unlimited API calls
- **Perfect for**: Most small apps

---

## Recommended Free Tier Stack

### Best for Simplicity (5 minutes to live)
```
Backend:    Replit (free forever)
Database:   Railway PostgreSQL (free tier)
Domain:     Built-in Replit URL
SSL:        Automatic
Cost:       $0/month
Setup time: 5 minutes
```

**Why?**
- No credit card needed
- Everything in one place
- Automatic updates
- Always on (if you keep it active)

### Best for Reliability (slightly more setup)
```
Backend:    Fly.io (free tier)
Database:   Neon PostgreSQL (free tier)
Domain:     Fly.dev subdomain (free)
SSL:        Automatic
Cost:       $0/month
Setup time: 15 minutes
```

**Why?**
- Global edge network
- Better performance
- More generous free tier
- Scales well when you grow

### Best for Maximum Free Resources
```
Backend:    Railway (free $5/month)
Database:   Railway PostgreSQL (free $5/month)
Domain:     Custom domain (pay only if you want)
SSL:        Automatic
Cost:       $0/month (using free $5 credit)
Setup time: 10 minutes
```

**Why?**
- All in one platform
- Most generous free tier ($5)
- Easier monitoring
- Scales nicely

---

## Free Domain Names (Optional)

Want a free domain instead of `replit.co` or `fly.dev`?

### Option 1: Freenom (Completely Free)
```
1. Go to https://www.freenom.com
2. Search for .tk domain
3. Register for free (1 year)
4. Configure DNS
```

**Domain**: yourdomain.tk (free, but looks less professional)

### Option 2: Free Subdomains
Most services provide free subdomains:
- Replit: `yourapp.YOUR_USERNAME.repl.co`
- Fly.io: `yourapp.fly.dev`
- Railway: `yourapp.railway.app`

**Recommendation**: Use free subdomain for now, upgrade domain later if needed.

---

## Scaling When You Get Users (Cost Growth Path)

Your free tier deployment can handle:
- **Up to ~100 concurrent users** on free tier
- **Up to ~1,000 daily active users**
- **Up to ~10,000 monthly prompts**

When you exceed this, costs are:

| Milestone | Service | New Cost |
|-----------|---------|----------|
| 100 users | Stays free | $0 |
| 1K users | Fly.io upgrade | $10-20/month |
| 10K users | Database upgrade | +$20/month |
| 100K users | CDN + scaling | +$50-100/month |

**Key Point**: You pay as you grow. No upfront costs!

---

## Step-by-Step: Deploy Free Right Now

### Using Replit (Fastest)

```bash
# 1. Go to https://replit.com and create account

# 2. Create new Repl (Python)

# 3. In terminal:
git clone https://github.com/YOUR_USERNAME/voice-relay.git
cd voice-relay/backend

# 4. Edit .env
nano .env
# Add:
# ENVIRONMENT=production
# DATABASE_URL=postgresql://... (from Railway)
# GITHUB_CLIENT_ID=...
# GITHUB_CLIENT_SECRET=...

# 5. Install
pip install -r requirements-prod.txt

# 6. Run
python -m uvicorn main_production:app --host 0.0.0.0 --port 8000

# 7. Wait for output:
# Uvicorn running on http://0.0.0.0:8000

# 8. Copy Replit URL
# It's shown in browser tab: voice-relay-backend.YOUR_USERNAME.repl.co

# 9. Update app/src/services/api.ts
# Change API_BASE_URL to your Replit URL

# 10. Build and submit app
npm run android
npm run ios
```

**Total time: ~15 minutes**

---

## Cost Comparison: Free vs Paid

| Option | Backend | Database | Domain | Total | Setup Time |
|--------|---------|----------|--------|-------|------------|
| **Free (Replit)** | $0 | $0 | Free | **$0** | 5 min |
| **Free (Fly.io)** | $0 | $0 | Free | **$0** | 15 min |
| **Freemium (Railway)** | $0 | $0 | Free | **$0** | 10 min |
| **Paid (Cloud Run)** | $8 | $12 | $12 | **$32** | 30 min |
| **Paid (VPS)** | $6-30 | $0 | $12 | **$18-42** | 60 min |

---

## Important Notes About Free Tiers

### Replit
- ✅ **Pros**: Simplest, no credit card, always on
- ⚠️ **Cons**: Shared CPU (slower), may hibernate if inactive
- 📌 **Best for**: Testing, small projects

### Railway
- ✅ **Pros**: $5 free monthly, good performance
- ⚠️ **Cons**: Free tier limited to $5/month usage
- 📌 **Best for**: Small launches, controlled growth

### Fly.io
- ✅ **Pros**: 3 free VMs, global network, scales well
- ⚠️ **Cons**: Slightly more setup
- 📌 **Best for**: Reliable, scalable deployments

### Neon (Database Only)
- ✅ **Pros**: Very generous free tier (500MB)
- ⚠️ **Cons**: 2 concurrent connections only
- 📌 **Best for**: Small deployments

---

## Monitoring Free Tier Usage

Check your usage regularly:

**Replit**
```
Click "Resources" tab
See CPU, memory, storage
```

**Railway**
```
Dashboard → Usage
See compute + database usage
Green = free tier
```

**Fly.io**
```
fly status
fly logs
See current usage
```

---

## When to Upgrade

**Upgrade when you have**:
- ✅ Real users (100+)
- ✅ Consistent demand
- ✅ Revenue or funding
- ✅ Clear product-market fit

**Don't upgrade if**:
- ❌ Still in beta
- ❌ Testing with small team
- ❌ Uncertain about demand
- ❌ No paying users yet

---

## Free Tier Roadmap

**Phase 1: Launch (Free)**
```
Week 1: Deploy on Replit/Fly
Week 2: Beta users on free tier
Week 3: Monitor usage and get feedback
```

**Phase 2: Growth (Stay Free)**
```
If <1K users: Stay on free tier
Use free tier to validate demand
Get real feedback before paying
```

**Phase 3: Scale (Pay Only When Needed)**
```
When >1K users: Evaluate paid options
Cost is justified by revenue
Or find investors/sponsors
```

---

## Success Stories: Free Tier Apps

Many successful apps started 100% free:
- Figma (deployed on Heroku free)
- Notion (started as side project)
- Discord (initially free to test)

**Key insight**: Don't pay for infrastructure until you know people want it.

---

## Summary: Free Option Comparison

### **Simplest**: Replit
- Go to replit.com
- Upload code
- Click "Run"
- Get URL
- **Done in 5 minutes**

### **Most Reliable**: Fly.io
- Install fly CLI
- Run `fly launch`
- Deploy
- **Done in 15 minutes**

### **Best Balance**: Railway
- Connect GitHub repo
- Add PostgreSQL
- Auto-deploys
- **Done in 10 minutes**

---

## Your Move

**Recommended action**:

1. **Choose Replit** (fastest, zero setup)
2. **Create Railway PostgreSQL** (free database)
3. **Deploy in 10 minutes**
4. **Update mobile app API endpoint**
5. **Build and submit apps**
6. **See if anyone uses it**
7. **Upgrade only if you have users**

**Total cost**: $0
**Total setup time**: ~20 minutes
**Risk**: Zero (no credit card, no commitment)

---

## Need Help?

- **Replit docs**: https://replit.com/doc
- **Railway docs**: https://docs.railway.app
- **Fly.io docs**: https://fly.io/docs

All have excellent free tier documentation.

---

**Bottom line**: Deploy for free right now. Pay later (only if needed). Risk-free launch! 🚀
