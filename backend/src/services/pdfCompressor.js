/**
 * PDF Compressor Service - pdf-lib + Sharp Implementation
 * 
 * Achieves 20-70% file size reduction using pure Node.js libraries.
 * Works on Render free tier - no external dependencies required.
 * 
 * Compression Levels:
 * - low: 10-30% reduction (90% JPEG quality, 2000px max)
 * - medium: 30-50% reduction (70% JPEG quality, 1500px max)
 * - maximum: 50-70% reduction (50% JPEG quality, 1000px max, grayscale)
 */

const { PDFDocument, PDFName } = require('pdf-lib');
const { extractImagesFromPdf, getImageStats } = require('../utils/pdfImageExtractor');
const { compressImages, isSharpAvailable, COMPRESSION_LEVELS } = require('../utils/imageCompressor');

// Legacy config for API compatibility
const COMPRESSION_CONFIGS = {
  low: {
    jpegQuality: 90,
    maxWidth: 2000,
    maxHeight: 2000,
    grayscale: false,
  },
  medium: {
    jpegQuality: 70,
    maxWidth: 1500,
    maxHeight: 1500,
    grayscale: false,
  },
  maximum: {
    jpegQuality: 50,
    maxWidth: 1000,
    maxHeight: 1000,
    grayscale: true,
  },
};

/**
 * Structural compression - optimizes PDF structure only
 * Fallback when image compression fails or for text-only PDFs
 */
async function structuralCompression(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    preserveExistingEncryption: false,
  });

  return Buffer.from(pdfBytes);
}

/**
 * Replace images in PDF with compressed versions
 * @param {PDFDocument} pdfDoc - PDF document to modify
 * @param {Array} compressedImages - Array of compressed image objects
 */
async function replaceImagesInPdf(pdfDoc, compressedImages) {
  if (!compressedImages || compressedImages.length === 0) {
    return;
  }

  // Create a map of refKey to compressed data for quick lookup
  const imageMap = new Map();
  for (const img of compressedImages) {
    if (img.compressedData && img.compressedData.length < img.data.length) {
      imageMap.set(img.refKey, img.compressedData);
    }
  }

  if (imageMap.size === 0) {
    return; // No images to replace
  }

  const pages = pdfDoc.getPages();
  let replacedCount = 0;

  for (const page of pages) {
    const xObjects = page.node.Resources?.lookup(PDFName.of('XObject'));
    if (!xObjects) continue;

    const xObjectKeys = xObjects.keys();

    for (const key of xObjectKeys) {
      const xObject = xObjects.lookup(key);
      if (!xObject) continue;

      const subtype = xObject.get?.(PDFName.of('Subtype'));
      if (subtype !== PDFName.of('Image')) continue;

      // Get reference key
      const ref = xObject.context?.lookupMaybe?.(xObject) || xObject;
      const refKey = ref?.toString?.() || key?.toString?.();

      const compressedData = imageMap.get(refKey);
      if (!compressedData) continue;

      try {
        // Create new image XObject with compressed data
        const newImage = pdfDoc.context.stream(compressedData, {
          Type: PDFName.of('XObject'),
          Subtype: PDFName.of('Image'),
          Width: xObject.get(PDFName.of('Width')),
          Height: xObject.get(PDFName.of('Height')),
          ColorSpace: PDFName.of('DeviceRGB'), // JPEG is always RGB
          BitsPerComponent: 8,
          Filter: PDFName.of('DCTDecode'), // JPEG compression
        });

        // Replace the image in the XObject dictionary
        xObjects.set(key, newImage);
        replacedCount++;
      } catch (error) {
        console.warn(`[PDFCompressor] Failed to replace image ${refKey}: ${error.message}`);
      }
    }
  }

  console.log(`[PDFCompressor] Replaced ${replacedCount} images in PDF`);
}

/**
 * Compress PDF with image optimization
 * @param {Buffer} pdfBuffer - Input PDF buffer
 * @param {string} level - Compression level: 'low', 'medium', 'maximum'
 * @param {number} timeoutMs - Maximum processing time (default 30000)
 * @returns {Promise<Object>} - Compression result with buffer and metadata
 */
