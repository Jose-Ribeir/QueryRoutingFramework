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

function extractFigureNumber(src: string, alt: string, caption?: string): number {
  const text = `${src} ${alt} ${caption || ''}`;
  const patterns = [
    /figure[_\s]*(\d+)/i,
    /Figure[_\s]*(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  // For page images, extract page number and add 1000 to put them at the end
  const pageMatch = text.match(/page[_\s]*(\d+)[_\s]*image/i);
  if (pageMatch) {
    return 1000 + parseInt(pageMatch[1], 10);
  }
  
  // No number found - put at end
  return 9999;
}

function findTextInItems(items: ContentItem[], searchText: string): number {
  if (!searchText || searchText.trim().length === 0) return -1;
  const normalizedSearch = normalizeText(searchText);
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item === 'string') {
      const normalizedItem = normalizeText(item);
      const matchingWords = searchWords.filter(sw => 
        normalizedItem.includes(sw)
      );
      if (matchingWords.length >= Math.min(2, searchWords.length)) {
        return i;
      }
    }
  }
  return -1;
}

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

function main() {
  console.log('Step 1: Parsing placements and mapping...');
  const placements = parseAllInfoFiles();
  const imageMapping = createImageMapping();
  
  const placementMap = new Map<string, ImagePlacement>();
  for (const placement of placements) {
    placementMap.set(placement.folderName, placement);
  }
  
  console.log('Step 2: Reading thesis content...');
  const filePath = path.join(process.cwd(), 'content', 'thesis-content.ts');
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
    
    // Separate text and images
    const textItems: string[] = [];
    const imageItems: Array<{ 
      item: ImageItem; 
      figureNumber: number; 
      placement?: ImagePlacement; 
      preferredAfter?: number;
      targetTextIndex?: number;
    }> = [];
    
    items.forEach((item) => {
      if (typeof item === 'string') {
        textItems.push(item);
      } else if (item && typeof item === 'object' && item.type === 'image') {
        const figureNum = extractFigureNumber(item.src, item.alt, item.caption);
        const placement = Array.from(placementMap.entries()).find(([_, p]) => {
          const src = imageMapping.get(p.folderName);
          return src === item.src;
        })?.[1];
        
        let preferredAfter = -1;
        let targetTextIndex = -1;
        if (placement?.textBefore) {
          preferredAfter = findTextInItems(items, placement.textBefore);
          // Convert item index to text index
          if (preferredAfter >= 0) {
            let textCount = 0;
            for (let i = 0; i <= preferredAfter; i++) {
              if (typeof items[i] === 'string') {
                textCount++;
              }
            }
            targetTextIndex = textCount - 1;
          }
        }
        
        imageItems.push({
          item,
          figureNumber: figureNum,
          placement,
          preferredAfter,
          targetTextIndex
        });
      }
    });
    
    console.log(`  Found ${textItems.length} text items and ${imageItems.length} images`);
    
    // Sort images by figure number (ascending) - THIS IS THE PRIORITY
    imageItems.sort((a, b) => a.figureNumber - b.figureNumber);
    
    console.log(`  Image order (by figure number):`);
    imageItems.forEach(img => {
      const figNum = img.figureNumber < 1000 ? `Figure ${img.figureNumber}` : `Page ${img.figureNumber - 1000}`;
      const targetInfo = img.targetTextIndex >= 0 ? ` (target: after text ${img.targetTextIndex})` : ' (no target)';
      console.log(`    ${figNum}: ${path.basename(img.item.src)}${targetInfo}`);
    });
    
    // Build new content array
    // Strategy: Place images in figure number order, but try to place them after their target text
    // If target text comes later, place image as early as possible while maintaining order
    
    const newItems: ContentItem[] = [];
    let textIndex = 0;
    let imageIndex = 0;
    let lastPlacedFigureNum = -1;
    
    // Create a plan: for each image, determine where it should be placed
    // Images must appear in figure number order, but can be placed after their target text
    const imagePlacements: Array<{ image: typeof imageItems[0]; insertAfterTextIndex: number }> = [];
    
    for (const img of imageItems) {
      let insertAfter = -1;
      
      // If image has a target text index, try to place it there
      if (img.targetTextIndex >= 0 && img.targetTextIndex < textItems.length) {
        // Check if we can place it here (must be after last placed figure)
        if (img.figureNumber > lastPlacedFigureNum) {
          insertAfter = img.targetTextIndex;
        } else {
          // Can't place here - figure number order violated
          // Place it after the last placed image's position
          if (imagePlacements.length > 0) {
            insertAfter = Math.max(
              imagePlacements[imagePlacements.length - 1].insertAfterTextIndex + 1,
              img.targetTextIndex
            );
          } else {
            insertAfter = img.targetTextIndex;
          }
        }
      } else {
        // No target - place after last image or distribute evenly
        if (imagePlacements.length > 0) {
          insertAfter = imagePlacements[imagePlacements.length - 1].insertAfterTextIndex + 1;
        } else {
          insertAfter = 0;
        }
      }
      
      // Ensure we don't go beyond text items
      insertAfter = Math.min(insertAfter, textItems.length - 1);
      
      imagePlacements.push({ image: img, insertAfterTextIndex: insertAfter });
      lastPlacedFigureNum = img.figureNumber;
    }
    
    // Now build the content array
    textIndex = 0;
    imageIndex = 0;
    
    for (let i = 0; i < textItems.length; i++) {
      newItems.push(textItems[i]);
      
      // Check if last item was an image
      const lastWasImage = newItems.length > 0 && 
        typeof newItems[newItems.length - 1] === 'object' && 
        newItems[newItems.length - 1].type === 'image';
      
      // Place images that should go after this text
      while (imageIndex < imagePlacements.length && 
             imagePlacements[imageIndex].insertAfterTextIndex === i) {
        if (!lastWasImage) {
          const placement = imagePlacements[imageIndex];
          const imageItem: ImageItem = {
            type: 'image',
            src: placement.image.item.src,
            alt: placement.image.placement?.caption || placement.image.item.alt,
            caption: placement.image.placement?.caption || placement.image.item.caption
          };
          newItems.push(imageItem);
          imageIndex++;
        } else {
          // Can't place consecutively - move to next text position
          imagePlacements[imageIndex].insertAfterTextIndex = i + 1;
          // Re-sort remaining placements
          imagePlacements.sort((a, b) => {
            if (a.insertAfterTextIndex !== b.insertAfterTextIndex) {
              return a.insertAfterTextIndex - b.insertAfterTextIndex;
            }
            return a.image.figureNumber - b.image.figureNumber;
          });
          break;
        }
      }
    }
    
    // Add any remaining images at the end
    while (imageIndex < imagePlacements.length) {
      const placement = imagePlacements[imageIndex];
      const imageItem: ImageItem = {
        type: 'image',
        src: placement.image.item.src,
        alt: placement.image.placement?.caption || placement.image.item.alt,
        caption: placement.image.placement?.caption || placement.image.item.caption
      };
      newItems.push(imageItem);
      imageIndex++;
    }
    
    const serialized = serializeContentArray(newItems, '  ');
    const before = content.substring(0, sectionStart);
    const after = content.substring(sectionEnd);
    content = before + serialized + after;
    
    console.log(`  ✅ Placed ${imageItems.length} images in figure number order`);
  }
  
  console.log('\nStep 3: Writing updated file...');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Done! Images placed in figure number order (low to high).');
}

if (require.main === module) {
  main();
}

