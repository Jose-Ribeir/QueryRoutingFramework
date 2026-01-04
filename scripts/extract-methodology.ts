import fs from 'fs';
import path from 'path';

interface ImageInfo {
  filename: string;
  pageNumber: number;
  path: string;
  section: string;
}

interface PageContent {
  pageNumber: number;
  text: string;
  section: string;
}

function cleanText(text: string): string[] {
  // Remove page numbers, headers, and other artifacts
  let cleaned = text
    .replace(/\n\d+\n/g, '\n') // Remove page numbers
    .replace(/^\s*\d+\s*$/gm, '') // Remove standalone numbers
    .replace(/^\s*-\s*\d+\s*-\s*$/gm, '') // Remove page separators like "- 15 -"
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
    .replace(/^\s*Contents.*$/gm, '') // Remove table of contents
    .replace(/^\s*\d+\s+.*?\d+$/gm, '') // Remove TOC entries
    .replace(/^\s*[A-Z][a-z]+.*?\d+$/gm, '') // Remove TOC subsections
    .trim();

  // Split into paragraphs based on double newlines
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !/^\d+$/.test(p) && !/^-\s*\d+\s*-$/.test(p));

  return paragraphs;
}

function extractMethodologyContent(): (string | { type: 'image'; src: string; alt: string; caption?: string })[] {
  // Load extracted content
  const extractedContentPath = path.join(process.cwd(), 'scripts', 'extracted-content.json');
  const extractedContent = JSON.parse(fs.readFileSync(extractedContentPath, 'utf-8'));

  // Load image mapping
  const imageMappingPath = path.join(process.cwd(), 'scripts', 'image-mapping.json');
  const imageMapping = JSON.parse(fs.readFileSync(imageMappingPath, 'utf-8'));

  // Get methodology pages (88-127 based on section detection)
  const methodologyPages = extractedContent.pages.filter((page: PageContent) =>
    page.pageNumber >= 88 && page.pageNumber <= 127
  );

  // Get methodology images
  const methodologyImages = imageMapping.allImages.filter((img: ImageInfo) =>
    img.pageNumber >= 88 && img.pageNumber <= 127
  );

  console.log(`Found ${methodologyPages.length} methodology pages and ${methodologyImages.length} images`);

  const result: (string | { type: 'image'; src: string; alt: string; caption?: string })[] = [];

  // Sort images by page number
  const sortedImages = methodologyImages.sort((a: ImageInfo, b: ImageInfo) => a.pageNumber - b.pageNumber);

  let imageIndex = 0;

  for (const page of methodologyPages) {
    // Clean and split page text into paragraphs
    const paragraphs = cleanText(page.text);

    // Add paragraphs and insert images where appropriate
    for (const paragraph of paragraphs) {
      // Check if there are images on this page that should be inserted
      while (imageIndex < sortedImages.length &&
             sortedImages[imageIndex].pageNumber === page.pageNumber) {
        const img = sortedImages[imageIndex];

        // Try to extract caption from nearby text
        let caption = `Page ${img.pageNumber} Image`;
        // Look for figure captions in the text
        const figureMatch = page.text.match(/Figure\s+\d+.*?(?=\n|$)/i);
        if (figureMatch) {
          caption = figureMatch[0].trim();
        }

        result.push({
          type: 'image',
          src: img.path,
          alt: `Page ${img.pageNumber} Image - ${caption}`,
          caption: caption
        });

        imageIndex++;
      }

      // Add the paragraph if it's substantial enough
      if (paragraph.length > 50) { // Filter out very short fragments
        result.push(paragraph);
      }
    }
  }

  // Add any remaining images
  while (imageIndex < sortedImages.length) {
    const img = sortedImages[imageIndex];
    result.push({
      type: 'image',
      src: img.path,
      alt: `Page ${img.pageNumber} Image`,
      caption: `Page ${img.pageNumber}`
    });
    imageIndex++;
  }

  return result;
}

function main() {
  console.log('Extracting methodology content...');
  const methodologyContent = extractMethodologyContent();

  console.log(`Extracted ${methodologyContent.length} content items (text + images)`);

  // Save to a temporary file for inspection
  const outputPath = path.join(process.cwd(), 'scripts', 'methodology-content.json');
  fs.writeFileSync(outputPath, JSON.stringify(methodologyContent, null, 2));

  console.log(`Methodology content saved to: ${outputPath}`);

  // Count text vs images
  const textCount = methodologyContent.filter(item => typeof item === 'string').length;
  const imageCount = methodologyContent.filter(item => typeof item === 'object').length;

  console.log(`- Text paragraphs: ${textCount}`);
  console.log(`- Images: ${imageCount}`);
}

main();
