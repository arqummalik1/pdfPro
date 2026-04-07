#!/usr/bin/env node
/**
 * PDF Compression Test Script
 * Tests all 3 compression levels and displays stats
 */

const fs = require('fs').promises;
const path = require('path');
const { compressPDFPipeline, getCompressionStats } = require('./src/services/compressionPipeline');

const TEST_FILE = process.argv[2] || './test.pdf';
const API_URL = process.env.API_URL || 'http://localhost:10000';

async function createTestPDF() {
  const { PDFDocument, rgb } = require('pdf-lib');

  const pdfDoc = await PDFDocument.create();

  // Add pages with text and some shapes to simulate content
  for (let i = 0; i < 5; i++) {
    const page = pdfDoc.addPage([600, 800]);

    // Add text
    page.drawText(`Test Page ${i + 1}`, {
      x: 50,
      y: 750,
      size: 30,
      color: rgb(0, 0, 0),
    });

    // Add some content to make it larger
    for (let j = 0; j < 20; j++) {
      page.drawText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(3), {
        x: 50,
        y: 700 - (j * 30),
        size: 12,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function testCompressionLevel(level, buffer) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${level.toUpperCase()} Compression`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    const result = await compressPDFPipeline(buffer, level);

    const duration = Date.now() - startTime;
    const { stats } = result;

    console.log(`Original Size:     ${formatBytes(stats.originalSize)}`);
    console.log(`Compressed Size:   ${formatBytes(stats.compressedSize)}`);
    console.log(`Reduction:         ${stats.reductionPercent}%`);
    console.log(`PDF Type:          ${stats.pdfType}`);
    console.log(`Pages:             ${stats.pageCount}`);
    console.log(`Images:            ${stats.imageCount}`);
    console.log(`Engines Used:      ${stats.enginesUsed.join(' → ')}`);
    console.log(`Processing Time:   ${stats.processingTimeMs}ms`);
    console.log(`Image Compression: ${stats.imageCompressionApplied ? 'Yes' : 'No'}`);

    // Save compressed file
    const outputPath = `./compressed-${level}.pdf`;
    await fs.writeFile(outputPath, result.buffer);
    console.log(`Output saved to:   ${outputPath}`);

    return {
      level,
      success: true,
      stats,
      duration,
    };
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return {
      level,
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function runTests() {
  console.log('\n🚀 PDF Compression Test Suite');
  console.log('Testing all 3 compression levels\n');

  let testBuffer;

  try {
    // Try to read test file
    testBuffer = await fs.readFile(TEST_FILE);
    console.log(`✓ Using test file: ${TEST_FILE} (${formatBytes(testBuffer.length)})`);
  } catch {
    console.log('✗ Test file not found, creating sample PDF...');
    testBuffer = await createTestPDF();
    await fs.writeFile('./test.pdf', testBuffer);
    console.log(`✓ Created test.pdf (${formatBytes(testBuffer.length)})`);
  }

  // Get pre-compression stats
  console.log('\n📊 Pre-Compression Analysis');
  console.log('-'.repeat(40));
  const preStats = await getCompressionStats(testBuffer);
  console.log(`PDF Type:        ${preStats.pdfType}`);
  console.log(`Pages:           ${preStats.pageCount}`);
  console.log(`Images:           ${preStats.imageCount}`);
  console.log(`File Size:       ${formatBytes(preStats.fileSize)}`);
  console.log(`Available Engines:`, Object.entries(preStats.availableEngines)
    .filter(([k]) => k !== 'all' && k !== 'any')
    .map(([k, v]) => `${k}:${v ? '✓' : '✗'}`).join(', '));

  // Test all levels
  const results = [];

  results.push(await testCompressionLevel('low', testBuffer));
  results.push(await testCompressionLevel('medium', testBuffer));
  results.push(await testCompressionLevel('high', testBuffer));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 COMPRESSION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);

  if (successful.length === 0) {
    console.log('❌ All tests failed');
    process.exit(1);
  }

  console.log('\nLevel    | Original | Compressed | Reduction | Time    | Engines');
  console.log('-'.repeat(70));

  for (const r of successful) {
    const { stats } = r;
    const orig = formatBytes(stats.originalSize).padEnd(8);
    const comp = formatBytes(stats.compressedSize).padEnd(10);
    const red = `${stats.reductionPercent}%`.padEnd(9);
    const time = `${stats.processingTimeMs}ms`.padEnd(7);
    const engines = stats.enginesUsed.join('→');
    console.log(`${r.level.padEnd(8)} | ${orig} | ${comp} | ${red} | ${time} | ${engines}`);
  }

  // Find best compression
  const best = successful.reduce((prev, current) =>
    prev.stats.reductionPercent > current.stats.reductionPercent ? prev : current
  );

  console.log('\n🏆 Best Result:');
  console.log(`   Level: ${best.level.toUpperCase()}`);
  console.log(`   Reduction: ${best.stats.reductionPercent}%`);
  console.log(`   Engines: ${best.stats.enginesUsed.join(' → ')}`);

  console.log('\n✅ All tests completed!\n');
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
