/**
 * API Routes - Merge PDF
 */
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { mergePdfs } = require('../services/pdfMerger');
const { logActivity } = require('../config/supabase');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 30 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'), false);
  },
});

router.post('/merge', upload.array('files', 30), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ success: false, message: 'Upload at least 2 PDF files' });
    }
    const pdfBuffers = req.files.map(f => f.buffer);
    const merged = await mergePdfs(pdfBuffers);
    await logActivity({ tool_used: 'merge', input_files: req.files.length, input_size: pdfBuffers.reduce((a, b) => a + b.length, 0), output_size: merged.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="merged-${uuidv4()}.pdf"`);
    res.send(merged);
  } catch (error) {
    await logActivity({ tool_used: 'merge', status: 'error', error_message: error.message, ip_address: req.ip });
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;