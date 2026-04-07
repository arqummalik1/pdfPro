/**
 * Compression Pipeline Router
 * Multi-engine PDF compression orchestrator
 * 
 * Compression Levels:
 * - low: pdf-lib only
 * - medium: pdf-lib → qpdf
 * - high: pdf-lib → qpdf → pdfcpu → (sharp if images detected)
 */

const { PDFDocument } = require('pdf-lib');
const { analyzePDF } = require('./pdfAnalyzer');
const { runQpdf, runPdfcpu, isQpdfAvailable, isPdfcpuAvailable } = require('./externalEngines');
const { extractImagesFromPdf, compressImages, replaceImagesInPdf, isSharpAvailable } = require('./imageCompressor');

const PIPELINE_TIMEOUT = 120000; // 120 seconds total pipeline timeout
const ENGINE_TIMEOUT = 30000;    // 30 seconds per engine

/**
 * Base compression with pdf-lib
 * Structural optimization without image processing
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @returns {Promise<Buffer>} Optimized PDF buffer
 */
async function baseCompression(inputBuffer) {
  const pdfDoc = await PDFDocument.load(inputBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  // Clear metadata to reduce size
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setProducer('PDFPro');
  pdfDoc.setCreator('');
  pdfDoc.setKeywords([]);

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    preserveExistingEncryption: false,
  });

  return Buffer.from(pdfBytes);
}

/**
 * Medium compression pipeline
 * pdf-lib → qpdf
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @param {Object} context - Context object for tracking
 * @returns {Promise<Buffer>} Compressed PDF buffer
 */
async function mediumCompression(inputBuffer, context) {
  let result = inputBuffer;

  // Step 1: Base compression with pdf-lib
  result = await baseCompression(result);
  context.enginesUsed.push('pdf-lib');

  // Step 2: QPDF structural optimization (if available)
  const qpdfAvailable = await isQpdfAvailable();
  if (qpdfAvailable) {
    try {
      result = await runQpdf(result, { timeout: ENGINE_TIMEOUT });
      context.enginesUsed.push('qpdf');
    } catch (error) {
      console.warn('[CompressionPipeline] QPDF failed, continuing:', error.message);
    }
  } else {
    console.log('[CompressionPipeline] QPDF not available, skipping');
  }

  return result;
}

/**
 * High compression pipeline
 * pdf-lib → qpdf → pdfcpu → (sharp if images detected)
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @param {Object} analysis - PDF analysis result
 * @param {Object} context - Context object for tracking
 * @returns {Promise<Buffer>} Compressed PDF buffer
 */
async function highCompression(inputBuffer, analysis, context) {
  let result = inputBuffer;

  // Step 1: Base compression with pdf-lib
  result = await baseCompression(result);
  context.enginesUsed.push('pdf-lib');

  // Step 2: QPDF structural optimization
  const qpdfAvailable = await isQpdfAvailable();
  if (qpdfAvailable) {
    try {
      result = await runQpdf(result, { timeout: ENGINE_TIMEOUT });
      context.enginesUsed.push('qpdf');
    } catch (error) {
      console.warn('[CompressionPipeline] QPDF failed, continuing:', error.message);
    }
  }

  // Step 3: PDFCPU advanced optimization
  const pdfcpuAvailable = await isPdfcpuAvailable();
  if (pdfcpuAvailable) {
    try {
      result = await runPdfcpu(result, { timeout: ENGINE_TIMEOUT });
      context.enginesUsed.push('pdfcpu');
    } catch (error) {
      console.warn('[CompressionPipeline] PDFCPU failed, continuing:', error.message);
    }
  } else {
    console.log('[CompressionPipeline] PDFCPU not available, skipping');
  }

  // Step 4: Sharp image compression (if images detected)
  if (analysis.hasImages && isSharpAvailable()) {
    try {
      const pdfDoc = await PDFDocument.load(result, {
        ignoreEncryption: true,
        updateMetadata: false,
      });

      const images = await extractImagesFromPdf(pdfDoc);

      if (images.length > 0) {
        const compressedImages = await compressImages(images, 'high');
        await replaceImagesInPdf(pdfDoc, compressedImages);

        const pdfBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          preserveExistingEncryption: false,
        });

        result = Buffer.from(pdfBytes);
        context.enginesUsed.push('sharp');
        context.imageCompressionApplied = true;
        context.imagesProcessed = images.length;
      }
    } catch (error) {
      console.warn('[CompressionPipeline] Image compression failed:', error.message);
    }
  }

  return result;
}