async function imageBasedCompression(pdfBuffer, level = 'medium', timeoutMs = 30000) {
  const startTime = Date.now();
  const originalSize = pdfBuffer.length;

  // Check for timeout
  const checkTimeout = () => {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Compression timeout after ${timeoutMs}ms`);
    }
  };

  // Load PDF
  const pdfDoc = await PDFDocument.load(pdfBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  checkTimeout();

  // Extract images
  console.log(`[PDFCompressor] Extracting images from PDF...`);
  const images = await extractImagesFromPdf(pdfDoc);
  const stats = getImageStats(images);

  console.log(`[PDFCompressor] Found ${stats.count} images, total ${stats.totalOriginalSize} bytes`);

  if (images.length === 0) {
    console.log('[PDFCompressor] No images found, applying structural compression only');
    const result = await structuralCompression(pdfBuffer);
    return { buffer: result, method: 'structural (no images)', reduction: 0 };
  }

  checkTimeout();

  // Compress images
  console.log(`[PDFCompressor] Compressing images at '${level}' level...`);
  const compressedImages = await compressImages(images, level);

  checkTimeout();

  // Replace images in PDF
  await replaceImagesInPdf(pdfDoc, compressedImages);

  checkTimeout();

  // Save optimized PDF
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    preserveExistingEncryption: false,
  });

  const resultBuffer = Buffer.from(pdfBytes);
  const newSize = resultBuffer.length;
  const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

  return {
    buffer: resultBuffer,
    method: 'sharp-image-compression',
    reduction: parseFloat(reduction),
    imageStats: {
      count: compressedImages.length,
      avgReduction: compressedImages.reduce((sum, img) => sum + (img.reduction || 0), 0) / compressedImages.length
    }
  };
}

/**
 * Main PDF compression function
 * @param {Buffer} pdfBuffer - Input PDF buffer
 * @param {string} level - Compression level: 'low', 'medium', 'maximum'
 * @param {number} timeoutMs - Maximum processing time (default 30000)
 * @returns {Promise<Buffer>} - Compressed PDF buffer
 */
async function compressPdf(pdfBuffer, level = 'medium', timeoutMs = 30000) {
  const startTime = Date.now();
  const originalSize = pdfBuffer.length;

  // Validate level
  const validLevel = COMPRESSION_LEVELS[level] ? level : 'medium';
  const settings = COMPRESSION_LEVELS[validLevel];

  console.log(`[PDFCompressor] Starting compression - level: ${validLevel}, settings: ${settings.description}`);
  console.log(`[PDFCompressor] Original size: ${originalSize} bytes`);

  let result;
  let method;
  let reduction = 0;

  try {
    // Check if Sharp is available
    if (!isSharpAvailable()) {
      throw new Error('Sharp not available');
    }

    // Try image-based compression
    const compressionResult = await imageBasedCompression(pdfBuffer, validLevel, timeoutMs);
    result = compressionResult.buffer;
    method = compressionResult.method;
    reduction = compressionResult.reduction || 0;

    // If compression actually increased size, use structural only
    if (result.length >= originalSize) {
      console.log('[PDFCompressor] Compressed size >= original, using structural fallback');
      result = await structuralCompression(pdfBuffer);
      method = 'structural';
      reduction = ((originalSize - result.length) / originalSize * 100).toFixed(1);
    }
  } catch (error) {
    console.warn(`[PDFCompressor] Image compression failed: ${error.message}. Falling back to structural.`);
    result = await structuralCompression(pdfBuffer);
    method = 'structural (fallback)';
    reduction = ((originalSize - result.length) / originalSize * 100).toFixed(1);
  }

  const duration = Date.now() - startTime;
  const newSize = result.length;

  console.log(
    `[PDFCompressor] method=${method}, level=${validLevel}, original=${originalSize}b, compressed=${newSize}b, reduction=${reduction}%, time=${duration}ms`
  );

  return result;
}

module.exports = {
  compressPdf,
  COMPRESSION_CONFIGS,
  COMPRESSION_LEVELS,
  structuralCompression,
  imageBasedCompression
};
