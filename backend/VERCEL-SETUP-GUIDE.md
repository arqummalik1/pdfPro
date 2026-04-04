# PDFPro - Vercel Frontend Deployment Guide
### Version 1.0 | April 2026

---

## 📋 Overview

This guide explains how to deploy the PDFPro frontend (Next.js) to **Vercel**.

---

## 🚀 Step 1: Update Environment Variables

In your Next.js project, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🚀 Step 2: Update API Calls

In your tool pages, update the API URL:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pdfpro-api.onrender.com';

async function processPdf(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/api/v1/merge`, {
    method: 'POST',
    body: formData,
  });
  
  return response.blob();
}
```

---

## 🚀 Step 3: Push to GitHub

```bash
cd propdf
git add .
git commit -m "PDFPro frontend - initial"
git push origin main
```

---

## 🚀 Step 4: Deploy to Vercel

### 4.1 Connect to Vercel

1. Go to: https://vercel.com
2. Click: **Add New** → **Project**
3. Select: `propdf` repository

### 4.2 Configure

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `next build` |
| Output Directory | `.next` |

### 4.3 Environment Variables

Add these:

```
NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4.4 Deploy

Click **Deploy** and wait 2-5 minutes.

---

## 🔗 Step 5: Connect Backend

Add your Vercel URL to Render's `ALLOWED_ORIGINS`:

1. Go to: Render Dashboard → Your Service → Environment
2. Update: `ALLOWED_ORIGINS=https://propdf.vercel.app,http://localhost:3000`

---

## 💰 Cost (Free Tier)

| Resource | Limit |
|----------|-------|
| Bandwidth | 100GB/month |
| Serverless Functions | 100 hours/month |
| Build Minutes | 6,000 min/month |

**Total: FREE** ✅

---

## ✅ Checklist

- [ ] Updated environment variables
- [ ] Pushed code to GitHub
- [ ] Connected GitHub to Vercel
- [ ] Added environment variables
- [ ] Deployed successfully
- [ ] Tested with a PDF
- [ ] Updated Render CORS