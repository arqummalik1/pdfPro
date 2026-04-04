/**
 * PDF Watermarker Service - Add watermark/text
 */
const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');

async function addTextWatermark(pdfBuffer, options = {}) {
  const { text = 'WATERMARK', fontSize = 48, opacity = 0.3, rotation = -45, position = 'center' } = options;
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const font = await newPdf.embedFont(StandardFonts.HelveticaBold);
  const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    newPdf.addPage(page);
    const overlay = newPdf.addPage([width, height]);
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    let x, y;
    switch (position) {
      case 'top-left': x = 50; y = height - textHeight - 50; break;
      case 'top-right': x = width - textWidth - 50; y = height - textHeight - 50; break;
      case 'bottom-left': x = 50; y = 50; break;
      case 'bottom-right': x = width - textWidth - 50; y = 50; break;
      default: x = (width - textWidth) / 2; y = (height - textHeight) / 2;
    }
    overlay.drawText(text, { x, y, size: fontSize, font, color: rgb(0.5, 0.5, 0.5), opacity, rotate: degrees(rotation) });
  }
  return Buffer.from(await newPdf.save());
}

async function addPageNumbers(pdfBuffer, options = {}) {
  const { position = 'bottom-center', startNumber = 1, fontSize = 12 } = options;
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const font = await newPdf.embedFont(StandardFonts.Helvetica);
  const totalPages = sourcePdf.getPageCount();
  const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  
  pages.forEach((page, index) => {
    newPdf.addPage(page);
    const { width } = page.getSize();
    const num = startNumber + index;
    const text = `Page ${num} of ${totalPages}`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    let x;
    switch (position) {
      case 'bottom-left': x = 50; break;
      case 'bottom-right': x = width - textWidth - 50; break;
      default: x = (width - textWidth) / 2;
    }
    page.drawText(text, { x, y: 30, size: fontSize, font, color: rgb(0, 0, 0) });
  });
  return Buffer.from(await newPdf.save());
}

module.exports = { addTextWatermark, addPageNumbers };