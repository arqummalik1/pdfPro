/**
 * API Routes - Main Router
 */
const express = require('express');
const mergeRoutes = require('./merge');
const splitRoutes = require('./split');
const operationsRoutes = require('./operations');

const router = express.Router();

// Mount routes directly (not under sub-paths to avoid double-mounting)
router.use(mergeRoutes);
router.use(splitRoutes);
router.use(operationsRoutes);

module.exports = router;