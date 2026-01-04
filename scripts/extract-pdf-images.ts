import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function extractImagesFromPDF(pdfPath: string, outputDir: string): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read the PDF file
  const pdfBytes = await readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  console.log(`Processing PDF with ${pdfDoc.getPageCount()} pages...`);

  let imageCount = 0;

  // Process each page
  for (let pageIndex = 0; pageIndex < pdfDoc.getPageCount(); pageIndex++) {
    const page = pdfDoc.getPage(pageIndex);
    const pageNumber = pageIndex + 1;

    console.log(`Processing page ${pageNumber}...`);

    // Get resources from the page
    const resources = page.node.Resources();
    if (!resources) continue;

    // Check for XObject resources (images)
    const xObjects = resources.XObject;
    if (!xObjects) continue;

    const xObjectKeys = xObjects.keys();

    for (const key of xObjectKeys) {
      try {
        const xObject = xObjects.get(key);
        if (!xObject) continue;

        // Check if it's an image
        const subtype = xObject.get('Subtype');
        if (subtype?.name !== 'Image') continue;

        // Extract image data
        const imageStream = xObject.get('stream');
        if (!imageStream) continue;

        const imageBytes = imageStream.decode();
        if (!imageBytes || imageBytes.length === 0) continue;

        // Determine image format
        const filter = xObject.get('Filter');
        let extension = 'png'; // Default

        if (filter) {
          const filterName = Array.isArray(filter) ? filter[0].name : filter.name;
          switch (filterName) {
            case 'DCTDecode':
              extension = 'jpg';
              break;
            case 'FlateDecode':
              extension = 'png';
              break;
            case 'JBIG2Decode':
              extension = 'png';
              break;
            default:
              extension = 'png';
          }
        }

        // Generate filename
        imageCount++;
        const filename = `page_${pageNumber}_img_${imageCount}.${extension}`;
        const outputPath = join(outputDir, filename);

        // Save the image
        await writeFile(outputPath, imageBytes);
        console.log(`Extracted image: ${filename}`);

      } catch (error) {
        console.warn(`Failed to extract image from page ${pageNumber}, key ${key}:`, error);
      }
    }
  }

  console.log(`\nExtraction complete! Extracted ${imageCount} images to ${outputDir}`);
}

async function main() {
  const pdfPath = join(process.cwd(), 'public', 'Tese_fixed_references.pdf');
  const outputDir = join(process.cwd(), 'public', 'images', 'methodology');

  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF file not found at: ${pdfPath}`);
    process.exit(1);
  }

  console.log('Extracting images from PDF...');
  await extractImagesFromPDF(pdfPath, outputDir);
  console.log('Image extraction completed successfully!');
}

main().catch(console.error);
