# PDFPro

A modern, full-stack PDF processing platform with 31+ tools for organizing, converting, editing, and securing PDF files. Built with Next.js 16, React 19, Express.js, and Tailwind CSS.

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-black)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Express.js%204-green)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

### 31+ PDF Tools Across 6 Categories

| Category | Tools | Status |
|----------|-------|--------|
| **Organize PDF** | Merge, Split, Compress, Organize Pages, Extract Pages, Delete Pages | 10 E2E Working |
| **Convert from PDF** | PDF to Word, Excel, PowerPoint, JPG, Text, HTML | UI Ready |
| **Convert to PDF** | Word, Excel, PowerPoint, JPG, HTML to PDF | UI Ready |
| **Edit PDF** | Rotate, Add Text, Add Image, Watermark, Page Numbers, Crop, Highlight | 4 E2E Working |
| **Security & Sign** | Protect, Unlock, Sign, Fill Form, Redact | 2 E2E Working |
| **OCR & Accessibility** | OCR, Grayscale | UI Ready |

### Key Features

- **No signup required** - Use all tools immediately
- **No watermarks** - Clean output files
- **Privacy-focused** - Files processed securely, auto-deleted after processing
- **Mobile responsive** - Works seamlessly on all devices
- **SEO optimized** - High-ranking keywords, structured data, sitemaps
- **Analytics dashboard** - Built-in usage analytics and insights

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.2.2 (App Router)
- **UI Library**: React 19.2.4
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5
- **Icons**: Lucide React
- **Font**: Geist (Vercel)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **PDF Processing**: pdf-lib 1.17.1
- **Image Processing**: Sharp 0.33.2
- **File Uploads**: Multer
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston + Morgan
- **Analytics**: Supabase (optional)

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: Supabase (for analytics)
- **File Storage**: Local (with auto-cleanup)

---

## Project Structure

```
pdfpro/
├── src/                          # Frontend (Next.js)
│   ├── app/                      # App Router pages
│   │   ├── [toolId]/             # Dynamic tool pages
│   │   ├── dashboard/            # Analytics dashboard
│   │   ├── page.tsx              # Homepage
│   │   ├── layout.tsx            # Root layout
│   │   ├── sitemap.ts            # SEO sitemap
│   │   └── robots.ts             # SEO robots.txt
│   ├── components/               # React components
│   │   ├── ToolUploader.tsx      # Main tool interface
│   │   ├── ToolInterface.tsx     # Tool-specific controls
│   │   ├── AnalyticsDashboard.tsx # Analytics UI
│   │   └── ...
│   └── lib/                      # Utilities
│       ├── tools-config.ts       # Tool registry (31 tools)
│       ├── api.ts                # API client
│       ├── analytics.ts          # Analytics tracking
│       ├── seo.ts                # SEO utilities
│       └── theme.ts              # Theme configuration
├── backend/                      # Backend (Express.js)
│   ├── src/
│   │   ├── index.js              # Server entry point
│   │   ├── routes/               # API routes
│   │   │   ├── index.js          # Route aggregator
│   │   │   ├── operations.js     # PDF operations (11 endpoints)
│   │   │   ├── analytics.js      # Analytics endpoints
│   │   │   └── ...
│   │   ├── services/             # PDF processing services
│   │   │   ├── pdfMerger.js
│   │   │   ├── pdfSplitter.js
│   │   │   ├── pdfCompressor.js
│   │   │   ├── pdfWatermarker.js
│   │   │   ├── pdfSigner.js
│   │   │   └── ...
│   │   ├── middleware/           # Express middleware
│   │   ├── utils/                # Backend utilities
│   │   └── config/               # Configuration
│   └── package.json
├── public/                       # Static assets
├── package.json                  # Frontend dependencies
├── next.config.ts               # Next.js configuration
└── ...
```

---

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/pdfpro.git
cd pdfpro
npm install
cd backend && npm install && cd ..
```

### 2. Environment Setup

Create a `.env.local` file in the root:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:10000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Create a `.env` file in `backend/`:

```env
PORT=10000
NODE_ENV=development

# CORS - comma separated origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: Supabase for analytics logging
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Optional: Build metadata
COMMIT_SHA=dev
BUILD_ID=local
```

### 3. Run Development Servers

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:10000
- API Health: http://localhost:10000/health

---

## API Documentation

### Base URL
```
Production: https://your-backend-domain.com/api/v1
Local: http://localhost:10000/api/v1
```

### Endpoints

#### PDF Operations

| Method | Endpoint | Description | Working |
|--------|----------|-------------|---------|
| POST | `/merge` | Merge multiple PDFs | ✅ |
| POST | `/split` | Split PDF by ranges | ✅ |
| POST | `/compress` | Compress PDF file | ✅ |
| POST | `/extract` | Extract specific pages | ✅ |
| POST | `/delete-pages` | Delete pages from PDF | ✅ |
| POST | `/reorder` | Reorder PDF pages | ✅ |
| POST | `/rotate` | Rotate pages (90/180/270°) | ✅ |
| POST | `/watermark` | Add text/image watermark | ✅ |
| POST | `/page-numbers` | Add page numbering | ✅ |
| POST | `/sign` | Sign PDF with drawn/typed signature | ✅ |
| POST | `/unlock` | Remove PDF password | ✅ |
| POST | `/protect` | Add password protection | ✅ Backend |

#### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analytics/event` | Track client events |
| GET | `/analytics/dashboard` | Get analytics summary |

#### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check & status |
| GET | `/` | API info & endpoints list |

### Request/Response Examples

#### Merge PDFs
```bash
curl -X POST http://localhost:10000/api/v1/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -o merged.pdf
```

#### Compress PDF
```bash
curl -X POST http://localhost:10000/api/v1/compress \
  -F "pdf=@document.pdf" \
  -F "quality=medium" \
  -o compressed.pdf
```

#### Sign PDF
```bash
curl -X POST http://localhost:10000/api/v1/sign \
  -F "pdf=@document.pdf" \
  -F "signatureImage=@signature.png" \
  -F "page=1" \
  -F "x=100" \
  -F "y=100" \
  -o signed.pdf
```

---

## Deployment

### Frontend (Vercel)

```bash
# Using Vercel CLI
npm i -g vercel
vercel login
vercel

# Or push to GitHub and import via Vercel Dashboard
```

**Vercel Settings:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Environment Variables: Add `NEXT_PUBLIC_API_URL`

### Backend (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `NODE_ENV=production`
   - **Add env vars**: `ALLOWED_ORIGINS`, `SUPABASE_URL` (optional)

### Database (Supabase) - Optional

For analytics persistence:

1. Create project on [Supabase](https://supabase.com)
2. Run the SQL schema from `backend/sql/metabase_dashboard.sql`
3. Add credentials to backend environment

---

## Working Tools (10 End-to-End)

These tools are fully functional across frontend, backend, and API:

1. **Merge PDF** - Combine multiple files into one
2. **Split PDF** - Divide by page ranges
3. **Compress PDF** - Reduce file size with quality options
4. **Extract Pages** - Pull specific pages to new PDF
5. **Delete Pages** - Remove unwanted pages
6. **Rotate PDF** - Rotate pages 90/180/270 degrees
7. **Watermark PDF** - Add text or image watermarks
8. **Page Numbers** - Add customizable page numbering
9. **Sign PDF** - Draw or type signatures
10. **Unlock PDF** - Remove password protection

---

## Analytics Dashboard

Access at `/dashboard` to view:

- **Visitor metrics** - Unique visitors, page views
- **Tool popularity** - Most used PDF tools
- **Success rates** - Tool success/failure ratios
- **Downloads** - Total PDF downloads
- **Daily trends** - Usage over time

Requires Supabase configuration for data persistence.

---

## SEO & Marketing

### Implemented SEO Features

- **Dynamic sitemap** - Auto-generated from tool registry
- **Structured data** - JSON-LD for rich snippets
- **Meta tags** - Optimized titles, descriptions per tool
- **Canonical URLs** - Prevent duplicate content
- **Keywords targeting** - High-volume search terms ("merge pdf", "compress pdf", etc.)

### Top Target Keywords

| Keyword | Volume |
|---------|--------|
| merge pdf online free | 110,000 |
| compress pdf | 90,000 |
| convert pdf to word | 80,000 |
| word to pdf | 60,000 |
| split pdf online | 45,000 |
| remove pdf password | 40,000 |

---

## Development

### Available Scripts

**Frontend:**
```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

**Backend:**
```bash
cd backend
npm run dev      # Start with watch mode (port 10000)
npm run start    # Start production
npm run build    # No-op (no build needed)
npm test         # Run tests with coverage
```

### Adding a New Tool

1. **Add to registry** (`src/lib/tools-config.ts`):
```typescript
{
  id: 'my-new-tool',
  label: 'My New Tool',
  description: 'What it does',
  keywords: ['keyword1', 'keyword2'],
  category: 'edit',
  icon: 'tool',
  color: '#E53935',
  popularity: 5
}
```

2. **Create backend service** (`backend/src/services/`)

3. **Add API route** (`backend/src/routes/operations.js`)

4. **Add frontend handler** (`src/components/ToolUploader.tsx`)

---

## Security

- **Helmet.js** - Security headers
- **Rate limiting** - 100 requests per 15 minutes per IP
- **CORS** - Whitelist-based origin control
- **File validation** - Type and size restrictions
- **Auto-cleanup** - Temporary files deleted every 5 minutes
- **Password protection** - PDF encryption support

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
npm run dev -- -p 3001
```

**npm install fails:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Build errors:**
```bash
rm -rf .next
npm run build
```

**Backend CORS issues:**
- Check `ALLOWED_ORIGINS` includes your frontend URL
- Verify no trailing slashes in origins

---

## Cost Estimation

| Service | Free Tier | Paid Start |
|---------|-----------|------------|
| Vercel | 100GB bandwidth | $20/mo |
| Render | 750 hours/mo | $5/mo |
| Supabase | 500MB database | $25/mo |

**Minimum viable cost: $0-10/month**

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

---

## License

MIT License - see LICENSE file for details.

---

## Links

- **Live Demo**: [https://pdf-pro-ashen.vercel.app](https://pdf-pro-ashen.vercel.app)
- **Backend Health**: [https://pdfpro-s8il.onrender.com/health](https://pdfpro-s8il.onrender.com/health)
- **Issues**: [GitHub Issues](https://github.com/yourusername/pdfpro/issues)

---

## Support

For questions or issues:
- Open a [GitHub Issue](https://github.com/yourusername/pdfpro/issues)
- Email: support@example.com

---

<p align="center">Built with Next.js + Express.js + pdf-lib</p>
