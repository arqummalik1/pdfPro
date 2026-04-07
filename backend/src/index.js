/**
 * PDFPro Backend - Main Entry Point
 * Express.js server with all PDF processing endpoints
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./utils/logger');
const { cleanupOldFiles } = require('./utils/fileCleanup');
const { isSupabaseConfigured, isSupabaseLoggingConfigured } = require('./config/supabase');
const { getVersionInfo } = require('./config/version');

const app = express();
const PORT = process.env.PORT || 10000;
const versionInfo = getVersionInfo();
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://pdf-pro-ashen.vercel.app',
  'https://mydearpdf.online',
  'https://www.mydearpdf.online',
];
const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 200),
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path.includes('/analytics/event'),
});
app.use('/api/', limiter);

// Cookie parsing (required for session auth)
app.use(cookieParser());
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: { write: message => requestLogger.info(message) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: versionInfo.version,
    release: {
      commit: versionInfo.shortCommitSha,
      buildId: versionInfo.buildId,
    },
    integrations: {
      supabasePublicClientConfigured: isSupabaseConfigured,
      supabaseLoggingConfigured: isSupabaseLoggingConfigured,
    },
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PDFPro API - Free PDF Processing',
    version: versionInfo.version,
    release: {
      commit: versionInfo.shortCommitSha,
      buildId: versionInfo.buildId,
    },
    endpoints: {
      merge: 'POST /api/v1/merge',
      split: 'POST /api/v1/split',
      compress: 'POST /api/v1/compress',
      rotate: 'POST /api/v1/rotate',
      deletePages: 'POST /api/v1/delete-pages',
      watermark: 'POST /api/v1/watermark',
      sign: 'POST /api/v1/sign',
      protect: 'POST /api/v1/protect',
      unlock: 'POST /api/v1/unlock',
    },
  });
});

// API routes
app.use('/api/v1', routes);

// Error handling
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});
app.use(errorHandler);

// File cleanup scheduler
setInterval(() => {
  cleanupOldFiles().catch(err => console.error('Cleanup error:', err));
}, 5 * 60 * 1000);

// Server startup
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  PDFPro Backend API v${versionInfo.version}                            ║
║  Running on port: ${PORT}                                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
