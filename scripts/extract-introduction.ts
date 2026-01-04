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

function extractIntroductionContent(): (string | { type: 'image'; src: string; alt: string; caption?: string })[] {
  // Load extracted content
  const extractedContentPath = path.join(process.cwd(), 'scripts', 'extracted-content.json');
  const extractedContent = JSON.parse(fs.readFileSync(extractedContentPath, 'utf-8'));

  // Load image mapping
  const imageMappingPath = path.join(process.cwd(), 'scripts', 'image-mapping.json');
  const imageMapping = JSON.parse(fs.readFileSync(imageMappingPath, 'utf-8'));

  // Get introduction pages (18-87 based on section detection)
  const introductionPages = extractedContent.pages.filter((page: PageContent) =>
    page.section === 'introduction'
  );

  // Get introduction images
  const introductionImages = imageMapping.allImages.filter((img: ImageInfo) =>
    img.section === 'introduction'
  );

  console.log(`Found ${introductionPages.length} introduction pages and ${introductionImages.length} images`);

  const result: (string | { type: 'image'; src: string; alt: string; caption?: string })[] = [];

  // Sort images by page number
  const sortedImages = introductionImages.sort((a: ImageInfo, b: ImageInfo) => a.pageNumber - b.pageNumber);

  let imageIndex = 0;

  for (const page of introductionPages) {
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
  console.log('Extracting introduction content...');
  const introductionContent = extractIntroductionContent();

  console.log(`Extracted ${introductionContent.length} content items (text + images)`);

  // Save to a temporary file for inspection
  const outputPath = path.join(process.cwd(), 'scripts', 'introduction-content.json');
  fs.writeFileSync(outputPath, JSON.stringify(introductionContent, null, 2));

  console.log(`Introduction content saved to: ${outputPath}`);

  // Count text vs images
  const textCount = introductionContent.filter(item => typeof item === 'string').length;
  const imageCount = introductionContent.filter(item => typeof item === 'object').length;

  console.log(`- Text paragraphs: ${textCount}`);
  console.log(`- Images: ${imageCount}`);
}

// main();
