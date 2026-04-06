/**
 * PDF Image Extractor Utility
 * 
 * Extracts embedded images from PDFs using pdf-lib
 * Handles JPEG, PNG, and raw bitmap formats
 */

const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');

/**
 * Extract images from a PDF document
 * @param {PDFDocument} pdfDoc - Loaded PDF document
 * @returns {Array} Array of image objects with metadata and raw data
 */
async function extractImagesFromPdf(pdfDoc) {
  const images = [];
  const processedRefs = new Set(); // Track processed images to avoid duplicates

  const pages = pdfDoc.getPages();

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const xObjects = page.node.Resources?.lookup(PDFName.of('XObject'));

    if (!xObjects) continue;

    const xObjectKeys = xObjects.keys();

    for (const key of xObjectKeys) {
      const xObject = xObjects.lookup(key);

      if (!xObject) continue;

      // Check if it's an image XObject
      const subtype = xObject.get?.(PDFName.of('Subtype'));
      if (subtype !== PDFName.of('Image')) continue;

      // Get unique reference to avoid processing same image multiple times
      const ref = xObject.context?.lookupMaybe?.(xObject) || xObject;
      const refKey = ref?.toString?.() || key?.toString?.();

      if (processedRefs.has(refKey)) continue;
      processedRefs.add(refKey);

      // Extract image metadata
      const width = xObject.get?.(PDFName.of('Width'))?.asNumber?.() || 0;
      const height = xObject.get?.(PDFName.of('Height'))?.asNumber?.() || 0;

      if (width === 0 || height === 0) continue;

      // Determine image format
      const filter = xObject.get?.(PDFName.of('Filter'));
      let format = 'raw';

      if (filter === PDFName.of('DCTDecode')) {
        format = 'jpeg';
      } else if (filter === PDFName.of('FlateDecode')) {
        format = 'png';
      } else if (Array.isArray(filter)) {
        // Check if any filter is DCTDecode (JPEG) or FlateDecode (PNG)
        for (const f of filter) {
          if (f === PDFName.of('DCTDecode')) {
            format = 'jpeg';
            break;
          } else if (f === PDFName.of('FlateDecode')) {
            format = 'png';
            break;
          }
        }
      }

      // Extract raw image data
      let imageData;
      try {
        if (xObject instanceof PDFRawStream) {
          imageData = Buffer.from(xObject.contents);
        } else if (xObject.contents) {
          imageData = Buffer.from(xObject.contents);
        } else {
          // Try to get stream contents
          const stream = xObject.context?.lookupMaybe?.(xObject);
          if (stream?.contents) {
            imageData = Buffer.from(stream.contents);
          } else {
            continue;
          }
        }
      } catch (e) {
        console.warn(`[ImageExtractor] Failed to extract image on page ${pageIndex}:`, e.message);
        continue;
      }

      if (!imageData || imageData.length === 0) continue;

      images.push({
        ref: xObject,
        refKey,
        width,
        height,
        format,
        data: imageData,
        pageIndex,
        originalSize: imageData.length
      });
    }
  }

  return images;
}

/**
 * Check if PDF has any compressible images
 * @param {PDFDocument} pdfDoc - Loaded PDF document
 * @returns {boolean} True if PDF has images
 */
async function hasCompressibleImages(pdfDoc) {
  const images = await extractImagesFromPdf(pdfDoc);
  return images.length > 0;
}

/**
 * Get compression statistics for logging
 * @param {Array} images - Array of extracted images
 * @returns {Object} Statistics object
 */
function getImageStats(images) {
  if (!images || images.length === 0) {
    return { count: 0, totalOriginalSize: 0 };
  }

  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
  
  return {
    count: images.length,
    totalOriginalSize,
    avgSize: Math.round(totalOriginalSize / images.length)
  };
}

module.exports = {
  extractImagesFromPdf,
  hasCompressibleImages,
  getImageStats
};
