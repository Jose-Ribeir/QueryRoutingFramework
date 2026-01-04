import * as fs from 'fs';
import * as path from 'path';
import {
  parseAllInfoFiles,
  folderNameToImageSrc,
  normalizeText,
  ImagePlacement
} from './fix-image-placements';

// Import the actual content (we'll need to compile it first or use a different approach)
// For now, let's use a text-based approach that's safer

interface ImageUpdate {
  src: string;
  caption: string;
  alt: string;
  textBefore: string;
  textAfter: string;
}

// Find all image objects in content string and extract their positions
function findImageObjects(content: string): Array<{ src: string; start: number; end: number; fullMatch: string }> {
  const images: Array<{ src: string; start: number; end: number; fullMatch: string }> = [];
  const imageRegex = /\{\s*"type":\s*"image",\s*"src":\s*"([^"]+)",\s*"alt":\s*"([^"]*)",\s*(?:"caption":\s*"([^"]*)",?\s*)?\}/g;
  
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      src: match[1],
      start: match.index,
      end: match.index + match[0].length,
      fullMatch: match[0]
    });
  }
  
  return images;
}

// Find text position in content
function findTextInContent(content: string, searchText: string, startPos: number = 0): number {
  const normalizedSearch = normalizeText(searchText);
  const searchSnippet = normalizedSearch.substring(0, Math.min(150, normalizedSearch.length));
  
  // Search for the text in string literals
  const stringRegex = /"([^"\\]*(\\.[^"\\]*)*)"/g;
  let match;
  let bestMatch = -1;
  let bestScore = 0;
  
  while ((match = stringRegex.exec(content)) !== null) {
    if (match.index < startPos) continue;
    
    const text = match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
    const normalizedText = normalizeText(text);
    
    // Check if search text appears in this string
    if (normalizedText.includes(searchSnippet)) {
      const score = searchSnippet.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = match.index;
      }
    }
  }
  
  return bestMatch;
}

// Main function to fix image placements
function main() {
  console.log('Step 1: Parsing image placements from info.txt files...');
  const placements = parseAllInfoFiles();
  console.log(`Found ${placements.length} image placements\n`);
  
  // Create a map of image src to placement info
  const placementMap = new Map<string, ImagePlacement>();
  for (const placement of placements) {
    const imageSrc = folderNameToImageSrc(placement.folderName);
    placementMap.set(imageSrc, placement);
    
    // Also try alternative formats
    const altSrc1 = imageSrc.replace(/_/g, '-');
    const altSrc2 = imageSrc.replace(/__/g, '_');
    placementMap.set(altSrc1, placement);
    placementMap.set(altSrc2, placement);
  }
  
  console.log('Step 2: Reading thesis-content-new.ts...');
  const filePath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if file is corrupted
  if (content.includes(']]"') || content.includes('<co[')) {
    console.log('File appears corrupted. Restoring from thesis-content.ts...');
    const backupPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
    if (fs.existsSync(backupPath)) {
      content = fs.readFileSync(backupPath, 'utf-8');
      // Update to use new filename structure if needed
      content = content.replace(/thesis-content\.ts/g, 'thesis-content-new.ts');
    } else {
      console.error('Backup file not found. Please restore manually.');
      return;
    }
  }
  
  console.log('Step 3: Processing each section...');
  
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  
  for (const section of sections) {
    console.log(`\nProcessing ${section}...`);
    
    // Find the content array for this section
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    
    if (!sectionMatch) {
      console.warn(`  Could not find ${section} section`);
      continue;
    }
    
    const sectionContent = sectionMatch[2];
    const sectionStart = sectionMatch.index! + sectionMatch[1].length;
    const sectionEnd = sectionMatch.index! + sectionMatch[1].length + sectionMatch[2].length;
    
    // Find all images in this section
    const images = findImageObjects(sectionContent);
    console.log(`  Found ${images.length} images in ${section}`);
    
    // For each image, find its placement info and determine correct position
    const imageUpdates: Array<{ image: typeof images[0]; placement: ImagePlacement; targetPos: number }> = [];
    
    for (const image of images) {
      const placement = placementMap.get(image.src);
      if (!placement) {
        console.warn(`    No placement info for ${image.src}`);
        continue;
      }
      
      if (!placement.textBefore) {
        console.warn(`    No textBefore for ${image.src}`);
        continue;
      }
      
      // Find where this image should be placed
      const targetPos = findTextInContent(sectionContent, placement.textBefore, 0);
      if (targetPos >= 0) {
        imageUpdates.push({ image, placement, targetPos });
        console.log(`    ${image.src}: will move to position after textBefore`);
      } else {
        console.warn(`    Could not find textBefore for ${image.src}`);
      }
    }
    
    // Sort updates by target position
    imageUpdates.sort((a, b) => a.targetPos - b.targetPos);
    
    // Rebuild section content with images in correct positions
    // This is complex - we'll need to carefully reconstruct the array
    // For now, let's update captions and alt text
    let updatedSectionContent = sectionContent;
    
    for (const { image, placement } of imageUpdates) {
      // Update the image object with correct caption and alt
      const newImageObj = `{ "type": "image", "src": "${image.src}", "alt": "${placement.caption || placement.folderName}", "caption": "${placement.caption || ''}" }`;
      updatedSectionContent = updatedSectionContent.replace(image.fullMatch, newImageObj);
    }
    
    // Replace section content
    const before = content.substring(0, sectionStart);
    const after = content.substring(sectionEnd);
    content = before + updatedSectionContent + after;
  }
  
  console.log('\nStep 4: Writing updated file...');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Done!');
  console.log('\nNote: Image positions may need manual adjustment. Captions and alt text have been updated.');
}

if (require.main === module) {
  main();
}

