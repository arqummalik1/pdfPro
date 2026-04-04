/**
 * PDF Merger Service - Merge multiple PDFs
 */
const { PDFDocument } = require('pdf-lib');

async function mergePdfs(pdfBuffers) {
  try {
    const mergedPdf = await PDFDocument.create();
    for (const pdfBuffer of pdfBuffers) {
      if (!pdfBuffer || pdfBuffer.length === 0) continue;
      const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true, updateMetadata: false });
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }
    const pdfBytes = await mergedPdf.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  } catch (error) {
    throw new Error(`Failed to merge PDFs: ${error.message}`);
  }
}

module.exports = { mergePdfs };