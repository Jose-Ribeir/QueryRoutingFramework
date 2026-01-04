import fs from 'fs';
import path from 'path';

interface CaptionMapping {
  [pageNumber: string]: {
    [imageIndex: string]: string;
  };
}

function extractPageAndIndex(filename: string): { pageNumber: number; imageIndex: number } | null {
  // Match patterns like: page_88_img_1.png
  const match = filename.match(/page_(\d+)_img_(\d+)\.png/);
  if (match) {
    return {
      pageNumber: parseInt(match[1], 10),
      imageIndex: parseInt(match[2], 10),
    };
  }
  return null;
}

function getCaption(pageNumber: number, imageIndex: number, captionMapping: CaptionMapping): string | null {
  const pageKey = pageNumber.toString();
  const imageKey = imageIndex.toString();

  if (captionMapping[pageKey] && captionMapping[pageKey][imageKey]) {
    return captionMapping[pageKey][imageKey];
  }

  return null;
}

function fixImageCaptions() {
  console.log('Loading caption mapping...');

  // Load the caption mapping
  const captionsPath = path.join(process.cwd(), 'scripts', 'image-captions.json');
  const captionMapping: CaptionMapping = JSON.parse(fs.readFileSync(captionsPath, 'utf-8'));

  // Load thesis content
  const thesisContentPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  let thesisContent = fs.readFileSync(thesisContentPath, 'utf-8');

  console.log('Fixing image captions...');

  let updatedCount = 0;

  // Regex to match image objects in the content
  const imageRegex = /\{\s*"type":\s*"image",\s*"src":\s*"([^"]+)",\s*"alt":\s*"([^"]+)",\s*"caption":\s*"([^"]+)"\s*\}/g;

  thesisContent = thesisContent.replace(imageRegex, (match, src, alt, caption) => {
    // Extract filename from src path
    const filename = src.split('/').pop();
    if (!filename) return match;

    // Extract page number and image index
    const pageInfo = extractPageAndIndex(filename);
    if (!pageInfo) {
      console.log(`Warning: Could not extract page info from ${filename}`);
      return match;
    }

    // Get the correct caption
    const correctCaption = getCaption(pageInfo.pageNumber, pageInfo.imageIndex, captionMapping);
    if (!correctCaption) {
      console.log(`Warning: No caption found for page ${pageInfo.pageNumber}, image ${pageInfo.imageIndex}`);
      return match;
    }

    // Create the correct alt text
    const correctAlt = `Page ${pageInfo.pageNumber} Image - ${correctCaption}`;

    // Replace the image object with corrected values
    const correctedMatch = match
      .replace(/"alt":\s*"[^"]*"/, `"alt": "${correctAlt}"`)
      .replace(/"caption":\s*"[^"]*"/, `"caption": "${correctCaption}"`);

    updatedCount++;
    console.log(`Updated: ${filename} -> "${correctCaption}"`);

    return correctedMatch;
  });

  // Write back the updated thesis content
  fs.writeFileSync(thesisContentPath, thesisContent, 'utf-8');

  console.log(`\nCaption fix complete! Updated ${updatedCount} image captions.`);

  // Summary of changes
  console.log('\nSummary of changes:');
  Object.entries(captionMapping).forEach(([pageNum, images]) => {
    Object.entries(images).forEach(([imgIdx, caption]) => {
      console.log(`Page ${pageNum}, Image ${imgIdx}: ${caption}`);
    });
  });
}

function main() {
  console.log('Starting image caption fix process...');
  fixImageCaptions();
  console.log('Image caption fix process completed!');
}

main();
