# VOICE Relay - Deployment Guide

**North Star**: Be the fastest, simplest, and most secure relay for voice conversation.

**Deployment Philosophy**: Minimal infrastructure, maximum reliability.

---

## Quick Start Deployment

This guide covers deploying VOICE Relay to production with **zero bloat**.

### Prerequisites

- Google Cloud Platform account (or similar)
- Docker (optional, but recommended)
- Python 3.10+
- GitHub OAuth app credentials
- Firebase Cloud Messaging setup (for push notifications)

---

## Architecture

```
┌─────────────────┐
│  Mobile App     │  (React Native)
│  (iOS/Android)  │  → Encrypted prompts only
└────────┬────────┘
         │ HTTPS (E2EE)
         ▼
┌──────────────────────┐
│  Cloud Relay         │  (FastAPI)
│  - GET  /auth/get-public-key
│  - POST /agent/ask
│  - POST /reply (for agent responses)
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Persistent Storage  │  (PostgreSQL)
│  - Users
│  - Messages (encrypted)
│  - Message Queue
└──────────────────────┘
```

**Key Property**: Server NEVER sees plaintext. All encryption happens on device.

---

## Option A: Deploy to Google Cloud Run (Recommended)

### Why Cloud Run?
- Stateless (perfect for our architecture)
- Pay-per-request (cheap)
- Auto-scaling
- Zero infrastructure management
- Minimal setup

### Step 1: Prepare Backend for Deployment

```bash
cd backend

# Create .env.production
cat > .env.production << 'EOF'
DATABASE_URL=postgresql://user:password@cloudsql-proxy/voice_relay
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
EOF

# Create requirements-prod.txt
cat > requirements-prod.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
httpx==0.25.1
cryptography==41.0.7
google-cloud-firestore==2.13.0
firebase-admin==6.2.0
EOF

# Test production requirements
pip install -r requirements-prod.txt
```

### Step 2: Create Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements-prod.txt .
RUN pip install -r requirements-prod.txt
COPY main.py .

# Set production environment
ENV ENVIRONMENT=production
ENV PORT=8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 3: Deploy to Cloud Run

```bash
# Build and push to Google Cloud Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/voice-relay-backend

# Deploy
gcloud run deploy voice-relay-backend \
  --image gcr.io/PROJECT_ID/voice-relay-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=$DATABASE_URL,GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID

# Get the service URL
gcloud run services describe voice-relay-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

---

## Option B: Deploy to Your Own Server

### Simple Option: Single VPS

**Recommended**: DigitalOcean Droplet ($6/month) or Linode ($5/month)

```bash
# On your server:
sudo apt-get update
sudo apt-get install -y python3.11 python3-pip postgresql

# Clone repo
git clone https://github.com/YOUR_REPO/voice-relay.git
cd voice-relay/backend

# Install dependencies
pip install -r requirements-prod.txt

# Set up PostgreSQL
sudo -u postgres createdb voice_relay
sudo -u postgres createuser voice_relay
sudo -u postgres psql -c "ALTER USER voice_relay WITH PASSWORD 'strong_password';"

# Start with systemd
sudo tee /etc/systemd/system/voice-relay.service << 'EOF'
[Unit]
Description=VOICE Relay Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/voice-relay/backend
Environment="DATABASE_URL=postgresql://voice_relay:password@localhost/voice_relay"
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable voice-relay
sudo systemctl start voice-relay

