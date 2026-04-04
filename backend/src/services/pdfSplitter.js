/**
 * PDF Splitter Service - Split/Extract pages
 */
const { PDFDocument } = require('pdf-lib');

async function splitPdfToPages(pdfBuffer) {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const result = [];
  for (let i = 0; i < sourcePdf.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(sourcePdf, [i]);
    newPdf.addPage(page);
    result.push(Buffer.from(await newPdf.save()));
  }
  return result;
}

async function splitPdfByRanges(pdfBuffer, ranges) {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const result = [];
  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const indices = [];
    for (let i = range.start - 1; i < range.end; i++) indices.push(i);
    const pages = await newPdf.copyPages(sourcePdf, indices);
    pages.forEach(p => newPdf.addPage(p));
    result.push(Buffer.from(await newPdf.save()));
  }
  return result;
}

async function splitPdfEveryN(pdfBuffer, pagesPerFile) {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const pageCount = sourcePdf.getPageCount();
  const normalizedPagesPerFile = Math.max(1, pagesPerFile);
  const ranges = [];

  for (let start = 1; start <= pageCount; start += normalizedPagesPerFile) {
    ranges.push({
      start,
      end: Math.min(start + normalizedPagesPerFile - 1, pageCount),
    });
  }

  return splitPdfByRanges(pdfBuffer, ranges);
}

async function extractPages(pdfBuffer, pageNumbers) {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();
  const indices = pageNumbers.filter(p => p >= 1 && p <= sourcePdf.getPageCount()).map(p => p - 1);
  const pages = await newPdf.copyPages(sourcePdf, indices);
  pages.forEach(p => newPdf.addPage(p));
  return Buffer.from(await newPdf.save());
}

module.exports = { splitPdfToPages, splitPdfByRanges, splitPdfEveryN, extractPages };
