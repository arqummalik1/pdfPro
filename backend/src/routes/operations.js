/**
 * API Routes - Compress, Rotate, Edit, Watermark, Sign, Protect
 */
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { compressPDFPipeline } = require('../services/compressionPipeline');
const { rotatePdf, rotateToOrientation } = require('../services/pdfRotator');
const { deletePages, reorderPages, reversePages } = require('../services/pdfEditor');
const { addTextWatermark, addPageNumbers } = require('../services/pdfWatermarker');
const { addSignature, addTypedSignature } = require('../services/pdfSigner');
const { protectPdf, unlockPdf } = require('../services/pdfProtector');
const { logActivity } = require('../config/supabase');

const router = express.Router();

const parseNumericList = (value) => {
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
      // Fallback to comma-separated format.
    }

    return trimmed
      .split(',')
      .map((item) => Number(item.trim()))
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
const signUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'file') {
      cb(file.mimetype === 'application/pdf' ? null : new Error('Only PDF'), file.mimetype === 'application/pdf');
      return;
    }

    if (file.fieldname === 'signature') {
      cb(file.mimetype.startsWith('image/') ? null : new Error('Only images'), file.mimetype.startsWith('image/'));
      return;
    }

    cb(new Error('Unsupported upload field'), false);
  },
});

// COMPRESS
router.post('/compress', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF' });

    const level = req.body.level || 'medium';
    const result = await compressPDFPipeline(req.file.buffer, level);

    await logActivity({
      tool_used: 'compress',
      input_size: result.stats.originalSize,
      output_size: result.stats.compressedSize,
      processing_time_ms: Date.now() - startTime,
      status: 'success',
      ip_address: req.ip,
    });

    // Return PDF with stats in headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compressed-${uuidv4()}.pdf"`);
    res.setHeader('X-Original-Size', result.stats.originalSize);
    res.setHeader('X-Compressed-Size', result.stats.compressedSize);
    res.setHeader('X-Reduction-Percent', result.stats.reductionPercent);
    res.setHeader('X-Engines-Used', result.stats.enginesUsed.join(','));
    res.setHeader('X-PDF-Type', result.stats.pdfType);
    res.setHeader('X-Processing-Time', result.stats.processingTimeMs);
    res.send(result.buffer);
  } catch (error) {
    await logActivity({
      tool_used: 'compress',
      status: 'error',
      error_message: error.message,
      ip_address: req.ip,
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

// ROTATE
router.post('/rotate', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF' });
    let result = req.body.orientation ? await rotateToOrientation(req.file.buffer, req.body.orientation) : await rotatePdf(req.file.buffer, parseInt(req.body.rotation) || 90);
    await logActivity({ tool_used: 'rotate', input_size: req.file.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rotated-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'rotate', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

// DELETE PAGES
router.post('/delete-pages', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF' });
    const pages = parseNumericList(req.body.pages);
    if (pages.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one page number to delete.' });
    }
    const result = await deletePages(req.file.buffer, pages);
    await logActivity({ tool_used: 'delete-pages', input_size: req.file.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="modified-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'delete-pages', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

// REORDER
router.post('/reorder', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF' });
    const order = parseNumericList(req.body.order);
    if (order.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid page order.' });
    }
    const result = await reorderPages(req.file.buffer, order);
    await logActivity({ tool_used: 'reorder', input_size: req.file.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reordered-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'reorder', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

// REVERSE
router.post('/reverse', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF' });
    const result = await reversePages(req.file.buffer);
    await logActivity({ tool_used: 'reverse', input_size: req.file.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reversed-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'reverse', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

// WATERMARK
router.post('/watermark', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF' });
    const result = await addTextWatermark(req.file.buffer, { text: req.body.text || 'WATERMARK', fontSize: parseInt(req.body.fontSize) || 48, opacity: parseFloat(req.body.opacity) || 0.3, rotation: parseInt(req.body.rotation) || -45, position: req.body.position || 'center' });
    await logActivity({ tool_used: 'watermark', input_size: req.file.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="watermarked-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'watermark', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

// PAGE NUMBERS
router.post('/page-numbers', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload PDF' });
    const result = await addPageNumbers(req.file.buffer, { position: req.body.position || 'bottom-center', startNumber: parseInt(req.body.startNumber) || 1, fontSize: parseInt(req.body.fontSize) || 12 });
    await logActivity({ tool_used: 'page-numbers', input_size: req.file.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="numbered-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'page-numbers', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

// SIGN
router.post('/sign', signUpload.fields([{ name: 'file', maxCount: 1 }, { name: 'signature', maxCount: 1 }]), async (req, res) => {
  const startTime = Date.now();
  try {
    const uploadedFiles = req.files || {};
    const pdfFile = uploadedFiles.file?.[0];
    const signatureFile = uploadedFiles.signature?.[0];

    if (!pdfFile) return res.status(400).json({ success: false, message: 'Upload PDF' });

    const result = signatureFile
      ? await addSignature(pdfFile.buffer, signatureFile.buffer, { pageNumber: parseInt(req.body.pageNumber) || 1, x: parseInt(req.body.x) || 100, y: parseInt(req.body.y) || 100, width: parseInt(req.body.width) || 200 })
      : await addTypedSignature(pdfFile.buffer, req.body.text || 'Signed', { pageNumber: parseInt(req.body.pageNumber) || 1, x: parseInt(req.body.x) || 100, y: parseInt(req.body.y) || 100 });

    await logActivity({ tool_used: 'sign', input_size: pdfFile.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="signed-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'sign', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

// PROTECT
router.post('/protect', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file || !req.body.password) return res.status(400).json({ success: false, message: 'Upload PDF and password' });
    const result = await protectPdf(req.file.buffer, req.body.password, { allowPrint: req.body.allowPrint !== 'false', allowCopy: req.body.allowCopy !== 'false', allowModify: req.body.allowModify !== 'false' });
    await logActivity({ tool_used: 'protect', input_size: req.file.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="protected-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'protect', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

// UNLOCK
router.post('/unlock', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file || !req.body.password) return res.status(400).json({ success: false, message: 'Upload PDF and password' });
    const result = await unlockPdf(req.file.buffer, req.body.password);
    await logActivity({ tool_used: 'unlock', input_size: req.file.buffer.length, output_size: result.length, processing_time_ms: Date.now() - startTime, status: 'success', ip_address: req.ip });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="unlocked-${uuidv4()}.pdf"`);
    res.send(result);
  } catch (error) { await logActivity({ tool_used: 'unlock', status: 'error', error_message: error.message, ip_address: req.ip }); res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