# Reverse proxy with nginx
sudo apt-get install -y nginx
sudo tee /etc/nginx/sites-available/voice-relay << 'EOF'
server {
    listen 80;
    server_name api.voice-relay.app;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/voice-relay /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Add HTTPS with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.voice-relay.app
```

---

## Production Backend Setup

### 1. Update main.py for Production

```python
# backend/main.py
import os
from dotenv import load_dotenv

load_dotenv('.env.production')

DATABASE_URL = os.getenv('DATABASE_URL')
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# Use real database instead of in-memory
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Real authentication with GitHub
async def verify_github_token_production(token: str) -> str:
    """Verify with actual GitHub API"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            'https://api.github.com/user',
            headers={'Authorization': f'Bearer {token}'}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid GitHub token")
        user_data = response.json()
        return user_data['login']

# Enable CORS for your domain
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.voice-relay.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Database Schema

```sql
-- Initialize PostgreSQL
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    encrypted_blob TEXT NOT NULL,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE INDEX idx_user_id ON messages(user_id);
CREATE INDEX idx_created_at ON messages(created_at DESC);
```

### 3. Push Notifications (Firebase Cloud Messaging)

```python
# backend/notifications.py
import firebase_admin
from firebase_admin import credentials, messaging

cred = credentials.Certificate('firebase-key.json')
firebase_admin.initialize_app(cred)

async def send_push_notification(user_id: str, message: str):
    """Send push notification via FCM"""
    # Lookup user's device tokens from database
    device_tokens = db.query(UserDevice).filter(
        UserDevice.user_id == user_id
    ).all()

    if not device_tokens:
        return

    message = messaging.MulticastMessage(
        notification=messaging.Notification(
            title="New Prompt",
            body=message[:100]
        ),
        tokens=[dt.fcm_token for dt in device_tokens]
    )

    response = messaging.send_multicast(message)
    print(f'Successfully sent {response.success_count} messages')
```

---

## Mobile App Configuration

### 1. Update API Endpoint

```typescript
// app/src/services/api.ts
const API_BASE_URL = __DEV__
  ? 'http://localhost:9000'
  : 'https://api.voice-relay.app';

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});
```

### 2. Build for Android

```bash
cd app

# For development build
npm run android

# For production release build
cd android
./gradlew assembleRelease

# APK location: app/android/app/build/outputs/apk/release/app-release.apk
# Upload to Google Play Store Developer Console
```

### 3. Build for iOS

```bash
cd app

# For development
npm run ios

# For production build
cd ios
xcodebuild -scheme VoiceRelay -configuration Release

# IPA location: ~/Library/Developer/Xcode/Archives/
# Upload to App Store Connect
```

---

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: VOICE Relay
   - **Homepage URL**: https://voice-relay.app
   - **Authorization callback URL**: https://api.voice-relay.app/auth/callback

4. Copy `Client ID` and `Client Secret`

### 2. Update Backend

```python
# backend/main.py
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')

@app.post("/auth/github-callback")
async def github_callback(code: str):
    """Exchange GitHub code for token"""
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        response = await client.post(
            'https://github.com/login/oauth/access_token',
            data={
                'client_id': GITHUB_CLIENT_ID,
                'client_secret': GITHUB_CLIENT_SECRET,
                'code': code,
            },
            headers={'Accept': 'application/json'}
        )
        token_data = response.json()
        return {'access_token': token_data['access_token']}
```

---

## Monitoring & Logging

### 1. Application Logging

```python
# backend/main.py
import logging
import json
from pythonjsonlogger import jsonlogger

# JSON logging for Cloud Logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)
```

### 2. Error Tracking (Sentry)

```bash
pip install sentry-sdk
```

```python
import sentry_sdk

sentry_sdk.init(
    dsn="https://your-sentry-dsn@sentry.io/project",
    environment="production",
    traces_sample_rate=0.1
)
```

### 3. Health Checks

```python
@app.get("/health")
async def health():
    """Liveness check for Kubernetes/Cloud Run"""
    return {"status": "ok"}

@app.get("/ready")
async def ready():
    """Readiness check - verify DB connection"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database not ready")
```

---

## Security Checklist

- [ ] HTTPS/TLS enabled on all endpoints
- [ ] CORS configured for your domain only
- [ ] Database connection uses SSL
- [ ] Environment variables for all secrets (no hardcoded values)
- [ ] Rate limiting enabled on auth endpoints
- [ ] Input validation on all endpoints
- [ ] Logging does NOT include plaintext messages
- [ ] Database backups enabled
- [ ] Monitoring and alerting set up

---

## Cost Estimate (Monthly)

| Component | Option A (Cloud Run) | Option B (VPS) |
|-----------|----------------------|----------------|
| Compute | $0-50 (pay-per-request) | $6-30 |
| Database | $15-50 | $10-20 |
| Domain | $12-15 | $12-15 |
| **Total** | **$27-115** | **$28-65** |

---

## Rollout Plan

### Week 1: Internal Testing
```
1. Deploy to staging environment
2. Test with internal users
3. Verify E2EE encryption works
4. Load test (100 concurrent users)
```

### Week 2: Beta Release
```
1. Deploy to production
2. Announce beta to 100 users
3. Monitor error rates and performance
4. Gather feedback
```

### Week 3+: Full Launch
```
1. Scale infrastructure if needed
2. Marketing push
3. Continuous monitoring
4. Monthly cost review
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
gcloud run logs read voice-relay-backend --limit 50

# Or on VPS
journalctl -u voice-relay -f
```

### Database connection failed
```bash
# Verify DATABASE_URL is set correctly
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### HTTPS certificate issue
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Check certificate expiry
openssl s_client -connect api.voice-relay.app:443 -showcerts
```

---

## Next Steps

1. **Choose deployment option** (Cloud Run or VPS)
2. **Set up database** (PostgreSQL)
3. **Configure GitHub OAuth**
4. **Update backend for production**
5. **Deploy and test**
6. **Build and publish mobile apps**
7. **Set up monitoring and alerts**

---

**Status**: Ready for deployment

**North Star Check**:
- ✅ Simple architecture (no unnecessary complexity)
- ✅ Fast deployment process
- ✅ Secure by design (E2EE throughout)
- ✅ Minimal infrastructure footprint
- ✅ Cost-effective options provided
