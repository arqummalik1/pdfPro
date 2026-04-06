# PDFPro - Render Deployment Guide
### Version 1.0 | April 2026

---

## 📋 Overview

This guide explains how to deploy the PDFPro backend API to **Render** - a free cloud platform for Node.js services.

---

## 🚀 Step 1: Prepare Your Code

Ensure your `package.json` has:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

---

## 🚀 Step 2: Push to GitHub

```bash
cd pdfpro-backend
git init
git add .
git commit -m "PDFPro backend - initial"
git remote add origin https://github.com/your-username/pdfpro-backend.git
git push -u origin main
```

---

## 🚀 Step 3: Deploy to Render

### 3.1 Create Web Service

1. Go to: https://dashboard.render.com
2. Click: **New** → **Web Service**
3. Select: `pdfpro-backend` repository

### 3.2 Configure

| Setting | Value |
|---------|-------|
| Name | `pdfpro-api` |
| Environment | Node |
| Build Command | `apt-get update && apt-get install -y ghostscript && npm install` |
| Start Command | `node src/index.js` |
| Plan | Free |

> **Note:** Ghostscript is required for PDF compression. The build command installs it on Render's Ubuntu environment.

### 3.3 Environment Variables

Add these:

```
PORT=10000
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 3.4 Deploy

Click **Create Web Service** and wait 2-5 minutes.

---

## 🔗 Step 4: Test Your API

### 4.1 Health Check

```bash
curl https://pdfpro-api.onrender.com/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-04-04T...",
  "version": "1.0.0"
}
```

### 4.2 Test Merge Endpoint

```bash
curl -X POST https://pdfpro-api.onrender.com/api/v1/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -o merged.pdf
```

---

## 📡 API Endpoints

| Tool | Endpoint | Method |
|------|----------|--------|
| Merge | `/api/v1/merge` | POST |
| Split | `/api/v1/split` | POST |
| Extract | `/api/v1/extract` | POST |
| Compress | `/api/v1/compress` | POST |
| Rotate | `/api/v1/rotate` | POST |
| Delete Pages | `/api/v1/delete-pages` | POST |
| Reorder | `/api/v1/reorder` | POST |
| Reverse | `/api/v1/reverse` | POST |
| Watermark | `/api/v1/watermark` | POST |
| Page Numbers | `/api/v1/page-numbers` | POST |
| Sign | `/api/v1/sign` | POST |
| Protect | `/api/v1/protect` | POST |
| Unlock | `/api/v1/unlock` | POST |

---

## 🔧 Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | 10000 | Server port |
| `NODE_ENV` | No | production | Environment |
| `SUPABASE_URL` | No | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | - | Public key |
| `SUPABASE_SERVICE_KEY` | No | - | Secret key |
| `ALLOWED_ORIGINS` | No | - | CORS origins |

---

## 💰 Cost (Free Tier)

| Resource | Limit |
|----------|-------|
| Web Service | 750 hours/month |
| Bandwidth | 15GB/month |
| SSL | Free |

**Total: FREE** ✅

---

## ⚠️ Important Notes

1. **Cold Starts**: Service sleeps after 15 min inactivity. First request takes ~10s.
2. **Ephemeral Disk**: Files in `/tmp` are deleted on restart.
3. **Timeout**: 30 seconds per request on free tier.

---

## ✅ Checklist

- [ ] Pushed code to GitHub
- [ ] Connected GitHub to Render
- [ ] Created Web Service
- [ ] Added environment variables
- [ ] Deployed successfully
- [ ] Tested health endpoint
- [ ] Updated Vercel CORS settings