/**
 * Main compression pipeline
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @param {string} level - Compression level: 'low', 'medium', 'high'
 * @returns {Promise<Object>} Compression result with buffer and stats
 */
async function compressPDFPipeline(inputBuffer, level = 'medium') {
  const startTime = Date.now();
  const originalSize = inputBuffer.length;

  console.log(`[CompressionPipeline] Starting ${level} compression for ${originalSize} bytes`);

  // Validate level
  const validLevel = ['low', 'medium', 'high'].includes(level) ? level : 'medium';

  // Analyze PDF first
  const analysis = await analyzePDF(inputBuffer);
  console.log(`[CompressionPipeline] PDF type: ${analysis.pdfType}, ${analysis.pageCount} pages, ${analysis.imageCount} images`);

  // Context for tracking
  const context = {
    enginesUsed: [],
    imageCompressionApplied: false,
    imagesProcessed: 0,
  };

  let result;

  try {
    // Route based on compression level
    switch (validLevel) {
      case 'low':
        // Low: pdf-lib only
        result = await baseCompression(inputBuffer);
        context.enginesUsed.push('pdf-lib');
        break;

      case 'medium':
        // Medium: pdf-lib → qpdf
        result = await mediumCompression(inputBuffer, context);
        break;

      case 'high':
        // High: pdf-lib → qpdf → pdfcpu → (sharp if images)
        result = await highCompression(inputBuffer, analysis, context);
        break;

      default:
        throw new Error(`Unknown compression level: ${validLevel}`);
    }

    // If compression actually increased size significantly, use original
    const sizeIncrease = ((result.length - originalSize) / originalSize) * 100;
    if (sizeIncrease > 5) {
      console.warn(`[CompressionPipeline] Size increased by ${sizeIncrease.toFixed(1)}%, using original`);
      result = inputBuffer;
      context.enginesUsed.push('reverted-to-original');
    }

  } catch (error) {
    console.error('[CompressionPipeline] Pipeline error:', error.message);
    // Fallback to original file
    result = inputBuffer;
    context.enginesUsed.push('fallback-original');
  }

  const endTime = Date.now();
  const compressedSize = result.length;
  const reductionPercent = originalSize > 0
    ? parseFloat(((1 - compressedSize / originalSize) * 100).toFixed(1))
    : 0;

  const compressionStats = {
    originalSize,
    compressedSize,
    reductionPercent,
    pdfType: analysis.pdfType,
    pageCount: analysis.pageCount,
    imageCount: analysis.imageCount,
    enginesUsed: context.enginesUsed,
    imageCompressionApplied: context.imageCompressionApplied,
    imagesProcessed: context.imagesProcessed,
    compressionLevel: validLevel,
    processingTimeMs: endTime - startTime,
    timestamp: new Date().toISOString(),
  };

  console.log(
    `[CompressionPipeline] Complete: ${originalSize} → ${compressedSize} bytes ` +
    `(${reductionPercent}% reduction), engines: [${context.enginesUsed.join(', ')}], ` +
    `time: ${compressionStats.processingTimeMs}ms`
  );

  return {
    buffer: result,
    stats: compressionStats,
  };
}

/**
 * Simple buffer compression (API-compatible with old compressor)
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @param {string} level - Compression level
 * @returns {Promise<Buffer>} Compressed PDF buffer
 */
async function compressPdf(inputBuffer, level = 'medium') {
  const result = await compressPDFPipeline(inputBuffer, level);
  return result.buffer;
}

/**
 * Get compression stats without performing compression
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @returns {Promise<Object>} Analysis and estimated compression info
 */
async function getCompressionStats(inputBuffer) {
  const analysis = await analyzePDF(inputBuffer);

  const availableEngines = {
    pdfLib: true,
    qpdf: await isQpdfAvailable(),
    pdfcpu: await isPdfcpuAvailable(),
    sharp: isSharpAvailable(),
  };

  return {
    ...analysis,
    fileSize: inputBuffer.length,
    availableEngines,
    recommendedLevel: analysis.pdfType === 'text-only' ? 'medium' : 'high',
    estimatedReduction: {
      low: analysis.pdfType === 'text-only' ? 10 : 20,
      medium: analysis.pdfType === 'text-only' ? 20 : 40,
      high: analysis.pdfType === 'text-only' ? 30 : 60,
    },
  };
}

module.exports = {
  compressPDFPipeline,
  compressPdf,
  getCompressionStats,
  baseCompression,
  mediumCompression,
  highCompression,
  PIPELINE_TIMEOUT,
  ENGINE_TIMEOUT,
};
