# Ghostscript Installation Guide for Render
## Step-by-Step for Existing Production Backend

This guide helps you add Ghostscript to your **already deployed** Render backend so PDF compression works properly (50-90% size reduction).

---

## What You Need
- Your backend is already on Render.com
- Access to Render Dashboard
- 5 minutes of your time

---

## Step 1: Go to Render Dashboard

1. Open browser and go to: **https://dashboard.render.com**
2. Log in with your account
3. Find your backend service (probably named `pdfpro-api` or similar)
4. Click on it to open settings

---

## Step 2: Update Build Command

1. In your service dashboard, click **"Settings"** tab (left sidebar)
2. Scroll down to **"Build Command"** section
3. You'll see current build command (probably `npm install`)
4. **Replace it with this:**

```bash
apt-get update && apt-get install -y ghostscript && npm install
```

**What this does:**
- `apt-get update` - Updates package list
- `apt-get install -y ghostscript` - Installs Ghostscript tool
- `npm install` - Installs your Node.js packages

5. Click **"Save Changes"** button

---

## Step 3: Deploy the Changes

1. Go to **"Manual Deploy"** button (top right of dashboard)
2. Select **"Deploy latest commit"**
3. Wait 3-5 minutes for build to complete
4. Check the logs - you should see Ghostscript installing (green text)

---

## Step 4: Test Compression

After deployment is complete (green checkmark), test if compression works:

```bash
# Test using curl (in your terminal)
curl -X POST https://your-backend-url.onrender.com/api/v1/compress \
  -F "file=@your-test-file.pdf" \
  -F "level=medium" \
  -o compressed.pdf
```

**Or test via your website:**
1. Go to your live site
2. Upload a PDF with images
3. Select "Compress PDF" tool
4. Choose "Medium" compression
5. Download and check file size - should be 50-70% smaller

---

## Troubleshooting

### If build fails:
- Check Render logs for red error messages
- Common fix: Make sure you have space before `&&` in build command

### If compression still doesn't work:
1. Check Render logs when compressing a PDF
2. Look for line: `[Compress] method=ghostscript` (good) or `method=structural` (not working)
3. If you see `Ghostscript not available`, the install failed

### Quick fix - Redeploy:
1. Go to Manual Deploy → Clear Build Cache & Deploy
2. Wait for fresh build

---

## Done! ✅

Your PDF compression should now achieve 50-90% size reduction on image-heavy PDFs.

---

## FAQ

**Q: Will this break my existing backend?**
A: No. We're only adding a tool (Ghostscript). Your existing code stays the same.

**Q: Does this cost extra?**
A: No. Still on Render's free tier.

**Q: What if I don't install Ghostscript?**
A: Compression will use fallback method (only 0-15% reduction).

**Q: How do I know it's working?**
A: Check your server logs - you should see: `method=ghostscript, reduction=50%+`
