/**
 * PDF Rotator Service - Rotate PDF pages
 */
const { PDFDocument, degrees } = require('pdf-lib');

async function rotatePdf(pdfBuffer, rotation = 90) {
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach(page => {
    const current = page.getRotation().angle;
    page.setRotation(degrees(current + rotation));
    newPdf.addPage(page);
  });
  return Buffer.from(await newPdf.save());
}

async function rotateToOrientation(pdfBuffer, orientation) {
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach(page => {
    const { width, height } = page.getSize();
    const isLandscape = width > height;
    if (orientation === 'landscape' && !isLandscape) {
      page.setRotation(degrees(page.getRotation().angle + 90));
    } else if (orientation === 'portrait' && isLandscape) {
      page.setRotation(degrees(page.getRotation().angle + 90));
    }
    newPdf.addPage(page);
  });
  return Buffer.from(await newPdf.save());
}

module.exports = { rotatePdf, rotateToOrientation };