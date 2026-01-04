import * as fs from 'fs';
import * as path from 'path';
import {
  parseAllInfoFiles,
  folderNameToImageSrc,
  findTextPosition,
  findImageInContent,
  normalizeText,
  ImagePlacement,
  ImageInfo
} from './fix-image-placements';

interface ContentItem {
  type?: 'image';
  src?: string;
  alt?: string;
  caption?: string;
}

type ContentArray = (string | ContentItem)[];

// Load current thesis content
function loadThesisContent(): any {
  const contentPath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  const content = fs.readFileSync(contentPath, 'utf-8');
  
  // Extract the thesisContent object using regex
  const match = content.match(/export const thesisContent[^=]*=\s*({[\s\S]*});/);
  if (!match) {
    throw new Error('Could not find thesisContent object');
  }
  
  // Use eval to parse the object (in a real scenario, we'd use a proper parser)
  // For now, we'll work with the string and modify it directly
  return { content, match };
}

// Find which section an image belongs to by checking all sections
function findImageSection(
  imageSrc: string,
  introduction: ContentArray,
  methodology: ContentArray,
  results: ContentArray,
  conclusions: ContentArray
): 'introduction' | 'methodology' | 'results' | 'conclusions' | null {
  if (findImageInContent(introduction, imageSrc) >= 0) return 'introduction';
  if (findImageInContent(methodology, imageSrc) >= 0) return 'methodology';
  if (findImageInContent(results, imageSrc) >= 0) return 'results';
  if (findImageInContent(conclusions, imageSrc) >= 0) return 'conclusions';
  return null;
}

// Map all images to their sections and create ImageInfo objects
function mapImagesToSections(
  placements: ImagePlacement[],
  introduction: ContentArray,
  methodology: ContentArray,
  results: ContentArray,
  conclusions: ContentArray
): ImageInfo[] {
  const imageInfos: ImageInfo[] = [];
  
  for (const placement of placements) {
    const imageSrc = folderNameToImageSrc(placement.folderName);
    const section = findImageSection(imageSrc, introduction, methodology, results, conclusions);
    
    if (section) {
      imageInfos.push({
        placement,
        section,
        imageSrc
      });
    } else {
      // Try alternative image src formats
      const altSrc1 = imageSrc.replace(/_/g, '-');
      const altSrc2 = imageSrc.replace(/__/g, '_');
      const section1 = findImageSection(altSrc1, introduction, methodology, results, conclusions);
      const section2 = findImageSection(altSrc2, introduction, methodology, results, conclusions);
      
      if (section1) {
        imageInfos.push({
          placement,
          section: section1,
          imageSrc: altSrc1
        });
      } else if (section2) {
        imageInfos.push({
          placement,
          section: section2,
          imageSrc: altSrc2
        });
      } else {
        console.warn(`Could not find image ${imageSrc} in any section (folder: ${placement.folderName})`);
      }
    }
  }
  
  return imageInfos;
}

// Reorder content array with images in correct positions
function reorderContent(
  content: ContentArray,
  imageInfos: ImageInfo[],
  sectionName: 'introduction' | 'methodology' | 'results' | 'conclusions'
): ContentArray {
  const sectionImages = imageInfos.filter(info => info.section === sectionName);
  
  if (sectionImages.length === 0) {
    return content; // No images to reorder
  }
  
  // Create a new content array
  const newContent: ContentArray = [];
  const processedImages = new Set<string>();
  
  // First, remove all existing images from content
  const textOnlyContent: ContentArray = content.filter(item => {
    if (typeof item === 'string') {
      return true;
    }
    if (item.type === 'image') {
      // Check if this image is in our placement list
      const imageInfo = sectionImages.find(info => info.imageSrc === item.src);
      if (imageInfo) {
        processedImages.add(item.src || '');
        return false; // Remove it, we'll add it back in the right place
      }
      return true; // Keep images not in our list
    }
    return true;
  });
  
  // Now insert images at correct positions
  let currentIndex = 0;
  
  for (const imageInfo of sectionImages) {
    if (!imageInfo.placement.textBefore) {
      // No text before, skip or add at end
      continue;
    }
    
    // Find position where textBefore appears
    const position = findTextPosition(textOnlyContent, imageInfo.placement.textBefore, currentIndex);
    
    if (position >= 0) {
      // Found the position, insert image after this text
      // Check if the text is at the end of a string or we need to split it
      const textItem = textOnlyContent[position];
      
      if (typeof textItem === 'string') {
        // Insert image after this text item
        newContent.push(...textOnlyContent.slice(currentIndex, position + 1));
        
        // Add the image
        const imageItem: ContentItem = {
          type: 'image',
          src: imageInfo.imageSrc,
          alt: imageInfo.placement.caption || imageInfo.placement.folderName,
          caption: imageInfo.placement.caption || undefined
        };
        newContent.push(imageItem);
        
        currentIndex = position + 1;
      }
    } else {
      // Could not find position, try fuzzy matching with shorter snippet
      const shortSnippet = imageInfo.placement.textBefore.substring(0, 50);
      const fuzzyPosition = findTextPosition(textOnlyContent, shortSnippet, currentIndex);
      
      if (fuzzyPosition >= 0) {
        newContent.push(...textOnlyContent.slice(currentIndex, fuzzyPosition + 1));
        
        const imageItem: ContentItem = {
          type: 'image',
          src: imageInfo.imageSrc,
          alt: imageInfo.placement.caption || imageInfo.placement.folderName,
          caption: imageInfo.placement.caption || undefined
        };
        newContent.push(imageItem);
        
        currentIndex = fuzzyPosition + 1;
      } else {
        console.warn(`Could not find position for image ${imageInfo.imageSrc} (${imageInfo.placement.folderName})`);
      }
    }
  }
  
  // Add remaining content
  if (currentIndex < textOnlyContent.length) {
    newContent.push(...textOnlyContent.slice(currentIndex));
  }
  
  // Add any images that weren't placed (shouldn't happen, but just in case)
  for (const imageInfo of sectionImages) {
    if (!processedImages.has(imageInfo.imageSrc || '')) {
      console.warn(`Image ${imageInfo.imageSrc} was not placed, adding at end`);
      const imageItem: ContentItem = {
        type: 'image',
        src: imageInfo.imageSrc,
        alt: imageInfo.placement.caption || imageInfo.placement.folderName,
        caption: imageInfo.placement.caption || undefined
      };
      newContent.push(imageItem);
    }
  }
  
  return newContent;
}

// Main function
function main() {
  console.log('Parsing image placements...');
  const placements = parseAllInfoFiles();
  console.log(`Found ${placements.length} image placements`);
  
  console.log('\nLoading thesis content...');
  const { content: fileContent } = loadThesisContent();
  
  // Extract content arrays using regex (simplified approach)
  // We'll need to parse the actual TypeScript file more carefully
  console.log('\nExtracting content arrays...');
  
  // For now, let's use a different approach - read the actual content structure
  // We'll need to import or parse the actual file
  console.log('Note: This script needs to be integrated with the actual content parsing');
}

if (require.main === module) {
  main();
}

export {
  mapImagesToSections,
  reorderContent,
  findImageSection
};

