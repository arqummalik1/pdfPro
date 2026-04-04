/**
 * PDF Signer Service - Add signatures
 */
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function addSignature(pdfBuffer, signatureImage, options = {}) {
  const { pageNumber = 1, x = 100, y = 100, width = 200, opacity = 1 } = options;
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  let img;
  try { img = await newPdf.embedPng(signatureImage); } catch { img = await newPdf.embedJpg(signatureImage); }
  const scaled = img.scale(width / img.width);
  const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach((page, i) => {
    newPdf.addPage(page);
    if (i === pageNumber - 1) page.drawImage(img, { x, y, width: scaled.width, height: scaled.height, opacity });
  });
  return Buffer.from(await newPdf.save());
}

async function addTypedSignature(pdfBuffer, signatureText, options = {}) {
  const { pageNumber = 1, x = 100, y = 100, fontSize = 20 } = options;
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const font = await newPdf.embedFont(StandardFonts.Cursive);
  const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach((page, i) => {
    newPdf.addPage(page);
    if (i === pageNumber - 1) page.drawText(signatureText, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
  });
  return Buffer.from(await newPdf.save());
}

module.exports = { addSignature, addTypedSignature };