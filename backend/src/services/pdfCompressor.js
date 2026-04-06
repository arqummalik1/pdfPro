/**
 * PDF Compressor Service - Ghostscript-based compression
 * 
 * Uses Ghostscript to recompress images within PDFs for significant size reduction.
 * Maps compression levels to Ghostscript PDFSETTINGS:
 * - low: /prepress (300dpi, high quality, ~20-30% reduction)
 * - medium: /ebook (150dpi, good quality, ~50-70% reduction)
 * - maximum: /screen (72dpi, web quality, ~70-90% reduction)
 */

const { spawn } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Ghostscript PDFSETTINGS mapping for compression levels
const GS_SETTINGS = {
  low: {
    pdfSettings: '/prepress',
    colorImageResolution: 300,
    grayImageResolution: 300,
    monoImageResolution: 1200,
    description: 'High quality (300dpi)',
  },
  medium: {
    pdfSettings: '/ebook',
    colorImageResolution: 150,
    grayImageResolution: 150,
    monoImageResolution: 300,
    description: 'Balanced quality (150dpi)',
  },
  maximum: {
    pdfSettings: '/screen',
    colorImageResolution: 72,
    grayImageResolution: 72,
    monoImageResolution: 300,
    description: 'Web quality (72dpi)',
  },
};

// Keep COMPRESSION_CONFIGS for API compatibility
const COMPRESSION_CONFIGS = {
  low: {
    jpegQuality: 95,
    maxWidth: 3000,
    maxHeight: 3000,
    grayscale: false,
  },
  medium: {
    jpegQuality: 80,
    maxWidth: 2000,
    maxHeight: 2000,
    grayscale: false,
  },
  maximum: {
    jpegQuality: 60,
    maxWidth: 1200,
    maxHeight: 1200,
    grayscale: false,
  },
};

/**
 * Check if Ghostscript is available
 */
function isGhostscriptAvailable() {
  return new Promise((resolve) => {
    const gs = spawn('gs', ['--version'], { stdio: 'ignore' });
    gs.on('error', () => resolve(false));
    gs.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Structural compression - optimizes PDF structure only
 * Fallback when Ghostscript is unavailable
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
 * Compress PDF using Ghostscript
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @param {Object} settings - Ghostscript settings
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Buffer>} - Compressed PDF buffer
 */
async function ghostscriptCompress(inputBuffer, settings, timeoutMs) {
  const tempDir = os.tmpdir();
  const inputFile = path.join(tempDir, `gs-input-${Date.now()}.pdf`);
  const outputFile = path.join(tempDir, `gs-output-${Date.now()}.pdf`);

  try {
    // Write input to temp file
    fs.writeFileSync(inputFile, inputBuffer);

    // Build Ghostscript arguments
    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${settings.pdfSettings}`,
      `-dColorImageResolution=${settings.colorImageResolution}`,
      `-dGrayImageResolution=${settings.grayImageResolution}`,
      `-dMonoImageResolution=${settings.monoImageResolution}`,
      '-dDownsampleColorImages=true',
      '-dDownsampleGrayImages=true',
      '-dDownsampleMonoImages=true',
      '-dAutoFilterColorImages=true',
      '-dAutoFilterGrayImages=true',
      '-dColorImageDownsampleType=/Bicubic',
      '-dGrayImageDownsampleType=/Bicubic',
      '-dCompressFonts=true',
      '-dSubsetFonts=true',
      '-dEmbedAllFonts=false',
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      `-sOutputFile=${outputFile}`,
      inputFile,
    ];

    return new Promise((resolve, reject) => {
      const gs = spawn('gs', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: timeoutMs,
      });

      let stderr = '';
      let killed = false;

      // Handle timeout
      const timeoutId = setTimeout(() => {
        killed = true;
        gs.kill('SIGTERM');
        reject(new Error(`Ghostscript timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      gs.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      gs.on('close', (code) => {
        clearTimeout(timeoutId);

        if (killed) return;

        if (code !== 0) {
          reject(new Error(`Ghostscript failed (code ${code}): ${stderr}`));
          return;
        }

        try {
          if (!fs.existsSync(outputFile)) {
            reject(new Error('Ghostscript did not create output file'));
            return;
          }

          const result = fs.readFileSync(outputFile);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to read output: ${error.message}`));
        }
      });

      gs.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Ghostscript spawn error: ${error.message}`));
      });
    });
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Compress PDF with automatic fallback
 * @param {Buffer} pdfBuffer - Input PDF buffer
 * @param {string} level - Compression level: 'low', 'medium', 'maximum'
 * @param {number} timeoutMs - Maximum processing time (default 30000)
 * @returns {Promise<Buffer>} - Compressed PDF buffer
 */
async function compressPdf(pdfBuffer, level = 'medium', timeoutMs = 30000) {
  const startTime = Date.now();
  const originalSize = pdfBuffer.length;

  // Validate level
  const validLevel = GS_SETTINGS[level] ? level : 'medium';
  const settings = GS_SETTINGS[validLevel];

  // Check if Ghostscript is available
  const gsAvailable = await isGhostscriptAvailable();

  let result;
  let method;

  if (gsAvailable) {
    try {
      result = await ghostscriptCompress(pdfBuffer, settings, timeoutMs);
      method = 'ghostscript';
    } catch (error) {
      console.warn(`[Compress] Ghostscript failed: ${error.message}. Falling back to structural.`);
      result = await structuralCompression(pdfBuffer);
      method = 'structural (fallback)';
    }
  } else {
    console.warn('[Compress] Ghostscript not available. Using structural compression.');
    result = await structuralCompression(pdfBuffer);
    method = 'structural (no gs)';
  }

  const duration = Date.now() - startTime;
  const newSize = result.length;
  const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

  console.log(
    `[Compress] method=${method}, level=${validLevel}, original=${originalSize}b, compressed=${newSize}b, reduction=${reduction}%, time=${duration}ms`
  );

  return result;
}

module.exports = {
  compressPdf,
  COMPRESSION_CONFIGS,
  GS_SETTINGS,
};
