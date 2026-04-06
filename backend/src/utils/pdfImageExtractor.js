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
    
    // Get resources - Resources is a method, not a property
    const resources = page.node.Resources?.();
    if (!resources) {
      console.log(`[ImageExtractor] Page ${pageIndex}: No resources found`);
      continue;
    }

    // Get XObject dictionary using .get() not .lookup()
    const xObjectsRef = resources.get(PDFName.of('XObject'));
    if (!xObjectsRef) {
      console.log(`[ImageExtractor] Page ${pageIndex}: No XObjects found`);
      continue;
    }

    // Resolve the reference to get the actual dictionary
    let xObjects;
    try {
      if (xObjectsRef.lookup) {
        xObjects = xObjectsRef.lookup();
      } else {
        xObjects = xObjectsRef;
      }
    } catch (e) {
      console.warn(`[ImageExtractor] Page ${pageIndex}: Error resolving XObjects: ${e.message}`);
      continue;
    }

    if (!xObjects || !xObjects.entries) {
      continue;
    }

    // Iterate through XObject entries
    for (const [key, ref] of xObjects.entries()) {
      try {
        // Look up the actual XObject
        const xObject = pdfDoc.context.lookup(ref);
        if (!xObject) continue;

        // Check if it's an image XObject
        const dict = xObject.dict || xObject;
        const subtype = dict.get?.(PDFName.of('Subtype'));
        if (subtype !== PDFName.of('Image')) continue;

        // Get unique reference key
        const refKey = ref.toString();
        if (processedRefs.has(refKey)) continue;
        processedRefs.add(refKey);

        // Extract image metadata
        const width = dict.get(PDFName.of('Width'))?.value || 0;
        const height = dict.get(PDFName.of('Height'))?.value || 0;

        if (width === 0 || height === 0) continue;

        // Determine image format from Filter
        const filter = dict.get(PDFName.of('Filter'));
        let format = 'raw';

        if (filter) {
          if (filter.encodedName === '/DCTDecode') {
            format = 'jpeg';
          } else if (filter.encodedName === '/FlateDecode') {
            format = 'png';
          } else if (Array.isArray(filter)) {
            for (const f of filter) {
              if (f.encodedName === '/DCTDecode') {
                format = 'jpeg';
                break;
              } else if (f.encodedName === '/FlateDecode') {
                format = 'png';
                break;
              }
            }
          }
        }

        // Extract raw image data
        let imageData;
        if (xObject instanceof PDFRawStream) {
          imageData = Buffer.from(xObject.contents);
        } else if (xObject.contents) {
          imageData = Buffer.from(xObject.contents);
        } else {
          console.warn(`[ImageExtractor] Page ${pageIndex}: Could not extract image data`);
          continue;
        }

        if (!imageData || imageData.length === 0) continue;

        console.log(`[ImageExtractor] Page ${pageIndex}: Found ${format} image ${width}x${height}, ${imageData.length} bytes`);

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
      } catch (e) {
        console.warn(`[ImageExtractor] Page ${pageIndex}: Error processing XObject: ${e.message}`);
        continue;
      }
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
