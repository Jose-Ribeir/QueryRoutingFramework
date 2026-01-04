import * as fs from 'fs';
import * as path from 'path';
import {
  parseAllInfoFiles,
  normalizeText,
  ImagePlacement
} from './fix-image-placements';
import { createImageMapping } from './fix-image-mapping';

// Simple approach: ensure no two images are ever consecutive
// Distribute all images evenly throughout text content

interface ImageItem {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

type ContentItem = string | ImageItem;

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
        try {
          const jsonStr = currentItem.replace(/'/g, '"');
          const parsed = JSON.parse(jsonStr);
          items.push(parsed);
        } catch (e) {
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

function findTextPositionFuzzy(items: ContentItem[], searchText: string): number {
  if (!searchText || searchText.trim().length === 0) return -1;
  const normalizedSearch = normalizeText(searchText);
  const searchSnippet = normalizedSearch.substring(0, Math.min(100, normalizedSearch.length));
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item === 'string') {
      const normalizedItem = normalizeText(item);
      if (normalizedItem.includes(searchSnippet)) {
        return i;
      }
    }
  }
  return -1;
}

// Distribute images ensuring no two are consecutive
function distributeImagesNoConsecutive(
  items: ContentItem[],
  placements: Map<string, ImagePlacement>,
  imageMapping: Map<string, string>
): ContentItem[] {
  // Separate text and images
  const textItems: string[] = [];
  const imageInfos: Array<{ item: ImageItem; placement?: ImagePlacement; preferredPos?: number }> = [];
  
  items.forEach((item) => {
    if (typeof item === 'string') {
      textItems.push(item);
    } else if (item.type === 'image') {
      const placement = Array.from(placements.entries()).find(([_, p]) => {
        const src = imageMapping.get(p.folderName);
        return src === item.src;
      })?.[1];
      
      let preferredPos = -1;
      if (placement?.textBefore) {
        preferredPos = findTextPositionFuzzy(items, placement.textBefore);
      }
      
      imageInfos.push({ item, placement, preferredPos });
    }
  });
  
  if (imageInfos.length === 0) return items;
  if (textItems.length === 0) return items;
  
  // Calculate spacing: ensure at least 1 text item between images when possible
  // If we have more images than text, we'll need to cluster some at the end
  const totalSlots = textItems.length;
  const imageCount = imageInfos.length;
  
  // If we have enough text, space images evenly
  // Otherwise, place images after each text item, then cluster remaining at end
  const canSpaceEvenly = imageCount <= totalSlots;
  const spacing = canSpaceEvenly ? Math.max(1, Math.floor(totalSlots / (imageCount + 1))) : 1;
  
  // Build new array
  const newItems: ContentItem[] = [];
  let textIndex = 0;
  let imageIndex = 0;
  
  // Sort images by preferred position
  const sortedImages = [...imageInfos].sort((a, b) => {
    if (a.preferredPos !== undefined && a.preferredPos >= 0) {
      if (b.preferredPos !== undefined && b.preferredPos >= 0) {
        return a.preferredPos - b.preferredPos;
      }
      return -1;
    }
    if (b.preferredPos !== undefined && b.preferredPos >= 0) return 1;
    return 0;
  });
  
  // Strategy: Place images after text paragraphs when possible
  // If more images than text, place one after each text, then cluster rest at end
  let imagesPlaced = 0;
  const maxImagesWithText = Math.min(sortedImages.length, textItems.length);
  
  for (let i = 0; i < sortedImages.length; i++) {
    const imageInfo = sortedImages[i];
    const preferredPos = imageInfo.preferredPos !== undefined && imageInfo.preferredPos >= 0 
      ? imageInfo.preferredPos 
      : -1;
    
    // Calculate target position
    let targetTextIndex: number;
    if (preferredPos >= 0 && preferredPos < textItems.length) {
      // Use preferred position if valid
      targetTextIndex = preferredPos;
    } else if (i < maxImagesWithText) {
      // Place images after text items when we have enough text
      // Distribute: place after text items at positions: 0, 1, 2, 3, 4, etc.
      targetTextIndex = Math.min(i, textItems.length - 1);
    } else {
      // More images than text: cluster at end after last text
      targetTextIndex = textItems.length - 1;
    }
    
    // Ensure we have at least one text item before this image (when possible)
    if (targetTextIndex < textIndex) {
      targetTextIndex = textIndex;
    }
    
    // Add text items up to target
    while (textIndex <= targetTextIndex && textIndex < textItems.length) {
      newItems.push(textItems[textIndex]);
      textIndex++;
    }
    
    // Add image
    const imageItem: ImageItem = {
      type: 'image',
      src: imageInfo.item.src,
      alt: imageInfo.placement?.caption || imageInfo.item.alt,
      caption: imageInfo.placement?.caption || imageInfo.item.caption
    };
    newItems.push(imageItem);
    imagesPlaced++;
    
    // Add text after image if available (to prevent consecutive images)
    if (textIndex < textItems.length) {
      newItems.push(textItems[textIndex]);
      textIndex++;
    }
    // If no more text and more images remain, they will be consecutive (unavoidable)
  }
  
  // Add remaining text
  while (textIndex < textItems.length) {
    newItems.push(textItems[textIndex]);
    textIndex++;
  }
  
  return newItems;
}

function main() {
  console.log('Parsing placements and mapping...');
  const placements = parseAllInfoFiles();
  const imageMapping = createImageMapping();
  
  const placementMap = new Map<string, ImagePlacement>();
  for (const placement of placements) {
    placementMap.set(placement.folderName, placement);
  }
  
  console.log('Reading thesis content...');
  const filePath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  
  for (const section of sections) {
    console.log(`\nProcessing ${section}...`);
    
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    
    if (!sectionMatch) {
      console.warn(`  Could not find ${section} section`);
      continue;
    }
    
    const sectionContent = sectionMatch[2];
    const sectionStart = sectionMatch.index! + sectionMatch[1].length;
    const sectionEnd = sectionMatch.index! + sectionMatch[1].length + sectionMatch[2].length;
    
    const items = parseContentArray(sectionContent);
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
    console.log(`  Found ${maxConsecutive} consecutive images`);
    
    // Distribute images
    const distributed = distributeImagesNoConsecutive(items, placementMap, imageMapping);
    
    // Check consecutive images after
    let newMaxConsecutive = 0;
    currentConsecutive = 0;
    for (const item of distributed) {
      if (typeof item === 'object' && item.type === 'image') {
        currentConsecutive++;
        newMaxConsecutive = Math.max(newMaxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    console.log(`  After distribution: ${newMaxConsecutive} consecutive images`);
    
    const serialized = serializeContentArray(distributed, '  ');
    const before = content.substring(0, sectionStart);
    const after = content.substring(sectionEnd);
    content = before + serialized + after;
  }
  
  console.log('\nWriting updated file...');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Done!');
}

if (require.main === module) {
  main();
}

