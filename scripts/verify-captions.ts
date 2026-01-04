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

function verifyCaptions() {
  console.log('Verifying image caption mappings...');

  // Load the caption mapping
  const captionsPath = path.join(process.cwd(), 'scripts', 'image-captions.json');
  const captionMapping: CaptionMapping = JSON.parse(fs.readFileSync(captionsPath, 'utf-8'));

  // Load thesis content
  const thesisContentPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  const thesisContent = fs.readFileSync(thesisContentPath, 'utf-8');

  // Extract all image objects
  const imageRegex = /\{\s*"type":\s*"image",\s*"src":\s*"([^"]+)",\s*"alt":\s*"([^"]+)",\s*"caption":\s*"([^"]+)"\s*\}/g;
  const images: Array<{src: string, alt: string, caption: string, filename: string}> = [];

  let match;
  while ((match = imageRegex.exec(thesisContent)) !== null) {
    const src = match[1];
    const alt = match[2];
    const caption = match[3];
    const filename = src.split('/').pop() || '';

    images.push({ src, alt, caption, filename });
  }

  console.log(`Found ${images.length} images in thesis-content.ts`);

  let correctMappings = 0;
  let incorrectMappings = 0;

  for (const image of images) {
    const pageInfo = extractPageAndIndex(image.filename);
    if (!pageInfo) {
      console.log(`❌ Could not extract page info from ${image.filename}`);
      incorrectMappings++;
      continue;
    }

    const expectedCaption = captionMapping[pageInfo.pageNumber.toString()]?.[pageInfo.imageIndex.toString()];
    if (!expectedCaption) {
      console.log(`⚠️  No expected caption found for page ${pageInfo.pageNumber}, image ${pageInfo.imageIndex} (${image.filename})`);
      incorrectMappings++;
      continue;
    }

    const expectedAlt = `Page ${pageInfo.pageNumber} Image - ${expectedCaption}`;

    if (image.caption === expectedCaption && image.alt === expectedAlt) {
      console.log(`✅ ${image.filename}: Correctly mapped`);
      correctMappings++;
    } else {
      console.log(`❌ ${image.filename}: Mismatch`);
      console.log(`   Expected caption: "${expectedCaption}"`);
      console.log(`   Actual caption:   "${image.caption}"`);
      console.log(`   Expected alt:     "${expectedAlt}"`);
      console.log(`   Actual alt:       "${image.alt}"`);
      incorrectMappings++;
    }
  }

  console.log(`\nVerification complete:`);
  console.log(`✅ Correct mappings: ${correctMappings}`);
  console.log(`❌ Incorrect mappings: ${incorrectMappings}`);
  console.log(`📊 Total images: ${images.length}`);

  if (incorrectMappings === 0) {
    console.log('\n🎉 All image captions are correctly mapped!');
  } else {
    console.log(`\n⚠️  ${incorrectMappings} images have incorrect caption mappings.`);
  }
}

verifyCaptions();
