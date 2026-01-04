import * as fs from 'fs';
import * as path from 'path';
import {
  parseAllInfoFiles,
  normalizeText,
  ImagePlacement
} from './fix-image-placements';
import { createImageMapping } from './fix-image-mapping';

interface ImageItem {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

type ContentItem = string | ImageItem;

// Improved fuzzy text matching
function findTextPositionFuzzy(
  items: ContentItem[],
  searchText: string,
  startIndex: number = 0
): number {
  if (!searchText || searchText.trim().length === 0) {
    return -1;
  }

  const normalizedSearch = normalizeText(searchText);
  
  // Try different search strategies
  const searchStrategies = [
    // Strategy 1: Full text match (first 200 chars)
    normalizedSearch.substring(0, 200),
    // Strategy 2: First 100 chars
    normalizedSearch.substring(0, 100),
    // Strategy 3: First 50 chars
    normalizedSearch.substring(0, 50),
    // Strategy 4: Last 100 chars (in case textBefore is at end)
    normalizedSearch.substring(Math.max(0, normalizedSearch.length - 100)),
    // Strategy 5: Extract key phrases (words longer than 4 chars)
    normalizedSearch.split(/\s+/).filter(w => w.length > 4).slice(0, 5).join(' '),
  ];

  for (const strategy of searchStrategies) {
    if (strategy.length < 20) continue; // Skip too short strategies
    
    for (let i = startIndex; i < items.length; i++) {
      const item = items[i];
      if (typeof item === 'string') {
        const normalizedItem = normalizeText(item);
        
        // Check if strategy text appears in this string
        if (normalizedItem.includes(strategy)) {
          return i;
        }
        
        // Also check for word overlap (at least 3 significant words match)
        const searchWords = strategy.split(/\s+/).filter(w => w.length > 3);
        const itemWords = normalizedItem.split(/\s+/).filter(w => w.length > 3);
        const matchingWords = searchWords.filter(sw => 
          itemWords.some(iw => iw.includes(sw) || sw.includes(iw))
        );
        
        if (matchingWords.length >= Math.min(3, searchWords.length)) {
          return i;
        }
      }
    }
  }

  return -1;
}

// Parse content array from string
function parseContentArray(contentStr: string): ContentItem[] {
  const items: ContentItem[] = [];
  let i = 0;
  let depth = 0;
  let inString = false;
  let stringDelim = '';
  let currentItem = '';
  let escapeNext = false;
  
  while (i < contentStr.length) {
    const char = contentStr[i];
    
    if (escapeNext) {
      currentItem += char;
      escapeNext = false;
      i++;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      currentItem += char;
      i++;
      continue;
    }
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringDelim = char;
      currentItem += char;
    } else if (inString && char === stringDelim) {
      inString = false;
      currentItem += char;
    } else if (!inString && char === '{') {
      depth++;
      currentItem += char;
    } else if (!inString && char === '}') {
      depth--;
      currentItem += char;
      if (depth === 0) {
        // Complete object
        try {
          const jsonStr = currentItem.replace(/'/g, '"');
          const parsed = JSON.parse(jsonStr);
          items.push(parsed);
        } catch (e) {
          // Manual extraction
          const srcMatch = currentItem.match(/"src":\s*"([^"]+)"/);
          const altMatch = currentItem.match(/"alt":\s*"([^"]*)"/);
          const captionMatch = currentItem.match(/"caption":\s*"([^"]*)"/);
          if (srcMatch) {
            items.push({
              type: 'image',
              src: srcMatch[1],
              alt: altMatch ? altMatch[1] : '',
              caption: captionMatch ? captionMatch[1] : undefined
            });
          }
        }
        currentItem = '';
        while (i + 1 < contentStr.length && /[,\s]/.test(contentStr[i + 1]) && contentStr[i + 1] !== ']') {
          i++;
        }
      }
    } else if (!inString && depth === 0 && char === ',') {
      if (currentItem.trim()) {
        const trimmed = currentItem.trim();
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          const unescaped = trimmed.slice(1, -1)
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');
          items.push(unescaped);
        } else {
          items.push(trimmed);
        }
        currentItem = '';
      }
    } else {
      currentItem += char;
    }
    
    i++;
  }
  
  if (currentItem.trim()) {
    const trimmed = currentItem.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      const unescaped = trimmed.slice(1, -1)
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\');
      items.push(unescaped);
    } else if (trimmed) {
      try {
        const jsonStr = trimmed.replace(/'/g, '"');
        const parsed = JSON.parse(jsonStr);
        items.push(parsed);
      } catch (e) {
        items.push(trimmed);
      }
    }
  }
  
  return items;
}

