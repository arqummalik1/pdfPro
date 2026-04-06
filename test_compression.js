const fs = require('fs');
const path = require('path');
const { compressPdf, COMPRESSION_CONFIGS } = require('./backend/src/services/pdfCompressor');
const { PDFDocument } = require('pdf-lib');

async function createTestPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  page.drawText('Test PDF for compression', { x: 50, y: 700, size: 30 });
  
  // Add some content to make it bigger
  for (let i = 0; i < 100; i++) {
    page.drawText(`Line ${i}: This is test content for compression testing.`, { 
      x: 50, 
      y: 650 - (i * 6), 
      size: 12 
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function testCompression() {
  console.log('Creating test PDF...');
  const testPdf = await createTestPdf();
  console.log(`Original size: ${testPdf.length} bytes (${(testPdf.length/1024).toFixed(2)} KB)`);
  
  console.log('\nCompression configs available:', Object.keys(COMPRESSION_CONFIGS));
  
  for (const level of ['low', 'medium', 'maximum']) {
    console.log(`\n--- Testing ${level} compression ---`);
    try {
      const startTime = Date.now();
      const compressed = await compressPdf(testPdf, level, 30000);
      const duration = Date.now() - startTime;
      const reduction = ((1 - compressed.length / testPdf.length) * 100).toFixed(1);
      
      console.log(`  Compressed size: ${compressed.length} bytes (${(compressed.length/1024).toFixed(2)} KB)`);
      console.log(`  Reduction: ${reduction}%`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  ✓ ${level} compression works!`);
    } catch (error) {
      console.log(`  ✗ ${level} compression failed: ${error.message}`);
    }
  }
}

testCompression().catch(console.error);
