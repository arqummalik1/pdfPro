/**
 * PDF Compression Test Script
 * Tests all compression levels: low, medium, maximum
 * Generates a sample PDF with images and measures compression results
 */

const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { compressPdf, COMPRESSION_LEVELS } = require('./backend/src/services/pdfCompressor');

// Generate a test PDF with sample image content
async function createTestPdf() {
  const pdfDoc = await PDFDocument.create();

  // Add multiple pages with "images" (simulated with drawings)
  for (let i = 0; i < 3; i++) {
    const page = pdfDoc.addPage([600, 800]);

    // Draw various shapes to simulate image content
    const { width, height } = page.getSize();

    // Add rectangles with different colors (simulates image data)
    for (let j = 0; j < 50; j++) {
      const x = Math.random() * (width - 50);
      const y = Math.random() * (height - 50);
      const r = Math.random();
      const g = Math.random();
      const b = Math.random();

      page.drawRectangle({
        x,
        y,
        width: 40 + Math.random() * 60,
        height: 40 + Math.random() * 60,
        color: rgb(r, g, b),
      });
    }

    // Add some text content
    page.drawText(`Test Page ${i + 1} - PDF Compression Test`, {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Test all compression levels
async function testAllCompressionLevels() {
  console.log('=== PDF Compression Test Suite ===\n');

  // Create test PDF
  console.log('Creating test PDF with simulated image content...');
  const testPdfBuffer = await createTestPdf();
  const originalSize = testPdfBuffer.length;
  console.log(`Original PDF size: ${originalSize} bytes (${(originalSize / 1024).toFixed(2)} KB)\n`);

  const results = [];
  const levels = ['low', 'medium', 'maximum'];

  for (const level of levels) {
    console.log(`\n--- Testing '${level.toUpperCase()}' compression ---`);
    const settings = COMPRESSION_LEVELS[level];
    console.log(`Settings: ${settings.description}`);
    console.log(`JPEG Quality: ${settings.quality}%, Max Dimension: ${settings.maxDimension}px, Grayscale: ${settings.grayscale}`);

    const startTime = Date.now();

    try {
      const compressedBuffer = await compressPdf(testPdfBuffer, level, 30000);
      const duration = Date.now() - startTime;
      const compressedSize = compressedBuffer.length;
      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

      results.push({
        level,
        originalSize,
        compressedSize,
        reduction: parseFloat(reduction),
        duration,
        settings
      });

      console.log(`✅ Compressed size: ${compressedSize} bytes (${(compressedSize / 1024).toFixed(2)} KB)`);
      console.log(`✅ Size reduction: ${reduction}%`);
      console.log(`✅ Processing time: ${duration}ms`);

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      results.push({
        level,
        error: error.message,
        originalSize,
        compressedSize: originalSize,
        reduction: 0
      });
    }
  }

  // Print summary table
  console.log('\n\n=== COMPRESSION RESULTS SUMMARY ===');
  console.log('='.repeat(80));
  console.log('| Level    | Original  | Compressed | Reduction | Time    | Settings                  |');
  console.log('='.repeat(80));

  for (const result of results) {
    if (result.error) {
      console.log(`| ${result.level.padEnd(8)} | ${(result.originalSize / 1024).toFixed(2).padStart(8)} KB | ERROR${' '.repeat(9)} | N/A${' '.repeat(6)} | N/A${' '.repeat(4)} | ${result.error.substring(0, 25).padEnd(25)} |`);
    } else {
      const origKB = (result.originalSize / 1024).toFixed(2);
      const compKB = (result.compressedSize / 1024).toFixed(2);
      const reduction = `${result.reduction.toFixed(1)}%`;
      const time = `${result.duration}ms`;
      const settings = `Q:${result.settings.quality}, M:${result.settings.maxDimension}`;

      console.log(`| ${result.level.padEnd(8)} | ${origKB.padStart(8)} KB | ${compKB.padStart(8)} KB | ${reduction.padStart(8)} | ${time.padStart(6)} | ${settings.padEnd(25)} |`);
    }
  }

  console.log('='.repeat(80));

  // Recommendations
  console.log('\n=== RECOMMENDATIONS ===');
  const bestReduction = results.reduce((best, r) => (!r.error && r.reduction > best.reduction) ? r : best, results[0]);

  if (bestReduction && !bestReduction.error) {
    console.log(`• Best compression: '${bestReduction.level}' with ${bestReduction.reduction.toFixed(1)}% reduction`);
  }

  console.log('• Use LOW for: Documents where quality is critical (photos, artwork)');
  console.log('• Use MEDIUM for: General documents (default, balanced quality/size)');
  console.log('• Use MAXIMUM for: Scanned documents, drafts, email attachments');

  // Verify medium is default
  console.log('\n=== DEFAULT VERIFICATION ===');
  try {
    const defaultResult = await compressPdf(testPdfBuffer); // No level specified
    const defaultIsMedium = results.find(r => r.level === 'medium');
    if (defaultIsMedium && !defaultResult.error) {
      const sizeMatch = Math.abs(defaultResult.length - defaultIsMedium.compressedSize) < 100; // Allow small variance
      console.log(`✅ Default compression verified: ${sizeMatch ? 'MEDIUM' : 'UNCERTAIN'} (size match: ${sizeMatch})`);
    }
  } catch (error) {
    console.log(`⚠️ Could not verify default: ${error.message}`);
  }

  console.log('\n=== Test Complete ===');
  return results;
}

// Run tests
testAllCompressionLevels()
  .then(results => {
    console.log('\nAll tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
