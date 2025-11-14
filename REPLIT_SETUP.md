# VOICE Relay - Replit Deployment (5 Minutes)

## Quick Start

### Step 1: Create Replit Account
1. Go to https://replit.com
2. Sign up with GitHub (easier, no credit card needed)
3. Click **"Create Repl"** → Select **"Python"** template
4. Name it: `voice-relay-backend`

### Step 2: Clone Repository
In Replit terminal:
```bash
git clone https://github.com/YOUR_USERNAME/voice-relay.git
cd voice-relay
```

### Step 3: Install Dependencies
```bash
pip install -r backend/requirements-prod.txt
```

### Step 4: Start Backend
Replit will auto-run based on `.replit` config:
```bash
python -m uvicorn backend.main_production:app --host 0.0.0.0 --port 8000
```

Or just press **Run** button (Replit detects `.replit` file).

### Step 5: Get Your URL
Replit gives you a public URL:
```
https://voice-relay-backend.YOUR_USERNAME.repl.co
```

### Step 6: Update Mobile App
In `app/src/services/api.ts`:
```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:9000'
  : 'https://voice-relay-backend.YOUR_USERNAME.repl.co';
```

### Step 7: Set Environment Variables (if needed)
In Replit dashboard → **Secrets** tab:
```
ENVIRONMENT=production
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
```

## Done! ✅

Your backend is now live. The URL is always-on and accessible globally.

## Optional: Add Custom Domain
In Replit → **Tools** → **Domain** (paid, optional)
