/**
 * Admin Authentication Middleware - Simplified PIN-based auth
 * 6-digit PIN with rate limiting (3 attempts = 2 hour lock)
 */

const crypto = require('crypto');

// Session storage
const sessions = new Map();
const SESSION_COOKIE_NAME = 'pdfpro_admin_session';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

// Rate limiting storage
const failedAttempts = new Map(); // ip -> { count, lockedUntil }
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Hash PIN using SHA-256
 */
function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

/**
 * Generate session token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get client IP
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         'unknown';
}

/**
 * Check if IP is locked out
 */
function isLockedOut(ip) {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return true;
  }
  
  // Reset if lock expired
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    failedAttempts.delete(ip);
  }
  
  return false;
}

/**
 * Record failed attempt
 */
function recordFailedAttempt(ip) {
  const record = failedAttempts.get(ip) || { count: 0 };
  record.count += 1;
  
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  
  failedAttempts.set(ip, record);
  return record;
}

/**
 * Clear failed attempts on success
 */
function clearFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

/**
 * Verify PIN
 */
function verifyPin(pin) {
  const adminPin = process.env.ADMIN_PIN?.trim();
  if (!adminPin) return false;
  
  // Support both plain PIN and hashed PIN in env
  const providedHash = hashPin(pin);
  return pin === adminPin || providedHash === adminPin;
}

/**
 * Check if auth is configured
 */
function isAdminAuthConfigured() {
  return !!(process.env.ADMIN_PIN);
}

/**
 * Express middleware to protect routes
 */
function requireAdminAuth(req, res, next) {
  // If auth not configured, allow access (for local dev convenience)
  if (!isAdminAuthConfigured()) {
    return next();
  }
  
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  
  if (!sessionToken || !sessions.has(sessionToken)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  const session = sessions.get(sessionToken);
  
  // Check session expiry
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionToken);
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please login again.',
      code: 'SESSION_EXPIRED'
    });
  }
  
  // Extend session on activity
  session.expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  sessions.set(sessionToken, session);
  
  req.adminSession = session;
  next();
}

/**
 * Login handler - PIN only
 */
function handleLogin(req, res) {
  const { pin } = req.body || {};
  const ip = getClientIp(req);
  
  // Check lockout
  if (isLockedOut(ip)) {
    const record = failedAttempts.get(ip);
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many failed attempts. Locked for ${minutesLeft} more minutes.`,
      code: 'RATE_LIMITED',
      locked: true,
      retryAfter: minutesLeft
    });
  }
  
  if (!pin || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 6-digit PIN'
    });
  }
  
  if (!verifyPin(pin)) {
    const record = recordFailedAttempt(ip);
    const attemptsLeft = MAX_ATTEMPTS - record.count;
    
    if (record.lockedUntil) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Locked for 2 hours.',
        code: 'RATE_LIMITED',
        locked: true,
        retryAfter: 120
      });
    }
    
    return res.status(401).json({
      success: false,
      message: `Invalid PIN. ${attemptsLeft} attempts remaining.`,
      attemptsLeft
    });
  }
  
  // Success - clear failed attempts
  clearFailedAttempts(ip);
  
  const token = generateSessionToken();
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  
  sessions.set(token, {
    createdAt: Date.now(),
    expiresAt
  });
  
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/'
  });
  
  return res.json({
    success: true,
    message: 'Login successful'
  });
}

/**
 * Logout handler
 */
function handleLogout(req, res) {
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  
  if (sessionToken) {
    sessions.delete(sessionToken);
  }
  
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  
  return res.json({
    success: true,
    message: 'Logout successful'
  });
}

/**
 * Check auth status handler
 */
function handleAuthStatus(req, res) {
  const ip = getClientIp(req);
  
  if (!isAdminAuthConfigured()) {
    return res.json({
      success: true,
      authenticated: true,
      authConfigured: false,
      message: 'Auth not configured - access allowed'
    });
  }
  
  const locked = isLockedOut(ip);
  const record = failedAttempts.get(ip);
  
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  const session = sessionToken ? sessions.get(sessionToken) : null;
  
  if (session && Date.now() <= session.expiresAt) {
    return res.json({
      success: true,
      authenticated: true,
      authConfigured: true,
      locked: false
    });
  }
  
  return res.json({
    success: true,
    authenticated: false,
    authConfigured: true,
    locked,
    retryAfter: locked ? Math.ceil((record.lockedUntil - Date.now()) / 60000) : 0
  });
}

module.exports = {
  requireAdminAuth,
  handleLogin,
  handleLogout,
  handleAuthStatus,
  isAdminAuthConfigured,
  hashPin
};
