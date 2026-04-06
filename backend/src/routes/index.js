/**
 * API Routes - Main Router
 */
const express = require('express');
const mergeRoutes = require('./merge');
const splitRoutes = require('./split');
const operationsRoutes = require('./operations');
const analyticsRoutes = require('./analytics');

const authRoutes = require('./auth');
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Mount auth routes (public)
router.use(authRoutes);

// Mount analytics routes - but protect the dashboard endpoint specifically in the route file
router.use(analyticsRoutes);

// Mount other routes
router.use(mergeRoutes);
router.use(splitRoutes);
router.use(operationsRoutes);

module.exports = router;
