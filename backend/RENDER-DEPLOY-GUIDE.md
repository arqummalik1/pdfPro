# Render Deployment Guide - Multi-Engine PDF Compression

## Quick Setup (3 Steps)

### Step 1: Push Code to GitHub

```bash
cd "/Users/arqummalik/Software Development/propdf/backend"
git add .
git commit -m "Add multi-engine PDF compression (pdf-lib + qpdf + pdfcpu + sharp)"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect your GitHub repository (pdfpro-backend)

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Name** | `pdfpro-api` |
| **Environment** | Node |
| **Build Command** | `apt-get update && apt-get install -y qpdf && wget -q https://github.com/pdfcpu/pdfcpu/releases/latest/download/pdfcpu_linux_amd64.tar.gz && tar -xzf pdfcpu_linux_amd64.tar.gz && npm install; npm run build` |
| **Start Command** | `node src/index.js` |
| **Plan** | Free |

**Environment Variables:**
```
PORT=10000
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
PDFCPU_PATH=./pdfcpu
QPDF_PATH=qpdf
```

Click **Create Web Service** and wait 3-5 minutes.

---

## Test Your Deployment

### Test Health Check
```bash
curl https://pdfpro-api.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "version": "1.0.0"
}
```

### Test Compression
```bash
curl -X POST https://pdfpro-api.onrender.com/api/v1/compress \
  -F "file=@test.pdf" \
  -F "level=high" \
  -o compressed.pdf
```

Check response headers:
```bash
curl -I -X POST https://pdfpro-api.onrender.com/api/v1/compress \
  -F "file=@test.pdf" \
  -F "level=high"
```

Look for these headers:
- `X-Original-Size: 1048576`
- `X-Compressed-Size: 524288`
- `X-Reduction-Percent: 50.0`
- `X-Engines-Used: pdf-lib,qpdf,pdfcpu,sharp`
- `X-PDF-Type: image-heavy`

---

## What's Installed on Render

The build command installs:

1. **qpdf** (via apt-get) - Structural PDF optimization
2. **pdfcpu** (binary download) - Advanced PDF compression
3. **Node dependencies** (npm install):
   - pdf-lib - Base PDF manipulation
   - sharp - Image compression
   - express, multer, etc.

---

## Compression Levels Explained

| Level | Engines | Best For | Expected Reduction |
|-------|---------|----------|-------------------|
| **Low** | pdf-lib | Text documents | 10-20% |
| **Medium** | pdf-lib + qpdf | General use | 30-50% |
| **High** | pdf-lib + qpdf + pdfcpu + sharp | Image-heavy PDFs | 50-70% |

---

## Troubleshooting

### Build Fails
- Check that `npm run build` runs successfully locally
- Verify qpdf installs: `apt-get install -y qpdf` works on Ubuntu (Render uses Ubuntu)

### Compression Returns 0% Reduction
- This is normal for already-optimized PDFs
- Try "high" level for better results
- Check `X-PDF-Type` header - text-only PDFs compress less

### 504 Gateway Timeout
- Free tier has 30-second timeout
- Use "low" or "medium" for large files (>10MB)
- Consider upgrading to paid tier for large files

### Engines Not Working
- Check headers: `X-Engines-Used` should list working engines
- If qpdf/pdfcpu missing, they'll be skipped automatically
- pdf-lib + sharp always work (pure Node.js)

---

## Update Frontend API URL

In your frontend `.env` or `src/lib/api.ts`:

```javascript
const API_BASE_URL = 'https://pdfpro-api.onrender.com/api/v1';
```

Deploy frontend to Vercel with updated API URL.

---

## Done!

Your multi-engine PDF compression is now live on Render with:
- 4 compression engines (pdf-lib, qpdf, pdfcpu, sharp)
- 3 compression levels (low, medium, high)
- Full stats in response headers
- Automatic fallback if engines fail