// Serialize content array
function serializeContentArray(items: ContentItem[], indent: string = '  '): string {
  const lines: string[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let itemStr = '';
    
    if (typeof item === 'string') {
      const escaped = item
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      itemStr = `"${escaped}"`;
    } else if (item && typeof item === 'object' && item.type === 'image') {
      const parts: string[] = [`"type": "image"`];
      parts.push(`"src": "${item.src.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      parts.push(`"alt": "${(item.alt || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      if (item.caption) {
        parts.push(`"caption": "${item.caption.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      }
      itemStr = `{ ${parts.join(', ')} }`;
    }
    
    lines.push(`${indent}${itemStr}${i < items.length - 1 ? ',' : ''}`);
  }
  
  return lines.join('\n');
}

// Reorder content with proper image placement
function reorderContentWithImages(
  items: ContentItem[],
  imagePlacements: Map<string, { placement: ImagePlacement; targetIndex: number }>
): ContentItem[] {
  // Separate all items
  const textItems: Array<{ item: string; index: number }> = [];
  const imageItems: Array<{ item: ImageItem; index: number; placement?: ImagePlacement; targetIndex?: number }> = [];
  
  items.forEach((item, index) => {
    if (typeof item === 'string') {
      textItems.push({ item, index });
    } else if (item.type === 'image') {
      const placementInfo = imagePlacements.get(item.src);
      imageItems.push({
        item,
        index,
        placement: placementInfo?.placement,
        targetIndex: placementInfo?.targetIndex
      });
    }
  });
  
  // Build new array
  const newItems: ContentItem[] = [];
  const usedImageIndices = new Set<number>();
  
  // Group images by target index to handle duplicates
  const imagesByTarget = new Map<number, Array<typeof imageItems[0]>>();
  const imagesWithoutTargets: Array<typeof imageItems[0]> = [];
  
  for (const imageInfo of imageItems) {
    if (imageInfo.targetIndex !== undefined && imageInfo.targetIndex >= 0) {
      if (!imagesByTarget.has(imageInfo.targetIndex)) {
        imagesByTarget.set(imageInfo.targetIndex, []);
      }
      imagesByTarget.get(imageInfo.targetIndex)!.push(imageInfo);
    } else {
      imagesWithoutTargets.push(imageInfo);
    }
  }
  
  // Sort target indices
  const sortedTargets = Array.from(imagesByTarget.keys()).sort((a, b) => a - b);
  
  // Process images with targets, handling duplicates by spacing them
  let textIndex = 0;
  let lastImagePosition = -1;
  let lastImageTarget = -1;
  
  for (const targetIdx of sortedTargets) {
    const imagesAtTarget = imagesByTarget.get(targetIdx)!;
    
    // Handle position 0 and low positions carefully to avoid clustering
    // If multiple images target the same low position, distribute them
    if (targetIdx <= 2 && imagesAtTarget.length > 1) {
      // Distribute images evenly throughout the content, starting from target position
      const totalTextItems = textItems.length;
      const distributionSpacing = Math.max(2, Math.floor(totalTextItems / (imagesAtTarget.length + 1)));
      
      for (let i = 0; i < imagesAtTarget.length; i++) {
        const imageInfo = imagesAtTarget[i];
        
        if (i === 0) {
          // First image: add text up to target position, then image
          while (textIndex <= targetIdx && textIndex < textItems.length) {
            newItems.push(textItems[textIndex].item);
            textIndex++;
          }
        } else {
          // Subsequent images: space them out with at least 2 text items between
          const spacing = Math.max(2, distributionSpacing);
          for (let j = 0; j < spacing && textIndex < textItems.length; j++) {
            newItems.push(textItems[textIndex].item);
            textIndex++;
          }
        }
        
        const imageItem: ImageItem = {
          type: 'image',
          src: imageInfo.item.src,
          alt: imageInfo.placement?.caption || imageInfo.item.alt,
          caption: imageInfo.placement?.caption || imageInfo.item.caption
        };
        newItems.push(imageItem);
        usedImageIndices.add(imageInfo.index);
        lastImagePosition = textIndex;
        lastImageTarget = targetIdx;
      }
      continue;
    }
    
    // Add text items up to target position
    while (textIndex <= targetIdx && textIndex < textItems.length) {
      newItems.push(textItems[textIndex].item);
      textIndex++;
    }
    
    // If multiple images target the same position, space them out with text between
    if (imagesAtTarget.length > 1 && targetIdx === lastImageTarget) {
      // Add a text item between images at the same position
      if (textIndex < textItems.length) {
        newItems.push(textItems[textIndex].item);
        textIndex++;
      }
    }
    
    // Add all images at this target position
    for (let i = 0; i < imagesAtTarget.length; i++) {
      const imageInfo = imagesAtTarget[i];
      
      // If not the first image at this position, add some spacing
      if (i > 0 && textIndex < textItems.length) {
        newItems.push(textItems[textIndex].item);
        textIndex++;
      }
      
      const imageItem: ImageItem = {
        type: 'image',
        src: imageInfo.item.src,
        alt: imageInfo.placement?.caption || imageInfo.item.alt,
        caption: imageInfo.placement?.caption || imageInfo.item.caption
      };
      newItems.push(imageItem);
      usedImageIndices.add(imageInfo.index);
      lastImagePosition = textIndex;
      lastImageTarget = targetIdx;
    }
  }
  
  // Distribute images without targets throughout remaining text (don't cluster at end)
  let imagesWithoutTargetsIndex = 0;
  const remainingTextCount = textItems.length - textIndex;
  const spacingForUnmatched = remainingTextCount > 0 && imagesWithoutTargets.length > 0 
    ? Math.max(1, Math.floor(remainingTextCount / (imagesWithoutTargets.length + 1)))
    : 0;
  
  while (textIndex < textItems.length || imagesWithoutTargetsIndex < imagesWithoutTargets.length) {
    // Add text items with spacing for unmatched images
    if (textIndex < textItems.length) {
      newItems.push(textItems[textIndex].item);
      textIndex++;
      
      // After spacing, add an unmatched image if available
      if (imagesWithoutTargetsIndex < imagesWithoutTargets.length && 
          spacingForUnmatched > 0 && 
          (textIndex - lastImagePosition >= spacingForUnmatched || lastImagePosition < 0)) {
        const imageInfo = imagesWithoutTargets[imagesWithoutTargetsIndex];
        const imageItem: ImageItem = {
          type: 'image',
          src: imageInfo.item.src,
          alt: imageInfo.placement?.caption || imageInfo.item.alt,
          caption: imageInfo.placement?.caption || imageInfo.item.caption
        };
        newItems.push(imageItem);
        imagesWithoutTargetsIndex++;
        lastImagePosition = textIndex;
      }
    } else if (imagesWithoutTargetsIndex < imagesWithoutTargets.length) {
      // No more text, but still have unmatched images - add them with spacing
      if (lastImagePosition >= 0) {
        // Add a separator if we just added an image
        const imageInfo = imagesWithoutTargets[imagesWithoutTargetsIndex];
        const imageItem: ImageItem = {
          type: 'image',
          src: imageInfo.item.src,
          alt: imageInfo.placement?.caption || imageInfo.item.alt,
          caption: imageInfo.placement?.caption || imageInfo.item.caption
        };
        newItems.push(imageItem);
        imagesWithoutTargetsIndex++;
      } else {
        // Just add remaining images
        const imageInfo = imagesWithoutTargets[imagesWithoutTargetsIndex];
        const imageItem: ImageItem = {
          type: 'image',
          src: imageInfo.item.src,
          alt: imageInfo.placement?.caption || imageInfo.item.alt,
          caption: imageInfo.placement?.caption || imageInfo.item.caption
        };
        newItems.push(imageItem);
        imagesWithoutTargetsIndex++;
      }
    }
  }
  
  return newItems;
}

// Main function
function main() {
  console.log('Step 1: Parsing image placements...');
  const placements = parseAllInfoFiles();
  console.log(`Found ${placements.length} placements\n`);
  
  console.log('Step 2: Creating image mapping...');
  const imageMapping = createImageMapping();
  console.log(`Mapped ${imageMapping.size} images\n`);
  
  console.log('Step 3: Reading thesis content...');
  const filePath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // First, extract all sections to search across them
  const allSections: Map<string, { items: ContentItem[]; start: number; end: number; content: string }> = new Map();
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  
  for (const section of sections) {
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    if (sectionMatch) {
      const sectionContent = sectionMatch[2];
      const sectionStart = sectionMatch.index! + sectionMatch[1].length;
      const sectionEnd = sectionMatch.index! + sectionMatch[1].length + sectionMatch[2].length;
      const items = parseContentArray(sectionContent);
      allSections.set(section, { items, start: sectionStart, end: sectionEnd, content: sectionContent });
    }
  }
  
  for (const section of sections) {
    console.log(`\nProcessing ${section}...`);
    
    const sectionData = allSections.get(section);
    if (!sectionData) {
      console.warn(`  Could not find ${section} section`);
      continue;
    }
    
    const { items, start: sectionStart, end: sectionEnd } = sectionData;
    console.log(`  Parsed ${items.length} items`);
    
    // Count consecutive images
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    for (const item of items) {
      if (typeof item === 'object' && item.type === 'image') {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    console.log(`  Found ${maxConsecutive} consecutive images (needs fixing)`);
    
    // Map images to placements and find target positions
    // Search across ALL sections to find where text actually appears
    const imagePlacements = new Map<string, { placement: ImagePlacement; targetIndex: number; targetSection: string }>();
    
    for (const placement of placements) {
      const imageSrc = imageMapping.get(placement.folderName);
      if (!imageSrc) continue;
      
      // Check if this image is in the current section
      const imageIndex = items.findIndex(
        (item): item is ImageItem => typeof item === 'object' && item.type === 'image' && item.src === imageSrc
      );
      
      if (imageIndex < 0) continue;
      
      // Search for text in ALL sections, not just current one
      let targetIndex = -1;
      let targetSection = section;
      
      if (placement.textBefore && placement.textBefore.trim().length > 0) {
        // Try current section first
        targetIndex = findTextPositionFuzzy(items, placement.textBefore, 0);
        
        // If not found, try other sections
        if (targetIndex < 0) {
          for (const [secName, secData] of allSections.entries()) {
            const foundIndex = findTextPositionFuzzy(secData.items, placement.textBefore, 0);
            if (foundIndex >= 0) {
              targetIndex = foundIndex;
              targetSection = secName;
              break;
            }
          }
        }
      }
      
      // If textBefore didn't work, try textAfter
      if (targetIndex < 0 && placement.textAfter && placement.textAfter.trim().length > 20) {
        targetIndex = findTextPositionFuzzy(items, placement.textAfter, 0);
        if (targetIndex >= 0 && targetIndex > 0) {
          targetIndex = targetIndex - 1;
          if (targetIndex <= 0) targetIndex = -1;
        }
        
        // If still not found, try other sections
        if (targetIndex < 0) {
          for (const [secName, secData] of allSections.entries()) {
            const foundIndex = findTextPositionFuzzy(secData.items, placement.textAfter, 0);
            if (foundIndex >= 0 && foundIndex > 0) {
              targetIndex = foundIndex - 1;
              targetSection = secName;
              break;
            }
          }
        }
      }
      
      // Only place in current section if target is also in current section
      // Otherwise, we'll handle cross-section moves separately
      if (targetIndex >= 0 && targetSection === section) {
        imagePlacements.set(imageSrc, { placement, targetIndex, targetSection });
        console.log(`    ✓ ${imageSrc.substring(imageSrc.lastIndexOf('/') + 1)}: position ${targetIndex}`);
      } else if (targetIndex >= 0) {
        console.log(`    → ${imageSrc.substring(imageSrc.lastIndexOf('/') + 1)}: should be in ${targetSection} (position ${targetIndex})`);
        // For now, place it at a distributed position in current section to avoid clustering
        // Calculate a distributed position
        const distributedPos = Math.floor((items.length * 0.3) + (imageIndex % 3) * Math.floor(items.length * 0.2));
        imagePlacements.set(imageSrc, { placement, targetIndex: distributedPos, targetSection: section });
      } else {
        console.log(`    ✗ ${imageSrc.substring(imageSrc.lastIndexOf('/') + 1)}: could not find position`);
      }
    }
    
    // Reorder content (only use placements for current section)
    const sectionPlacements = new Map<string, { placement: ImagePlacement; targetIndex: number }>();
    for (const [src, info] of imagePlacements.entries()) {
      if (info.targetSection === section) {
        sectionPlacements.set(src, { placement: info.placement, targetIndex: info.targetIndex });
      }
    }
    const reordered = reorderContentWithImages(items, sectionPlacements);
    console.log(`  Reordered to ${reordered.length} items`);
    
    // Check consecutive images after reordering
    let newMaxConsecutive = 0;
    let newCurrentConsecutive = 0;
    for (const item of reordered) {
      if (typeof item === 'object' && item.type === 'image') {
        newCurrentConsecutive++;
        newMaxConsecutive = Math.max(newMaxConsecutive, newCurrentConsecutive);
      } else {
        newCurrentConsecutive = 0;
      }
    }
    console.log(`  After reordering: ${newMaxConsecutive} consecutive images`);
    
    // Serialize back
    const serialized = serializeContentArray(reordered, '  ');
    
    // Replace in content
    const before = content.substring(0, sectionStart);
    const after = content.substring(sectionEnd);
    content = before + serialized + after;
  }
  
  console.log('\nStep 4: Writing updated file...');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Done!');
}

if (require.main === module) {
  main();
}

