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

// Parse content array from string (simplified - handles the actual format)
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
          // Try to parse as JSON
          const jsonStr = currentItem.replace(/'/g, '"');
          const parsed = JSON.parse(jsonStr);
          items.push(parsed);
        } catch (e) {
          // If parsing fails, try to extract manually
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
        // Skip comma and whitespace
        while (i + 1 < contentStr.length && /[,\s]/.test(contentStr[i + 1])) {
          i++;
        }
      }
    } else if (!inString && depth === 0 && char === ',') {
      // End of string item
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
  
  // Handle last item
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

// Serialize content array back to string
function serializeContentArray(items: ContentItem[], indent: string = '  '): string {
  const lines: string[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let itemStr = '';
    
    if (typeof item === 'string') {
      // Escape and quote string
      const escaped = item
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      itemStr = `"${escaped}"`;
    } else if (item && typeof item === 'object' && item.type === 'image') {
      // Serialize image object
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

// Find text position in content array
function findTextPosition(items: ContentItem[], searchText: string, startIndex: number = 0): number {
  const normalizedSearch = normalizeText(searchText);
  const searchSnippet = normalizedSearch.substring(0, Math.min(150, normalizedSearch.length));
  
  for (let i = startIndex; i < items.length; i++) {
    const item = items[i];
    if (typeof item === 'string') {
      const normalizedItem = normalizeText(item);
      if (normalizedItem.includes(searchSnippet) ||
          normalizedItem.includes(normalizedSearch.substring(0, 50))) {
        return i;
      }
    }
  }
  
  return -1;
}

// Reorder content array with images in correct positions
function reorderContent(
  items: ContentItem[],
  imagePlacements: Map<string, { placement: ImagePlacement; targetIndex: number }>
): ContentItem[] {
  // Separate text and images
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
  let textIndex = 0;
  const usedImages = new Set<number>();
  
  // Sort images by target index
  const sortedImages = imageItems
    .filter(img => img.targetIndex !== undefined)
    .sort((a, b) => (a.targetIndex || 0) - (b.targetIndex || 0));
  
  // Place images at their target positions
  for (const imageInfo of sortedImages) {
    const targetIdx = imageInfo.targetIndex!;
    
    // Add text items up to target position
    while (textIndex <= targetIdx && textIndex < textItems.length) {
      newItems.push(textItems[textIndex].item);
      textIndex++;
    }
    
    // Add the image
    const imageItem: ImageItem = {
      type: 'image',
      src: imageInfo.item.src,
      alt: imageInfo.placement?.caption || imageInfo.item.alt,
      caption: imageInfo.placement?.caption || imageInfo.item.caption
    };
    newItems.push(imageItem);
    usedImages.add(imageInfo.index);
  }
  
  // Add remaining text items
  while (textIndex < textItems.length) {
    newItems.push(textItems[textIndex].item);
    textIndex++;
  }
  
  // Add images that weren't placed (no textBefore or couldn't find position)
  for (const imageInfo of imageItems) {
    if (!usedImages.has(imageInfo.index)) {
      const imageItem: ImageItem = {
        type: 'image',
        src: imageInfo.item.src,
        alt: imageInfo.placement?.caption || imageInfo.item.alt,
        caption: imageInfo.placement?.caption || imageInfo.item.caption
      };
      newItems.push(imageItem);
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
  
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  
  for (const section of sections) {
    console.log(`\nProcessing ${section}...`);
    
    // Extract section content array
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    
    if (!sectionMatch) {
      console.warn(`  Could not find ${section} section`);
      continue;
    }
    
    const sectionContent = sectionMatch[2];
    const sectionStart = sectionMatch.index! + sectionMatch[1].length;
    const sectionEnd = sectionMatch.index! + sectionMatch[1].length + sectionMatch[2].length;
    
    // Parse content array
    const items = parseContentArray(sectionContent);
    console.log(`  Parsed ${items.length} items`);
    
    // Map images to placements and find target positions
    const imagePlacements = new Map<string, { placement: ImagePlacement; targetIndex: number }>();
    
    for (const placement of placements) {
      const imageSrc = imageMapping.get(placement.folderName);
      if (!imageSrc) continue;
      
      // Check if this image is in the current section
      const imageIndex = items.findIndex(
        (item): item is ImageItem => typeof item === 'object' && item.type === 'image' && item.src === imageSrc
      );
      
      if (imageIndex < 0) continue;
      
      // Find target position based on textBefore
      if (placement.textBefore) {
        const targetIndex = findTextPosition(items, placement.textBefore, 0);
        if (targetIndex >= 0) {
          imagePlacements.set(imageSrc, { placement, targetIndex });
          console.log(`    ${imageSrc}: target position ${targetIndex}`);
        }
      }
    }
    
    // Reorder content
    const reordered = reorderContent(items, imagePlacements);
    console.log(`  Reordered to ${reordered.length} items`);
    
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

