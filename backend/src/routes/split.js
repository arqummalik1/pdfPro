/**
 * API Routes - Split PDF
 */
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { splitPdfToPages, splitPdfByRanges, splitPdfEveryN, extractPages } = require('../services/pdfSplitter');
const { logActivity } = require('../config/supabase');

const router = express.Router();

const parsePageSelection = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter(Number.isFinite);
      }
    } catch {
      // Fallback to comma/range format
    }

    return trimmed
      .split(',')
      .flatMap((part) => {
        const token = part.trim();
        if (!token) return [];
        if (token.includes('-')) {
          const [start, end] = token.split('-').map((n) => Number(n.trim()));
          if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        const n = Number(token);
        return Number.isFinite(n) ? [n] : [];
      })
      .filter(Number.isFinite);
  }

  return [];
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF files are allowed'), false);
  },
});

router.post('/split', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF file' });
    const { mode = 'ranges', ranges, pagesPerFile } = req.body;
    let result;
    if (mode === 'pages') result = await splitPdfToPages(req.file.buffer);
    else if (mode === 'every-n') { const n = parseInt(pagesPerFile) || 1; result = await splitPdfEveryN(req.file.buffer, n); }
    else {
      let parsedRanges = [{ start: 1, end: 1 }];
      if (ranges) {
        try {
          parsedRanges = JSON.parse(ranges);
        } catch {
          return res.status(400).json({ success: false, message: 'Invalid ranges format. Please send valid JSON.' });
        }
      }
      result = await splitPdfByRanges(req.file.buffer, parsedRanges);
    }
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
    const pageNumbers = parsePageSelection(pages);
    if (pageNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one valid page number to extract.' });
    }
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
