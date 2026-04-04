# PDFPro Backend

Free PDF Processing API built with Node.js, Express, and pdf-lib.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd pdfpro-backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Run Locally
```bash
npm run dev
```

Server runs on: http://localhost:10000

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

## 📦 Deployment Guides

See these guides for deployment:

- **RENDER-SETUP-GUIDE.md** - Deploy backend to Render
- **SUPABASE-SETUP-GUIDE.md** - Set up database & auth
- **VERCEL-SETUP-GUIDE.md** - Deploy frontend to Vercel

---

## 🛠️ Tech Stack

- Node.js + Express
- pdf-lib for PDF processing
- Supabase for database & auth
- Render for hosting

---

## 💰 Cost

All free! See deployment guides for free tier limits.

---

## 📄 License

MIT