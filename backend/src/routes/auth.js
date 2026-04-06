/**
 * API Routes - Admin Authentication
 */
const express = require('express');
const { handleLogin, handleLogout, handleAuthStatus, requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Public auth endpoints
router.post('/auth/login', handleLogin);
router.post('/auth/logout', handleLogout);
router.get('/auth/status', handleAuthStatus);

// Protected test endpoint
router.get('/auth/verify', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Authenticated',
    username: req.adminSession?.username
  });
});

module.exports = router;
