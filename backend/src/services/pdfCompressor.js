/**
 * PDF Compressor Service - Compress PDF size
 */
const { PDFDocument } = require('pdf-lib');

async function compressPdf(pdfBuffer, level = 'medium') {
  void level;

  try {
    const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach(page => newPdf.addPage(page));
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  } catch (error) {
    throw new Error(`Failed to compress PDF: ${error.message}`);
  }
}

module.exports = { compressPdf };
