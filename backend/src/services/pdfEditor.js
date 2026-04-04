/**
 * PDF Editor Service - Delete, reorder pages
 */
const { PDFDocument } = require('pdf-lib');

async function deletePages(pdfBuffer, pagesToDelete) {
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const total = sourcePdf.getPageCount();
  const deleteIndices = pagesToDelete.filter(p => p >= 1 && p <= total).map(p => p - 1);
  const keepIndices = Array.from({ length: total }, (_, i) => i).filter(i => !deleteIndices.includes(i));
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, keepIndices);
  pages.forEach(page => newPdf.addPage(page));
  return Buffer.from(await newPdf.save());
}

async function reorderPages(pdfBuffer, newOrder) {
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  for (const pageNum of newOrder) {
    if (pageNum >= 1 && pageNum <= sourcePdf.getPageCount()) {
      const [page] = await newPdf.copyPages(sourcePdf, [pageNum - 1]);
      newPdf.addPage(page);
    }
  }
  return Buffer.from(await newPdf.save());
}

async function reversePages(pdfBuffer) {
  const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  for (let i = sourcePdf.getPageCount() - 1; i >= 0; i--) {
    const [page] = await newPdf.copyPages(sourcePdf, [i]);
    newPdf.addPage(page);
  }
  return Buffer.from(await newPdf.save());
}

module.exports = { deletePages, reorderPages, reversePages };