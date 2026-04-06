const { PDFDocument, PDFName, PDFDict, PDFRawStream } = require('pdf-lib');
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

async function debugImageDetection(pdfBuffer) {
  console.log('\n=== DEBUG: Image Detection ===\n');
  
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  
  console.log(`Number of pages: ${pages.length}`);
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    console.log(`\n--- Page ${i + 1} ---`);
    
    const resources = page.node.Resources();
    if (!resources) {
      console.log('No resources found');
      continue;
    }
    
    const xObjects = resources.get(PDFName.of('XObject'));
    if (!xObjects) {
      console.log('No XObjects found');
      continue;
    }
    
    console.log('XObject entry type:', xObjects.constructor.name);
    
    // xObjects might be a PDFDict directly (not a reference)
    let dict;
    try {
      if (xObjects.constructor.name === 'PDFDict') {
        dict = xObjects;
      } else {
        dict = xObjects.lookup();
      }
      
      if (!dict || dict.constructor.name !== 'PDFDict') {
        console.log('Could not get XObject dict or not a PDFDict');
        continue;
      }
    } catch (e) {
      console.log('Error accessing XObject dict:', e.message);
      continue;
    }
    
    console.log('Dict type:', dict.constructor.name);
    console.log('Dict entries count:', [...dict.entries()].length);
    
    for (const [name, ref] of dict.entries()) {
      console.log(`\n  XObject name: ${name.encodedName}`);
      console.log(`  Ref type: ${ref.constructor.name}`);
      
      let xObject;
      try {
        xObject = pdfDoc.context.lookup(ref);
        console.log(`  XObject type: ${xObject.constructor.name}`);
      } catch (e) {
        console.log(`  Error looking up XObject: ${e.message}`);
        continue;
      }
      
      if (xObject.dict) {
        const subtype = xObject.dict.get(PDFName.of('Subtype'));
        console.log(`  Subtype: ${subtype?.encodedName || 'none'}`);
        
        if (subtype?.encodedName === '/Image') {
          console.log('  *** FOUND IMAGE ***');
          
          const width = xObject.dict.get(PDFName.of('Width'))?.value;
          const height = xObject.dict.get(PDFName.of('Height'))?.value;
          const filter = xObject.dict.get(PDFName.of('Filter'));
          
          console.log(`  Width: ${width}, Height: ${height}`);
          console.log(`  Filter: ${filter?.encodedName || 'none'}`);
          
          if (xObject instanceof PDFRawStream) {
            console.log(`  Raw stream size: ${xObject.contents.length} bytes`);
          } else if (xObject.contents) {
            console.log(`  Contents size: ${xObject.contents.length} bytes`);
          }
        }
      }
    }
  }
  
  console.log('\n=== End Debug ===\n');
}

async function main() {
  const testPdf = await createTestPdfWithImage();
  console.log(`\nOriginal PDF size: ${testPdf.length} bytes (${(testPdf.length/1024).toFixed(2)} KB)\n`);
  
  await debugImageDetection(testPdf);
}

main().catch(console.error);
