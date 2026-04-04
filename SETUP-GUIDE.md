# PDFPro - Setup Guide

## 📦 Quick Start

### Download & Extract
- Download: `propdf.zip`
- Extract to folder

### Install Dependencies
```bash
cd propdf
npm install
```

### Run Development Server
```bash
npm run dev
```

### Open Browser
Go to: http://localhost:3000

---

## 🚀 Features Implemented

### ✅ Homepage
- Hero section with search
- Top 6 popular tools
- All tools organized by category
- Trust signals (no signup, no watermark, secure)
- Clean modern UI with red accent

### ✅ Tool Pages (Dynamic)
- Each tool has its own page: `/merge-pdf`, `/split-pdf`, etc.
- SEO metadata (title, description, keywords)
- Unified layout with upload area
- How-to steps
- Related tools section
- Static generation for all tools

### ✅ Tools Registry
- 30+ tools configured
- Organized by category
- Search volume data for SEO

---

## 📁 Project Structure

```
propdf/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Homepage
│   │   └── [toolId]/page.tsx # Tool page template
│   ├── lib/
│   │   ├── theme.ts          # Theme configuration
│   │   └── tools-config.ts   # Master tool registry
│   └── components/           # UI components
├── package.json
└── README.md
```

---

## 🎨 Theme

- **Primary Color:** Red (#E53935) - to compete with iLovePDF
- **Background:** White/Light Gray
- **Font:** Inter (system font)

---

## 📝 Add More Tools

1. Edit `src/lib/tools-config.ts`
2. Add tool to appropriate category
3. Create API route in `src/app/api/[tool]/route.ts`

---

## 🔧 Environment

- Node.js 18+
- Next.js 14+
- Tailwind CSS

---

## 📄 License

MIT