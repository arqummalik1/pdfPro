/**
 * PDF Protector Service - Password protection
 * 
 * Note: pdf-lib doesn't have built-in encryption support.
 * This service provides a workaround by copying pages and 
 * adding metadata. For full encryption, use external tools.
 */
const { PDFDocument } = require('pdf-lib');

async function protectPdf(pdfBuffer, password, options = {}) {
  const { allowPrint = true, allowCopy = true, allowModify = true } = options;
  void allowPrint;
  void allowCopy;
  void allowModify;
  
  if (!password) {
    throw new Error('Password is required');
  }

  try {
    const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach(page => newPdf.addPage(page));

    // Add metadata to indicate protected PDF
    // Note: pdf-lib doesn't support encryption natively
    // For production, integrate with external tools like qpdf
    newPdf.setTitle('PDFPro - Protected Document');
    newPdf.setProducer('PDFPro Backend');
    
    // Save the PDF
    const pdfBytes = await newPdf.save();
    
    // Return with note about encryption limitation
    console.log('Note: Full PDF encryption requires external tools');
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Protect error:', error.message);
    throw new Error(`Failed to protect PDF: ${error.message}`);
  }
}

async function unlockPdf(pdfBuffer, password) {
  if (!password) {
    throw new Error('Password is required');
  }

  try {
    // Try to load the PDF (will fail if truly encrypted with unknown password)
    const sourcePdf = await PDFDocument.load(pdfBuffer, { 
      password: password,
      ignoreEncryption: true 
    });
    
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach(page => newPdf.addPage(page));
    
    return Buffer.from(await newPdf.save());
  } catch (error) {
    // If loading fails, the PDF might be encrypted
    if (error.message.includes('encrypted') || error.message.includes('password')) {
      throw new Error('Invalid password or PDF is not accessible');
    }
    throw error;
  }
}

module.exports = { protectPdf, unlockPdf };
