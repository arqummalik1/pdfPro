/**
 * Image Compression Engine using Sharp
 * 
 * Compresses images with level-based settings for PDF optimization
 * Pure Node.js implementation - works on Render free tier
 */

const sharp = require('sharp');

// Compression level configurations
const COMPRESSION_LEVELS = {
  low: {
    quality: 90,
    maxDimension: 2000,
    grayscale: false,
    description: 'High quality (90% JPEG, 2000px max)'
  },
  medium: {
    quality: 70,
    maxDimension: 1500,
    grayscale: false,
    description: 'Balanced quality (70% JPEG, 1500px max)'
  },
  maximum: {
    quality: 50,
    maxDimension: 1000,
    grayscale: true,
    description: 'Maximum compression (50% JPEG, 1000px max, grayscale)'
  }
};

/**
 * Compress a single image using Sharp
 * @param {Buffer} imageBuffer - Raw image data
 * @param {string} format - Original format ('jpeg', 'png', 'raw')
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {string} level - Compression level: 'low', 'medium', 'maximum'
 * @returns {Promise<Buffer>} Compressed image buffer
 */
async function compressImage(imageBuffer, format, width, height, level = 'medium') {
  const settings = COMPRESSION_LEVELS[level] || COMPRESSION_LEVELS.medium;

  try {
    let pipeline = sharp(imageBuffer, {
      failOnError: false,
      limitInputPixels: 268435456 // 256 megapixels max (memory safety)
    });

    // Get metadata to check if processing is needed
    const metadata = await pipeline.metadata();

    // Determine if resizing is needed
    const maxDim = Math.max(metadata.width, metadata.height);
    if (maxDim > settings.maxDimension) {
      pipeline = pipeline.resize({
        width: metadata.width > metadata.height ? settings.maxDimension : null,
        height: metadata.height >= metadata.width ? settings.maxDimension : null,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Apply grayscale for maximum compression
    if (settings.grayscale) {
      pipeline = pipeline.grayscale();
    }

    // Output as JPEG with specified quality
    // Always convert to JPEG for consistent compression
    pipeline = pipeline.jpeg({
      quality: settings.quality,
      progressive: true,
      mozjpeg: true, // Better compression
      chromaSubsampling: settings.quality < 80 ? '4:2:0' : '4:4:4'
    });

    const compressed = await pipeline.toBuffer();

    // Safety check: don't use compressed if it's larger
    if (compressed.length >= imageBuffer.length) {
      return imageBuffer;
    }

    return compressed;
  } catch (error) {
    console.warn(`[ImageCompressor] Failed to compress image: ${error.message}`);
    return imageBuffer; // Return original on error
  }
}

/**
 * Process all images from a PDF with compression
 * @param {Array} images - Array of image objects from pdfImageExtractor
 * @param {string} level - Compression level
 * @returns {Promise<Array>} Array of compressed image objects
 */
async function compressImages(images, level = 'medium') {
  if (!images || images.length === 0) {
    return [];
  }

  const results = [];
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  // Process sequentially to limit memory usage (important for Render free tier)
  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    try {
      const compressed = await compressImage(
        img.data,
        img.format,
        img.width,
        img.height,
        level
      );

      const originalSize = img.data.length;
      const compressedSize = compressed.length;
      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

      results.push({
        ...img,
        compressedData: compressed,
        compressedSize,
        reduction: parseFloat(reduction)
      });

      totalOriginalSize += originalSize;
      totalCompressedSize += compressedSize;

      // Log progress for large PDFs
      if (images.length > 5 && (i + 1) % 5 === 0) {
        console.log(`[ImageCompressor] Processed ${i + 1}/${images.length} images...`);
      }
    } catch (error) {
      console.warn(`[ImageCompressor] Error processing image ${i}: ${error.message}`);
      // Include original on error
      results.push({
        ...img,
        compressedData: img.data,
        compressedSize: img.data.length,
        reduction: 0
      });
      totalOriginalSize += img.data.length;
      totalCompressedSize += img.data.length;
    }
  }

  const stats = {
    processed: results.length,
    totalOriginalSize,
    totalCompressedSize,
    totalReduction: totalOriginalSize > 0
      ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1)
      : 0
  };

  console.log(`[ImageCompressor] ${stats.processed} images processed, ${stats.totalReduction}% reduction`);

  return results;
}

/**
 * Get compression settings for a level
 * @param {string} level - Compression level
 * @returns {Object} Settings object
 */
function getCompressionSettings(level) {
  return COMPRESSION_LEVELS[level] || COMPRESSION_LEVELS.medium;
}

/**
 * Check if Sharp is available (should always be true if installed)
 * @returns {boolean} True if sharp is available
 */
function isSharpAvailable() {
  try {
    return !!sharp;
  } catch {
    return false;
  }
}

module.exports = {
  compressImage,
  compressImages,
  getCompressionSettings,
  isSharpAvailable,
  COMPRESSION_LEVELS
};
