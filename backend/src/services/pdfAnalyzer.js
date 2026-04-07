/**
 * PDF Analyzer Service
 * Detects PDF type (text-only, image-heavy, mixed) for intelligent compression routing
 */

const { PDFDocument, PDFName } = require('pdf-lib');

/**
 * Analyze PDF to determine content type and characteristics
 * @param {Buffer} pdfBuffer - Input PDF buffer
 * @returns {Promise<Object>} Analysis result with hasImages, imageCount, pageCount, pdfType
 */
async function analyzePDF(pdfBuffer) {
  const startTime = Date.now();

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    const pages = pdfDoc.getPages();
    const pageCount = pages.length;

    let totalImages = 0;
    let totalXObjects = 0;
    let pagesWithImages = 0;

    for (const page of pages) {
      const resources = page.node.Resources?.();
      if (!resources) continue;

      const xObjectsRef = resources.get(PDFName.of('XObject'));
      if (!xObjectsRef) continue;

      let xObjects;
      try {
        xObjects = xObjectsRef.lookup ? xObjectsRef.lookup() : xObjectsRef;
      } catch (e) {
        continue;
      }

      if (!xObjects || !xObjects.entries) continue;

      let pageHasImage = false;
      for (const [, ref] of xObjects.entries()) {
        totalXObjects++;

        let xObject;
        try {
          xObject = pdfDoc.context.lookup(ref);
        } catch (e) {
          continue;
        }

        if (!xObject) continue;

        const dict = xObject.dict || xObject;
        const subtype = dict.get?.(PDFName.of('Subtype'));

        if (subtype === PDFName.of('Image')) {
          totalImages++;
          pageHasImage = true;
        }
      }

      if (pageHasImage) {
        pagesWithImages++;
      }
    }

    // Determine PDF type
    const imageRatio = pageCount > 0 ? pagesWithImages / pageCount : 0;
    const hasImages = totalImages > 0;

    let pdfType = 'text-only';
    if (hasImages) {
      if (imageRatio > 0.5 || totalImages > pageCount * 2) {
        pdfType = 'image-heavy';
      } else {
        pdfType = 'mixed';
      }
    }

    const result = {
      hasImages,
      imageCount: totalImages,
      xObjectCount: totalXObjects,
      pageCount,
      pagesWithImages,
      imageRatio,
      pdfType,
      analyzedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    };

    console.log(`[PDFAnalyzer] ${pdfType} PDF: ${pageCount} pages, ${totalImages} images, ${pagesWithImages} pages with images`);

    return result;
  } catch (error) {
    console.error('[PDFAnalyzer] Error analyzing PDF:', error.message);

    // Return safe defaults on error
    return {
      hasImages: true, // Assume images to be safe
      imageCount: 0,
      xObjectCount: 0,
      pageCount: 1,
      pagesWithImages: 0,
      imageRatio: 0,
      pdfType: 'unknown',
      analyzedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Quick check if PDF likely contains images
 * @param {Buffer} pdfBuffer - Input PDF buffer
 * @returns {Promise<boolean>} True if PDF likely contains images
 */
async function hasImages(pdfBuffer) {
  const analysis = await analyzePDF(pdfBuffer);
  return analysis.hasImages;
}

/**
 * Get PDF page count
 * @param {Buffer} pdfBuffer - Input PDF buffer
 * @returns {Promise<number>} Number of pages
 */
async function getPageCount(pdfBuffer) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    return pdfDoc.getPages().length;
  } catch (error) {
    console.error('[PDFAnalyzer] Error getting page count:', error.message);
    return 1;
  }
}

module.exports = {
  analyzePDF,
  hasImages,
  getPageCount,
};
