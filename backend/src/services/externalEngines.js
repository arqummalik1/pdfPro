/**
 * External Engine Wrappers
 * Shell wrappers for qpdf and pdfcpu binaries
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const execAsync = promisify(exec);

// Configuration
const PDFCPU_PATH = process.env.PDFCPU_PATH || './pdfcpu';
const QPDF_PATH = process.env.QPDF_PATH || 'qpdf';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Run qpdf linearization/optimization
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @param {Object} options - Options
 * @param {number} options.timeout - Timeout in ms (default 30000)
 * @returns {Promise<Buffer>} Optimized PDF buffer
 */
async function runQpdf(inputBuffer, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const tempId = uuidv4();
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `qpdf-input-${tempId}.pdf`);
  const outputPath = path.join(tempDir, `qpdf-output-${tempId}.pdf`);

  try {
    // Write input to temp file
    await fs.writeFile(inputPath, inputBuffer);

    // Run qpdf --linearize for web-optimized PDF
    const command = `${QPDF_PATH} --linearize "${inputPath}" "${outputPath}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });

    if (stderr && stderr.includes('error')) {
      throw new Error(`qpdf error: ${stderr}`);
    }

    // Read output
    const outputBuffer = await fs.readFile(outputPath);

    console.log(`[ExternalEngines] qpdf: ${inputBuffer.length} → ${outputBuffer.length} bytes (${((1 - outputBuffer.length / inputBuffer.length) * 100).toFixed(1)}% reduction)`);

    return outputBuffer;
  } catch (error) {
    console.error('[ExternalEngines] qpdf failed:', error.message);
    throw error;
  } finally {
    // Cleanup temp files
    try {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run pdfcpu optimization
 * @param {Buffer} inputBuffer - Input PDF buffer
 * @param {Object} options - Options
 * @param {number} options.timeout - Timeout in ms (default 30000)
 * @returns {Promise<Buffer>} Optimized PDF buffer
 */
async function runPdfcpu(inputBuffer, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const tempId = uuidv4();
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `pdfcpu-input-${tempId}.pdf`);
  const outputPath = path.join(tempDir, `pdfcpu-output-${tempId}.pdf`);

  try {
    // Write input to temp file
    await fs.writeFile(inputPath, inputBuffer);

    // Run pdfcpu optimize
    const command = `${PDFCPU_PATH} optimize "${inputPath}" "${outputPath}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });

    // pdfcpu can write info to stderr even on success
    if (stderr && stderr.includes('Error')) {
      throw new Error(`pdfcpu error: ${stderr}`);
    }

    // Read output
    const outputBuffer = await fs.readFile(outputPath);

    console.log(`[ExternalEngines] pdfcpu: ${inputBuffer.length} → ${outputBuffer.length} bytes (${((1 - outputBuffer.length / inputBuffer.length) * 100).toFixed(1)}% reduction)`);

    return outputBuffer;
  } catch (error) {
    console.error('[ExternalEngines] pdfcpu failed:', error.message);
    throw error;
  } finally {
    // Cleanup temp files
    try {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Check if qpdf is available
 * @returns {Promise<boolean>}
 */
async function isQpdfAvailable() {
  try {
    const { stdout } = await execAsync(`${QPDF_PATH} --version`, { timeout: 5000 });
    return stdout.includes('qpdf');
  } catch (error) {
    return false;
  }
}

/**
 * Check if pdfcpu is available
 * @returns {Promise<boolean>}
 */
async function isPdfcpuAvailable() {
  try {
    const { stdout } = await execAsync(`${PDFCPU_PATH} version`, { timeout: 5000 });
    return stdout.includes('pdfcpu');
  } catch (error) {
    return false;
  }
}

/**
 * Get available external engines
 * @returns {Promise<Object>} Object with boolean flags for each engine
 */
async function getAvailableEngines() {
  const [qpdf, pdfcpu] = await Promise.all([
    isQpdfAvailable(),
    isPdfcpuAvailable(),
  ]);

  return {
    qpdf,
    pdfcpu,
    all: qpdf && pdfcpu,
    any: qpdf || pdfcpu,
  };
}

module.exports = {
  runQpdf,
  runPdfcpu,
  isQpdfAvailable,
  isPdfcpuAvailable,
  getAvailableEngines,
  DEFAULT_TIMEOUT,
};
