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
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./utils/logger');
const { cleanupOldFiles } = require('./utils/fileCleanup');
const { isSupabaseConfigured, isSupabaseLoggingConfigured } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 10000;

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
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 
    ['http://localhost:3000', 'http://localhost:3001', 'https://pdf-pro-ashen.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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
    version: '1.0.0',
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
    version: '1.0.0',
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
║  PDFPro Backend API v1.0.0                               ║
║  Running on port: ${PORT}                                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
