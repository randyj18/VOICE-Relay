# VOICE Relay - Quick Start Deployment Guide

**Get VOICE Relay to production in 1 hour.**

---

## 5-Minute Setup (Choose One)

### Option 1: Google Cloud Run (Recommended)

```bash
# 1. Clone and setup
git clone https://github.com/YOUR_USERNAME/voice-relay.git
cd voice-relay

# 2. Set environment variables
cp .env.example .env
# Edit .env with your GitHub OAuth credentials

# 3. Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/voice-relay-backend

# 4. Deploy to Cloud Run
gcloud run deploy voice-relay-backend \
  --image gcr.io/PROJECT_ID/voice-relay-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=$DATABASE_URL,GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID

# 5. Get your service URL
gcloud run services describe voice-relay-backend --platform managed --format 'value(status.url)'
```

✅ **Done!** Your backend is live.

### Option 2: Docker Compose (Local Testing)

```bash
# 1. Start PostgreSQL + Backend
docker-compose up -d

# 2. Test the API
curl http://localhost:8000/health

# 3. Stop when done
docker-compose down
```

✅ **Done!** Your local environment is ready.

---

## Step-by-Step: Cloud Run Deployment

### Prerequisites (2 minutes)

```bash
# 1. Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# 2. Initialize gcloud
gcloud init

# 3. Create a new project
gcloud projects create voice-relay-prod

# 4. Set project
gcloud config set project voice-relay-prod

# 5. Enable required services
gcloud services enable \
  run.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  cloudsql.googleapis.com
```

### Database Setup (5 minutes)

```bash
# 1. Create Cloud SQL PostgreSQL instance
gcloud sql instances create voice-relay-db \
  --database-version POSTGRES_15 \
  --region us-central1 \
  --tier db-f1-micro \
  --availability-type REGIONAL

# 2. Create database
gcloud sql databases create voice_relay --instance=voice-relay-db

# 3. Create user
gcloud sql users create voice_relay \
  --instance=voice-relay-db \
  --password=STRONG_PASSWORD_HERE

# 4. Get connection string
gcloud sql instances describe voice-relay-db \
  --format='value(connectionName)'

# Store as DATABASE_URL:
# postgresql://voice_relay:PASSWORD@/voice_relay?host=/cloudsql/PROJECT:REGION:INSTANCE
```

### GitHub OAuth Setup (3 minutes)

```bash
# 1. Go to: https://github.com/settings/developers
# 2. Click "New OAuth App"
# 3. Fill in:
#    - Application name: VOICE Relay
#    - Homepage URL: https://voice-relay.app
#    - Authorization callback URL: https://YOUR_CLOUD_RUN_URL/auth/callback
# 4. Copy Client ID and Client Secret
```

### Deploy Backend (10 minutes)

```bash
# 1. Create .env file
cat > .env << 'EOF'
ENVIRONMENT=production
DATABASE_URL=postgresql://voice_relay:PASSWORD@/voice_relay?host=/cloudsql/PROJECT:REGION:INSTANCE
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
SENTRY_DSN=https://... (optional)
EOF

# 2. Build image
cd backend
gcloud builds submit --tag gcr.io/voice-relay-prod/backend

# 3. Deploy to Cloud Run
gcloud run deploy voice-relay-backend \
  --image gcr.io/voice-relay-prod/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 100 \
  --set-env-vars-file .env

# 4. Add Cloud SQL connector to allow database connection
gcloud run services update voice-relay-backend \
  --add-cloudsql-instances PROJECT:REGION:voice-relay-db \
  --set-env-vars DATABASE_URL=$DATABASE_URL

# 5. Get your API URL
API_URL=$(gcloud run services describe voice-relay-backend \
  --platform managed \
  --format 'value(status.url)')
echo "API deployed to: $API_URL"
```

### Test API (2 minutes)

```bash
# Test health check
curl $API_URL/health

# Test auth (with demo token)
curl -X POST $API_URL/auth/get-public-key \
  -H "Authorization: Bearer github|testuser|token" \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return 200 with public key
```

### Update Mobile App (5 minutes)

```typescript
// app/src/services/api.ts
const API_BASE_URL = __DEV__
  ? 'http://localhost:9000'
  : 'https://your-cloud-run-url.cloudfunctions.net';

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});
```

---

## Cost Estimate

| Component | Monthly Cost |
|-----------|--------------|
| Cloud Run (1M requests) | $8 |
| Cloud SQL (db-f1-micro) | $12 |
| Domain | $12 |
| **Total** | **~$32** |

---

## Monitoring & Logs

```bash
# View backend logs
gcloud run logs read voice-relay-backend --limit 50

# Follow logs (tail)
gcloud run logs read voice-relay-backend --limit 10 --follow

# View specific error
gcloud run logs read voice-relay-backend \
  --limit 50 \
  --filter 'severity="ERROR"'
```

---

## Troubleshooting

### 503 Service Unavailable
```bash
# Check logs
gcloud run logs read voice-relay-backend --limit 50

# Usually: database connection failed
# Fix: Verify DATABASE_URL and Cloud SQL connector
gcloud run services update voice-relay-backend \
  --add-cloudsql-instances PROJECT:REGION:voice-relay-db
```

### 401 Unauthorized
```bash
# Your GitHub OAuth credentials are wrong
# Re-check at: https://github.com/settings/developers
# Update environment variables:
gcloud run services update voice-relay-backend \
  --set-env-vars GITHUB_CLIENT_ID=new_id,GITHUB_CLIENT_SECRET=new_secret
```

### Can't connect to database
```bash
# Verify Cloud SQL instance is running
gcloud sql instances describe voice-relay-db

# Check firewall rules
gcloud sql instances describe voice-relay-db --format='value(ipv4Addresses[0].ipAddress)'

# Test connection locally
psql postgresql://voice_relay:PASSWORD@cloudsql-proxy/voice_relay
```

---

## Next Steps

### 1. Set up Monitoring
```bash
gcloud monitoring create alerts \
  --notification-channels=YOUR_CHANNEL_ID \
  --alert-strategy-auto-close=1800s
```

### 2. Enable HTTPS
```bash
# Cloud Run automatically provides HTTPS
# Just configure your domain:
gcloud run services update voice-relay-backend \
  --set-cloudsql-instances REGION:PROJECT:INSTANCE
```

### 3. Scale Settings
```bash
# Adjust auto-scaling
gcloud run services update voice-relay-backend \
  --min-instances 0 \
  --max-instances 100 \
  --memory 512Mi
```

### 4. Setup Backups
```bash
gcloud sql backups create voice-relay-backup \
  --instance voice-relay-db
```

---

## Full Documentation

For detailed information, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Need Help?

1. Check logs: `gcloud run logs read voice-relay-backend`
2. View errors: `gcloud run logs read voice-relay-backend --filter 'severity="ERROR"'`
3. Test health: `curl YOUR_API_URL/health`
4. Review DEPLOYMENT.md for advanced options

---

**Status**: Production-ready ✅

Deployed by: Claude Code
Deployment time: ~1 hour
