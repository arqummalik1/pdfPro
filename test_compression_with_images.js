const { compressPdf, COMPRESSION_CONFIGS } = require('./backend/src/services/pdfCompressor');
const { PDFDocument, PDFImage } = require('pdf-lib');
const sharp = require('sharp');

async function createTestPdfWithImage() {
  console.log('Creating test PDF with embedded image...');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  
  // Create a sample image using sharp
  const imageBuffer = await sharp({
    create: {
      width: 2000,
      height: 1500,
      channels: 3,
      background: { r: 100, g: 150, b: 200 }
    }
  })
  .jpeg({ quality: 90 })
  .toBuffer();
  
  console.log(`Created test image: ${(imageBuffer.length/1024).toFixed(2)} KB`);
  
  // Embed the image in the PDF
  const image = await pdfDoc.embedJpg(imageBuffer);
  const { width, height } = image.scale(0.5);
  
  page.drawImage(image, {
    x: 50,
    y: 400,
    width: width,
    height: height,
  });
  
  page.drawText('Test PDF with Image for Compression', { x: 50, y: 750, size: 20 });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function testCompression() {
  console.log('\n========================================');
  console.log('PDF Compression Test with Images');
  console.log('========================================\n');
  
  const testPdf = await createTestPdfWithImage();
  const originalSize = testPdf.length;
  console.log(`\nOriginal PDF size: ${originalSize} bytes (${(originalSize/1024).toFixed(2)} KB)`);
  console.log('Compression configs available:', Object.keys(COMPRESSION_CONFIGS));
  
  console.log('\n----------------------------------------');
  
  for (const level of ['low', 'medium', 'maximum']) {
    console.log(`\n>>> Testing ${level.toUpperCase()} compression <<<`);
    try {
      const startTime = Date.now();
      const compressed = await compressPdf(testPdf, level, 30000);
      const duration = Date.now() - startTime;
      const compressedSize = compressed.length;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      
      console.log(`  Compressed size: ${compressedSize} bytes (${(compressedSize/1024).toFixed(2)} KB)`);
      console.log(`  Size reduction: ${reduction}%`);
      console.log(`  Processing time: ${duration}ms`);
      
      if (compressedSize < originalSize * 0.95) {
        console.log(`  ✓ SUCCESS: Compression achieved significant size reduction`);
      } else {
        console.log(`  ⚠ Note: Minimal compression (may be text-heavy or already optimized)`);
      }
    } catch (error) {
      console.log(`  ✗ FAILED: ${error.message}`);
      console.error(error);
    }
  }
  
  console.log('\n----------------------------------------');
  console.log('Test complete!');
  console.log('========================================\n');
}

testCompression().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
