/**
 * API Routes - Split PDF
 */
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { splitPdfToPages, splitPdfByRanges, splitPdfEveryN, extractPages } = require('../services/pdfSplitter');
const { logActivity } = require('../config/supabase');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF'), false)) });

router.post('/split', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF file' });
    const { mode = 'ranges', ranges, pagesPerFile } = req.body;
    let result;
    if (mode === 'pages') result = await splitPdfToPages(req.file.buffer);
    else if (mode === 'every-n') { const n = parseInt(pagesPerFile) || 1; result = await splitPdfEveryN(req.file.buffer, n); }
    else { const parsedRanges = ranges ? JSON.parse(ranges) : [{start: 1, end: 1}]; result = await splitPdfByRanges(req.file.buffer, parsedRanges); }
    await logActivity({ tool_used: 'split', input_size: req.file.buffer.length, output_size: result.reduce((a, b) => a + b.length, 0), processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.json({ success: true, files: result.map(b => ({ buffer: b.toString('base64') })) });
  } catch (error) {
    await logActivity({ tool_used: 'split', status: 'error', error_message: error.message, ip_address: req.ip });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/extract', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF file' });
    const { pages } = req.body;
    const pageNumbers = pages ? pages.split(',').flatMap(p => p.includes('-') ? (([s, e]) => Array.from({length: e - s + 1}, (_, i) => parseInt(s) + i))(p.split('-').map(Number)) : parseInt(p)) : [];
    const extracted = await extractPages(req.file.buffer, pageNumbers);
    await logActivity({ tool_used: 'extract', input_size: req.file.buffer.length, output_size: extracted.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="extracted-${uuidv4()}.pdf"`);
    res.send(extracted);
  } catch (error) {
    await logActivity({ tool_used: 'extract', status: 'error', error_message: error.message, ip_address: req.ip });
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
