/**
 * Image Compressor Service
 * Sharp-based image compression for PDF optimization
 */

const sharp = require('sharp');
const { PDFName } = require('pdf-lib');

// Compression level configurations
const COMPRESSION_LEVELS = {
  low: {
    jpegQuality: 90,
    maxWidth: 2000,
    maxHeight: 2000,
    grayscale: false,
    description: 'Minimal compression, better quality',
  },
  medium: {
    jpegQuality: 70,
    maxWidth: 1500,
    maxHeight: 1500,
    grayscale: false,
    description: 'Balanced compression',
  },
  high: {
    jpegQuality: 50,
    maxWidth: 1000,
    maxHeight: 1000,
    grayscale: true,
    description: 'Maximum compression, grayscale',
  },
};

/**
 * Extract images from PDF document
 * @param {PDFDocument} pdfDoc - Loaded PDF document
 * @returns {Promise<Array>} Array of image objects
 */
async function extractImagesFromPdf(pdfDoc) {
  const images = [];
  const pages = pdfDoc.getPages();

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

    for (const [key, ref] of xObjects.entries()) {
      let xObject;
      try {
        xObject = pdfDoc.context.lookup(ref);
      } catch (e) {
        continue;
      }

      if (!xObject) continue;

      const dict = xObject.dict || xObject;
      const subtype = dict.get?.(PDFName.of('Subtype'));

      if (subtype !== PDFName.of('Image')) continue;

      // Get image properties
      const width = dict.get?.(PDFName.of('Width'));
      const height = dict.get?.(PDFName.of('Height'));
      const filter = dict.get?.(PDFName.of('Filter'));
      const colorSpace = dict.get?.(PDFName.of('ColorSpace'));

      // Get raw image data
      let data;
      try {
        if (xObject.getContents) {
          data = xObject.getContents();
        } else if (xObject.streamContents) {
          data = xObject.streamContents;
        } else {
          continue;
        }
      } catch (e) {
        continue;
      }

      if (!data || data.length === 0) continue;

      // Determine image format
      let format = 'jpeg';
      if (filter) {
        const filterName = filter.toString();
        if (filterName.includes('DCTDecode')) format = 'jpeg';
        else if (filterName.includes('FlateDecode')) format = 'png';
        else if (filterName.includes('LZWDecode')) format = 'tiff';
      }

      images.push({
        refKey: ref.toString(),
        data: Buffer.from(data),
        width: width?.value || 0,
        height: height?.value || 0,
        format,
        colorSpace: colorSpace?.toString() || 'Unknown',
        originalSize: data.length,
        compressedData: null,
        reduction: 0,
      });
    }
  }

  return images;
}

/**
 * Get statistics about extracted images
 * @param {Array} images - Array of image objects
 * @returns {Object} Statistics object
 */
function getImageStats(images) {
  if (!images || images.length === 0) {
    return {
      count: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      avgSize: 0,
    };
  }

  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCompressedSize = images.reduce((sum, img) => sum + (img.compressedData?.length || img.originalSize), 0);

  return {
    count: images.length,
    totalOriginalSize,
    totalCompressedSize,
    avgSize: Math.round(totalOriginalSize / images.length),
    reduction: ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1),
  };
}

/**
 * Compress images with sharp
 * @param {Array} images - Array of image objects
 * @param {string} level - Compression level: 'low', 'medium', 'high'
 * @returns {Promise<Array>} Array of compressed image objects
 */
async function compressImages(images, level = 'medium') {
  const settings = COMPRESSION_LEVELS[level] || COMPRESSION_LEVELS.medium;
  const compressedImages = [];

  for (const image of images) {
    try {
      // Skip small images (< 10KB)
      if (image.originalSize < 10 * 1024) {
        compressedImages.push({
          ...image,
          compressedData: image.data,
          reduction: 0,
        });
        continue;
      }

      // Process with sharp
      let pipeline = sharp(image.data, {
        failOnError: false,
        limitInputPixels: 268402689, // ~16384 x 16384
      });

      // Resize if needed
      if (image.width > settings.maxWidth || image.height > settings.maxHeight) {
        pipeline = pipeline.resize(settings.maxWidth, settings.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Grayscale for high compression
      if (settings.grayscale) {
        pipeline = pipeline.grayscale();
      }

      // Output as JPEG with quality setting
      const compressedBuffer = await pipeline
        .jpeg({
          quality: settings.jpegQuality,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

      const reduction = ((1 - compressedBuffer.length / image.originalSize) * 100);

      compressedImages.push({
        ...image,
        compressedData: compressedBuffer,
        reduction,
      });

    } catch (error) {
      console.warn(`[ImageCompressor] Failed to compress image ${image.refKey}: ${error.message}`);
      // Return original on error
      compressedImages.push({
        ...image,
        compressedData: image.data,
        reduction: 0,
      });
    }
  }

  const stats = getImageStats(compressedImages);
  console.log(`[ImageCompressor] Compressed ${stats.count} images, ${stats.reduction}% avg reduction`);

  return compressedImages;
}

/**
 * Check if sharp is available
 * @returns {boolean}
 */
function isSharpAvailable() {
  try {
    // Just check if we can access sharp
    return typeof sharp === 'function';
  } catch (error) {
    return false;
  }
}

/**
 * Replace images in PDF document with compressed versions
 * @param {PDFDocument} pdfDoc - PDF document to modify
 * @param {Array} compressedImages - Array of compressed image objects
 * @returns {Promise<number>} Number of images replaced
 */
async function replaceImagesInPdf(pdfDoc, compressedImages) {
  if (!compressedImages || compressedImages.length === 0) {
    return 0;
  }

  // Create a map of refKey to compressed data for quick lookup
  const imageMap = new Map();
  for (const img of compressedImages) {
    if (img.compressedData && img.compressedData.length < img.data.length) {
      imageMap.set(img.refKey, img.compressedData);
    }
  }

  if (imageMap.size === 0) {
    return 0; // No images to replace
  }

  const pages = pdfDoc.getPages();
  let replacedCount = 0;

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

    for (const [key, ref] of xObjects.entries()) {
      let xObject;
      try {
        xObject = pdfDoc.context.lookup(ref);
      } catch (e) {
        continue;
      }

      if (!xObject) continue;

      const dict = xObject.dict || xObject;
      const subtype = dict.get?.(PDFName.of('Subtype'));
      if (subtype !== PDFName.of('Image')) continue;

      const refKey = ref.toString();
      const compressedData = imageMap.get(refKey);
      if (!compressedData) continue;

      try {
        // Get original dimensions
        const width = dict.get(PDFName.of('Width'));
        const height = dict.get(PDFName.of('Height'));

        // Create new image XObject with compressed data
        const newImage = pdfDoc.context.stream(compressedData, {
          Type: PDFName.of('XObject'),
          Subtype: PDFName.of('Image'),
          Width: width,
          Height: height,
          ColorSpace: PDFName.of('DeviceRGB'),
          BitsPerComponent: 8,
          Filter: PDFName.of('DCTDecode'),
        });

        // Replace the image in the XObject dictionary
        xObjects.set(key, newImage);
        replacedCount++;
      } catch (error) {
        console.warn(`[ImageCompressor] Failed to replace image ${refKey}: ${error.message}`);
      }
    }
  }

  console.log(`[ImageCompressor] Replaced ${replacedCount} images in PDF`);
  return replacedCount;
}

module.exports = {
  extractImagesFromPdf,
  compressImages,
  replaceImagesInPdf,
  getImageStats,
  isSharpAvailable,
  COMPRESSION_LEVELS,
};
