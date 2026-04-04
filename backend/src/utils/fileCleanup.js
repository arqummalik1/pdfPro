/**
 * File Cleanup Utility
 */
const fs = require('fs-extra');
const path = require('path');

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/pdfpro';
const MAX_FILE_AGE = process.env.MAX_FILE_AGE_MS || 60 * 60 * 1000;

async function initTempDir() { await fs.ensureDir(TEMP_DIR); }

async function cleanupOldFiles() {
  try {
    await initTempDir();
    const now = Date.now();
    const files = await fs.readdir(TEMP_DIR);
    let cleaned = 0;
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile() && (now - stats.mtimeMs) > MAX_FILE_AGE) {
          await fs.remove(filePath);
          cleaned++;
        }
      } catch { /* skip */ }
    }
    if (cleaned > 0) console.log(`Cleaned ${cleaned} old files`);
    return cleaned;
  } catch (error) {
    console.error('Cleanup error:', error);
    return 0;
  }
}

module.exports = { cleanupOldFiles, initTempDir, TEMP_DIR };